// <vr-button>: one remote button. Handles tap, long-press and auto-repeat with
// Pointer Events so touch, mouse and pen share one path.

import { LitElement, css, html, nothing } from "lit";
import { hasHoldAction } from "./actions";
import { haptic } from "./ha";
import type { ButtonConfig } from "./types";

export const HOLD_MS = 500;
/** Finger travel that turns a press into a scroll/swipe and cancels it. */
const MOVE_TOLERANCE_PX = 10;

export interface PressDetail {
  button: ButtonConfig;
  hold: boolean;
  /** True for auto-repeat ticks after the first. */
  repeat: boolean;
}

export class VrButton extends LitElement {
  static override properties = {
    button: { attribute: false },
    interactive: { type: Boolean },
    selected: { type: Boolean, reflect: true },
    _pressed: { state: true },
    _error: { state: true },
  };

  declare button: ButtonConfig;
  declare interactive: boolean;
  declare selected: boolean;
  declare _pressed: boolean;
  declare _error: boolean;

  private _pointerId?: number;
  private _start = { x: 0, y: 0 };
  private _timer?: number;
  /** Set once hold or repeat has fired, so pointerup doesn't also tap. */
  private _fired = false;

  constructor() {
    super();
    this.interactive = true;
    this.selected = false;
    this._pressed = false;
    this._error = false;
  }

  /** Brief red shake when a press fails. */
  flashError(): void {
    this._error = true;
    haptic("heavy");
    window.setTimeout(() => (this._error = false), 600);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Non-passive so it may stop the page scrolling during a hold or repeat.
    this.addEventListener("touchmove", this._onTouchMove, { passive: false });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("touchmove", this._onTouchMove);
    this._reset();
  }

  private _onTouchMove = (ev: TouchEvent): void => {
    if (this._fired && this._pointerId !== undefined && ev.cancelable) ev.preventDefault();
  };

  private _emit(hold: boolean, repeat: boolean): void {
    const detail: PressDetail = { button: this.button, hold, repeat };
    this.dispatchEvent(new CustomEvent("vr-press", { detail, bubbles: true, composed: true }));
  }

  private _onPointerDown(ev: PointerEvent): void {
    if (!this.interactive || ev.button !== 0 || this._pointerId !== undefined) return;
    this._pointerId = ev.pointerId;
    // Keep receiving moves/up even if a mouse slides off the button.
    (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
    this._start = { x: ev.clientX, y: ev.clientY };
    this._fired = false;
    this._pressed = true;
    haptic(this.button.haptic ?? "light");

    const repeat = this.button.repeat;
    if (repeat?.enabled) {
      // A quick tap still sends once on release. Holding past delay_ms starts
      // repeating. Not sending on down means a scroll that starts on the
      // volume button doesn't change the volume.
      this._timer = window.setTimeout(() => {
        this._fired = true;
        this._emit(false, false);
        this._timer = window.setTimeout(() => this._repeatTick(repeat.interval_ms), repeat.interval_ms);
      }, repeat.delay_ms);
    } else if (hasHoldAction(this.button)) {
      this._timer = window.setTimeout(() => {
        this._fired = true;
        haptic("medium");
        this._emit(true, false);
      }, HOLD_MS);
    }
  }

  private _repeatTick(interval: number): void {
    this._emit(false, true);
    this._timer = window.setTimeout(() => this._repeatTick(interval), interval);
  }

  private _onPointerMove(ev: PointerEvent): void {
    if (ev.pointerId !== this._pointerId) return;
    // Once hold/repeat has started the gesture is ours: a drifting thumb
    // mustn't stop the volume ramp. Before that, movement means scrolling.
    if (this._fired) return;
    const dx = ev.clientX - this._start.x;
    const dy = ev.clientY - this._start.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) this._reset();
  }

  private _onPointerUp(ev: PointerEvent): void {
    if (ev.pointerId !== this._pointerId) return;
    const fired = this._fired;
    this._reset();
    if (!fired) this._emit(false, false);
  }

  private _reset(): void {
    window.clearTimeout(this._timer);
    this._timer = undefined;
    this._pointerId = undefined;
    this._pressed = false;
  }

  private _onKeyDown(ev: KeyboardEvent): void {
    if (!this.interactive || (ev.key !== "Enter" && ev.key !== " ")) return;
    ev.preventDefault();
    this._emit(false, false);
  }

  override render() {
    const b = this.button;
    const style = [
      b.color?.bg ? `--vr-bg:${b.color.bg}` : "",
      b.color?.fg ? `--vr-fg:${b.color.fg}` : "",
    ].join(";");
    const classes = ["btn", b.shape ?? "rect", this._pressed ? "pressed" : "", this._error ? "error" : ""].join(" ");
    return html`
      <div
        class=${classes}
        style=${style}
        role=${this.interactive ? "button" : nothing}
        tabindex=${this.interactive ? "0" : nothing}
        aria-label=${b.label || b.id}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._reset}
        @lostpointercapture=${this._reset}
        @keydown=${this._onKeyDown}
        @contextmenu=${(ev: Event) => ev.preventDefault()}
      >
        ${b.icon ? html`<ha-icon .icon=${b.icon}></ha-icon>` : nothing}
        ${b.label ? html`<span class="label">${b.label}</span>` : nothing}
        ${!b.icon && !b.label ? html`<span class="label id">${b.id}</span>` : nothing}
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      min-width: 0;
      min-height: 0;
    }
    .btn {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      overflow: hidden;
      background: var(--vr-bg, var(--secondary-background-color, #e5e5e5));
      color: var(--vr-fg, var(--primary-text-color, #212121));
      border-radius: var(--vr-radius, 12px);
      cursor: pointer;
      /* Mobile: no 300 ms tap delay, no double-tap zoom, no text selection,
         no iOS callout or grey flash on long-press. */
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform 80ms ease-out, filter 80ms ease-out, box-shadow 120ms;
      outline: none;
    }
    .btn:focus-visible {
      box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
    }
    .circle {
      border-radius: 50%;
    }
    .pill {
      border-radius: 999px;
    }
    /* Optimistic feedback: reacts on pointerdown, not after the round-trip. */
    .pressed {
      transform: scale(0.93);
      filter: brightness(0.85);
    }
    .error {
      animation: shake 300ms;
      box-shadow: 0 0 0 2px var(--error-color, #db4437);
    }
    @keyframes shake {
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    :host([selected]) .btn {
      box-shadow: 0 0 0 3px var(--primary-color, #03a9f4);
    }
    ha-icon {
      --mdc-icon-size: var(--vr-icon-size, 24px);
      pointer-events: none;
    }
    .label {
      font-size: var(--vr-label-size, 12px);
      line-height: 1.1;
      text-align: center;
      padding: 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      pointer-events: none;
    }
    .id {
      opacity: 0.6;
    }
  `;
}

if (!customElements.get("vr-button")) customElements.define("vr-button", VrButton);
