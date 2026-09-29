// <vr-button-sheet>: settings for one button, built on HA's own ha-form and
// selectors (icon picker, ui_action action editor, theme colours).

import { LitElement, css, html, nothing } from "lit";
import type { HomeAssistant } from "../ha";
import { slugify } from "../profiles";
import { DEFAULT_REPEAT, type ButtonConfig } from "../types";

const ACTIONS = ["perform-action", "navigate", "url", "more-info", "none"];

const LABELS: Record<string, string> = {
  label: "Label",
  icon: "Icon",
  shape: "Shape",
  haptic: "Vibration",
  tap_action: "Tap action",
  hold_action: "Hold action",
  repeat_enabled: "Repeat while held",
  delay_ms: "Repeat after (ms)",
  interval_ms: "Repeat every (ms)",
  bg: "Background",
  fg: "Icon and text colour",
  w: "Width (cells)",
  h: "Height (cells)",
  id: "Command ID",
};

const HELPERS: Record<string, string> = {
  id: "What automations send with remote.send_command. Changing it breaks automations that use the old ID.",
  hold_action: "Runs after holding for half a second. Ignored while \"Repeat while held\" is on.",
};

// Theme colour names from HA's ui_color selector <-> CSS values we store.
export function colorToCss(value: string | undefined): string | undefined {
  if (!value || value === "default" || value === "none" || value === "state") return undefined;
  return value.startsWith("#") || value.startsWith("var(") || value.startsWith("rgb") ? value : `var(--${value}-color)`;
}

export function cssToColor(value: string | undefined): string | undefined {
  const match = value?.match(/^var\(--([a-z-]+)-color\)$/);
  return match ? match[1] : value;
}

type FormData = Record<string, unknown>;

export class VrButtonSheet extends LitElement {
  static override properties = {
    hass: { attribute: false },
    button: { attribute: false },
    buttons: { attribute: false },
    columns: { type: Number },
    _idError: { state: true },
  };

  declare hass: HomeAssistant;
  declare button: ButtonConfig;
  declare buttons: ButtonConfig[];
  declare columns: number;
  declare _idError?: string;

  /** What was typed in the ID field; the slug of it is what gets saved. */
  private _idDraft?: { text: string; forId: string };

  private _schema(repeat: boolean) {
    return [
      {
        type: "grid",
        name: "",
        schema: [
          { name: "label", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ],
      },
      { name: "tap_action", selector: { ui_action: { actions: ACTIONS } } },
      { name: "repeat_enabled", selector: { boolean: {} } },
      ...(repeat
        ? [
            {
              type: "grid",
              name: "",
              schema: [
                { name: "delay_ms", selector: { number: { min: 50, max: 2000, step: 50, mode: "box" } } },
                { name: "interval_ms", selector: { number: { min: 50, max: 2000, step: 50, mode: "box" } } },
              ],
            },
          ]
        : []),
      { name: "hold_action", selector: { ui_action: { actions: ACTIONS } } },
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "shape",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "rect", label: "Rounded square" },
                  { value: "circle", label: "Circle" },
                  { value: "pill", label: "Pill" },
                ],
              },
            },
          },
          {
            name: "haptic",
            selector: {
              select: {
                mode: "dropdown",
                options: ["none", "light", "medium", "heavy", "selection"].map((v) => ({
                  value: v,
                  label: v[0].toUpperCase() + v.slice(1),
                })),
              },
            },
          },
          { name: "bg", selector: { ui_color: { include_none: false, include_state: false } } },
          { name: "fg", selector: { ui_color: { include_none: false, include_state: false } } },
          { name: "w", selector: { number: { min: 1, max: this.columns, mode: "box" } } },
          { name: "h", selector: { number: { min: 1, max: 6, mode: "box" } } },
        ],
      },
      { name: "id", selector: { text: {} } },
    ];
  }

  private _data(): FormData {
    const b = this.button;
    const repeat = { ...DEFAULT_REPEAT, ...b.repeat };
    return {
      label: b.label ?? "",
      icon: b.icon ?? "",
      tap_action: b.tap_action ?? { action: "none" },
      hold_action: b.hold_action ?? { action: "none" },
      repeat_enabled: repeat.enabled,
      delay_ms: repeat.delay_ms,
      interval_ms: repeat.interval_ms,
      shape: b.shape ?? "rect",
      haptic: b.haptic ?? "light",
      bg: cssToColor(b.color?.bg),
      fg: cssToColor(b.color?.fg),
      w: b.position.w ?? 1,
      h: b.position.h ?? 1,
      id: this._idDraft?.forId === b.id ? this._idDraft.text : b.id,
    };
  }

  private _onChange(ev: CustomEvent<{ value: FormData }>): void {
    ev.stopPropagation();
    const v = ev.detail.value;
    let id = this.button.id;
    const wantedId = String(v.id ?? "");
    const shownId = this._idDraft?.forId === this.button.id ? this._idDraft.text : this.button.id;
    if (wantedId !== shownId) {
      // Typed text is slugified as you go ("Vol Up" becomes vol_up).
      const slug = slugify(wantedId);
      if (!slug) {
        this._idError = "Use letters, numbers and underscores.";
      } else if (slug !== this.button.id && this.buttons.some((b) => b.id === slug)) {
        this._idError = "Another button already uses this ID.";
      } else {
        this._idError = undefined;
        id = slug;
      }
      this._idDraft = { text: wantedId, forId: id };
    }

    const bg = colorToCss(v.bg as string | undefined);
    const fg = colorToCss(v.fg as string | undefined);
    const button: ButtonConfig = {
      ...this.button,
      id,
      label: String(v.label ?? ""),
      shape: v.shape as ButtonConfig["shape"],
      haptic: v.haptic as ButtonConfig["haptic"],
      tap_action: (v.tap_action as ButtonConfig["tap_action"]) ?? { action: "none" },
      hold_action: (v.hold_action as ButtonConfig["hold_action"]) ?? { action: "none" },
      repeat: {
        enabled: !!v.repeat_enabled,
        delay_ms: Number(v.delay_ms) || DEFAULT_REPEAT.delay_ms,
        interval_ms: Number(v.interval_ms) || DEFAULT_REPEAT.interval_ms,
      },
      position: { ...this.button.position, w: Number(v.w) || 1, h: Number(v.h) || 1 },
    };
    if (v.icon) button.icon = String(v.icon);
    else delete button.icon;
    if (bg || fg) button.color = { ...(bg ? { bg } : {}), ...(fg ? { fg } : {}) };
    else delete button.color;

    this.dispatchEvent(new CustomEvent("button-change", { detail: { previousId: this.button.id, button } }));
  }

  private _fire(type: string): void {
    this.dispatchEvent(new CustomEvent(type, { detail: { id: this.button.id } }));
  }

  override render() {
    if (!this.button) return nothing;
    const data = this._data();
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${this._schema(!!data.repeat_enabled)}
        .error=${this._idError ? { id: this._idError } : undefined}
        .computeLabel=${(s: { name: string }) => LABELS[s.name] ?? s.name}
        .computeHelper=${(s: { name: string }) => HELPERS[s.name]}
        @value-changed=${this._onChange}
      ></ha-form>
      <div class="actions">
        <button class="secondary" @click=${() => this._fire("button-duplicate")}>Duplicate</button>
        <button class="danger" @click=${() => this._fire("button-delete")}>Delete</button>
      </div>
    `;
  }

  static override styles = css`
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }
    button {
      min-height: 40px;
      padding: 0 16px;
      border-radius: 20px;
      border: 1px solid var(--divider-color, #ccc);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      cursor: pointer;
    }
    .danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
  `;
}

if (!customElements.get("vr-button-sheet")) customElements.define("vr-button-sheet", VrButtonSheet);
