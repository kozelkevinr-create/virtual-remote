// The slice of Home Assistant's frontend API this card uses, plus small helpers.

import type { Haptic } from "./types";

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  user?: { is_admin: boolean };
  language?: string;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(callback: (msg: T) => void, msg: Record<string, unknown>): Promise<() => void>;
  };
}

export function fireEvent(node: EventTarget, type: string, detail?: unknown): void {
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

/** The companion app turns this window event into a real vibration. */
export function haptic(kind: Haptic | undefined): void {
  if (kind && kind !== "none") fireEvent(window, "haptic", kind);
}

export function navigate(path: string): void {
  history.pushState(null, "", path);
  fireEvent(window, "location-changed", { replace: false });
}

export function toast(node: EventTarget, message: string): void {
  fireEvent(node, "hass-notification", { message });
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as any).message);
  return String(err);
}

/**
 * HA's form elements (ha-form, selectors) are lazy-loaded. Creating an entities
 * card's editor pulls them in; without this the editor renders blank boxes.
 */
export async function loadHaFormElements(): Promise<void> {
  if (customElements.get("ha-form") && customElements.get("ha-selector")) return;
  const helpers = await (window as any).loadCardHelpers?.();
  if (!helpers) return;
  const card = await helpers.createCardElement({ type: "entities", entities: [] });
  await card?.constructor?.getConfigElement?.();
  await customElements.whenDefined("ha-form");
}
