// <vr-palette>: the Add tray of preset button clusters.

import { LitElement, css, html } from "lit";
import { haptic, type HomeAssistant } from "../ha";
import { PRESETS, type Preset } from "../presets";

export const LONG_PRESS_MS = 250;
const MOVE_TOLERANCE_PX = 8;

export interface PresetDragDetail {
  preset: Preset;
  clientX: number;
  clientY: number;
  phase: "start" | "move" | "drop" | "cancel";
}

interface Gesture {
  preset: Preset;
  pointerId: number;
  startX: number;
  startY: number;
  el: HTMLElement;
  timer: number;
  /** Set once the long-press arms the drag: the lifted preset tile. */
  ghost?: HTMLElement;
}

export class VrPalette extends LitElement {
  static override properties = {
    hass: { attribute: false },
    mediaPlayer: { attribute: false },
  };

  declare hass: HomeAssistant;
  declare mediaPlayer?: string;

  private _gesture?: Gesture;
  /** Swallows the click the browser fires right after a drop. */
  private _suppressClick = false;

  override connectedCallback(): void {
    super.connectedCallback();
    // On the host: once armed, the pointer is captured here.
    this.addEventListener("pointermove", this._onPointerMove);
    this.addEventListener("pointerup", this._onPointerUp);
    this.addEventListener("pointercancel", this._cancel);
    this.addEventListener("touchmove", this._onTouchMove, { passive: false });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("pointermove", this._onPointerMove);
    this.removeEventListener("pointerup", this._onPointerUp);
    this.removeEventListener("pointercancel", this._cancel);
    this.removeEventListener("touchmove", this._onTouchMove);
    this._cancel();
  }

  private _fireDrag(g: Gesture, clientX: number, clientY: number, phase: PresetDragDetail["phase"]): void {
    const detail: PresetDragDetail = { preset: g.preset, clientX, clientY, phase };
    this.dispatchEvent(new CustomEvent("preset-drag", { detail }));
  }

  // Same rules as the canvas: hold still ~250 ms to pick up, a quicker move
  // scrolls the dialog, and scrolling is only blocked once armed.
  private _onPointerDown(ev: PointerEvent, preset: Preset): void {
    if (ev.button !== 0 || this._gesture) return;
    const el = ev.currentTarget as HTMLElement;
    const timer = window.setTimeout(() => this._arm(), LONG_PRESS_MS);
    this._gesture = { preset, pointerId: ev.pointerId, startX: ev.clientX, startY: ev.clientY, el, timer };
  }

  private _arm(): void {
    const g = this._gesture;
    if (!g) return;
    this.setPointerCapture(g.pointerId);
    this.classList.add("dragging");
    haptic("medium");
    // Translate the tile itself rather than a position:fixed clone, which
    // would be offset inside HA's (transformed) edit dialog.
    g.el.classList.add("ghost");
    g.ghost = g.el;
    this._fireDrag(g, g.startX, g.startY, "start");
  }

  private _moveGhost(g: Gesture, x: number, y: number): void {
    if (g.ghost) g.ghost.style.transform = `translate(${x - g.startX}px, ${y - g.startY}px)`;
  }

  private _onPointerMove = (ev: PointerEvent): void => {
    const g = this._gesture;
    if (!g || ev.pointerId !== g.pointerId) return;
    if (!g.ghost) {
      if (Math.hypot(ev.clientX - g.startX, ev.clientY - g.startY) > MOVE_TOLERANCE_PX) this._cancel();
      return;
    }
    this._moveGhost(g, ev.clientX, ev.clientY);
    this._fireDrag(g, ev.clientX, ev.clientY, "move");
  };

  private _onPointerUp = (ev: PointerEvent): void => {
    const g = this._gesture;
    if (!g || ev.pointerId !== g.pointerId) return;
    if (!g.ghost) {
      // A quick tap: leave it to @click.
      this._cancel();
      return;
    }
    this._suppressClick = true;
    window.setTimeout(() => (this._suppressClick = false), 0);
    this._gesture = undefined;
    this._cleanup(g);
    this._fireDrag(g, ev.clientX, ev.clientY, "drop");
  };

  private _cancel = (): void => {
    const g = this._gesture;
    if (!g) return;
    this._gesture = undefined;
    this._cleanup(g);
    if (g.ghost) this._fireDrag(g, g.startX, g.startY, "cancel");
  };

  private _cleanup(g: Gesture): void {
    window.clearTimeout(g.timer);
    if (g.ghost) {
      g.ghost.classList.remove("ghost");
      g.ghost.style.transform = "";
    }
    if (this.hasPointerCapture(g.pointerId)) this.releasePointerCapture(g.pointerId);
    this.classList.remove("dragging");
  }

  private _onTouchMove = (ev: TouchEvent): void => {
    if (this._gesture?.ghost && ev.cancelable) ev.preventDefault();
  };

  private _onClick(preset: Preset): void {
    if (!this._suppressClick) this._pick(preset);
  }

  private _pick(preset: Preset): void {
    this.dispatchEvent(new CustomEvent("preset-add", { detail: { preset } }));
  }

  override render() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ media_player: this.mediaPlayer }}
        .schema=${[{ name: "media_player", selector: { entity: { filter: { domain: "media_player" } } } }]}
        .computeLabel=${() => "Media player (optional)"}
        .computeHelper=${() => "Volume, power and playback buttons are wired to it automatically."}
        @value-changed=${(ev: CustomEvent<{ value: { media_player?: string } }>) => {
          ev.stopPropagation();
          this.dispatchEvent(
            new CustomEvent("media-player-change", { detail: { entityId: ev.detail.value.media_player || undefined } }),
          );
        }}
      ></ha-form>
      <div class="presets">
        ${PRESETS.map(
          (p) => html`
            <button
              class="preset"
              @pointerdown=${(ev: PointerEvent) => this._onPointerDown(ev, p)}
              @click=${() => this._onClick(p)}
              @contextmenu=${(ev: Event) => ev.preventDefault()}
            >
              <ha-icon .icon=${p.icon}></ha-icon>
              <span>${p.name}</span>
              <small>${p.buttons.length > 1 ? `${p.buttons.length} buttons` : "1 button"}</small>
            </button>
          `,
        )}
      </div>
    `;
  }

  static override styles = css`
    .presets {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
      gap: 8px;
      margin-top: 12px;
    }
    .preset {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-height: 84px;
      padding: 10px 6px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .preset:active {
      transform: scale(0.96);
    }
    /* Only while a drag is armed, so the dialog still scrolls. */
    :host(.dragging) .preset {
      touch-action: none;
    }
    .preset.ghost {
      position: relative;
      pointer-events: none;
      opacity: 0.85;
      z-index: 10;
      transition: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .preset {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    small {
      color: var(--secondary-text-color);
      font-size: 11px;
    }
  `;
}

if (!customElements.get("vr-palette")) customElements.define("vr-palette", VrPalette);
