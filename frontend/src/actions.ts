// Turning a press into something happening. Stored remotes go through
// remote.send_command so the card and automations share one code path;
// only browser-side actions (navigate, more-info, url) run here directly.

import { fireEvent, navigate, type HomeAssistant } from "./ha";
import type { ActionConfig, ButtonConfig } from "./types";

const SERVER_ACTIONS = new Set(["perform-action", "none"]);

export function actionFor(button: ButtonConfig, hold: boolean): ActionConfig {
  const hold_action = button.hold_action ?? { action: "none" };
  if (hold && hold_action.action !== "none") return hold_action;
  return button.tap_action ?? { action: "none" };
}

export function hasHoldAction(button: ButtonConfig): boolean {
  return (button.hold_action?.action ?? "none") !== "none";
}

export interface PressContext {
  hass: HomeAssistant;
  node: EventTarget;
  /** The remote.* entity of a stored remote; undefined for inline remotes. */
  entityId?: string;
}

export async function press(ctx: PressContext, button: ButtonConfig, hold = false): Promise<void> {
  const action = actionFor(button, hold);
  if (action.action === "none") return;

  if (!SERVER_ACTIONS.has(action.action)) {
    runBrowserAction(ctx.node, action);
    return;
  }

  if (ctx.entityId) {
    await ctx.hass.callService(
      "remote",
      "send_command",
      { command: button.id, ...(hold ? { hold_secs: 0.5 } : {}) },
      { entity_id: ctx.entityId },
    );
    return;
  }

  // Inline remote: no entity to route through, so call the action directly.
  const [domain, service] = (action.perform_action ?? "").split(".", 2);
  if (!domain || !service) throw new Error(`Button ${button.id} has no action to perform`);
  await ctx.hass.callService(domain, service, action.data, action.target);
}

function runBrowserAction(node: EventTarget, action: ActionConfig): void {
  switch (action.action) {
    case "navigate":
      if (action.navigation_path) navigate(action.navigation_path);
      break;
    case "url":
      if (action.url_path) window.open(action.url_path, "_blank", "noopener");
      break;
    case "more-info":
      if (action.entity) fireEvent(node, "hass-more-info", { entityId: action.entity });
      break;
  }
}

/** The remote.* entity whose `remote_id` attribute matches, whatever it was renamed to. */
export function findRemoteEntity(hass: HomeAssistant, remoteId: string): string | undefined {
  for (const [entityId, state] of Object.entries(hass.states)) {
    if (entityId.startsWith("remote.") && state.attributes.remote_id === remoteId) return entityId;
  }
  return undefined;
}
