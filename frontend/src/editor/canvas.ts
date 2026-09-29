// <vr-canvas>: the drag-and-drop layout surface.
//
// Mobile rules: a short drag scrolls the editor dialog as usual. Holding a
// button still for LONG_PRESS_MS arms a drag; only then do we block scrolling
// (touch-action + a non-passive touchmove). Tap selects. Drop outside the grid
// deletes (the editor offers undo). The corner handle resizes.

import { LitElement, css, html, nothing } from "lit";
import { VrButton } from "../button";
import { cellAt, cellSize, moveButton, resizeButton, type GridMetrics } from "../geometry";
import "../grid";
import { VrGrid } from "../grid";
import { haptic } from "../ha";
import type { ButtonConfig, RemoteDefinition } from "../types";

export const LONG_PRESS_MS = 250;
const MOVE_TOLERANCE_PX = 8;

type Gesture =
  | { kind: "pending"; id: string; pointerId: number; x: number; y: number; timer: number; el: VrButton }
  | { kind: "drag"; id: string; pointerId: number; x: number; y: number; el: VrButton; cell: { x: number; y: number } | null }
  | { kind: "resize"; id: string; pointerId: number; size: { w: number; h: number } };

export interface CanvasChange {
  buttons: ButtonConfig[];
}

export class VrCanvas extends LitElement {
  static override properties = {
    remote: { attribute: false },
    selectedId: { attribute: false },
    fit: { type: Boolean },
    _indicator: { state: true },
    _preview: { state: true },
  };

  declare remote: RemoteDefinition;
  declare selectedId?: string;
  declare fit: boolean;
  /** Drop target highlight, in canvas-relative px; `bad` if the drop would be refused. */
  declare _indicator?: { left: number; top: number; width: number; height: number; bad: boolean; remove: boolean };
  /** Buttons while a resize is in progress, before it is committed. */
  declare _preview?: ButtonConfig[];

  private _gesture?: Gesture;

  constructor() {
    super();
    this.fit = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Must be non-passive to be allowed to stop the dialog scrolling mid-drag.
    this.addEventListener("touchmove", this._onTouchMove, { passive: false });
    // On the host, not the inner div: once armed we capture the pointer on the
    // host, and captured events are targeted at it directly.
    this.addEventListener("pointermove", this._onPointerMove);
    this.addEventListener("pointerup", this._onPointerUp);
    this.addEventListener("pointercancel", this._cancel);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("touchmove", this._onTouchMove);
    this.removeEventListener("pointermove", this._onPointerMove);
    this.removeEventListener("pointerup", this._onPointerUp);
    this.removeEventListener("pointercancel", this._cancel);
    this._cancel();
  }

  private _onTouchMove = (ev: TouchEvent): void => {
    if (this._gesture && this._gesture.kind !== "pending") ev.preventDefault();
  };

  private get _grid(): VrGrid | null {
    return this.renderRoot.querySelector("vr-grid");
  }

  private _metrics(): GridMetrics | null {
    const surface = this._grid?.surface;
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, columns: this.remote.grid.columns, gap: this.remote.grid.gap };
  }

  private _emit(buttons: ButtonConfig[]): void {
    this.dispatchEvent(new CustomEvent<CanvasChange>("canvas-change", { detail: { buttons } }));
  }

  private _emitSelect(id: string | undefined): void {
    this.dispatchEvent(new CustomEvent("canvas-select", { detail: { id } }));
  }

  private _emitDelete(id: string): void {
    this.dispatchEvent(new CustomEvent("canvas-delete", { detail: { id } }));
  }

  // ---- drops from outside (the Add tray) ----------------------------------

  /** Grid cell under a client point, or null outside the grid. */
  cellAtPoint(clientX: number, clientY: number): { x: number; y: number } | null {
    const m = this._metrics();
    return m ? cellAt(m, clientX, clientY, this._grid!.rows) : null;
  }

  /** Outline where an outside drop would land (red if refused); null clears. */
  showDropPreview(pos: { x: number; y: number; w: number; h: number } | null, bad = false): void {
    const m = this._metrics();
    if (!pos || !m) this._indicator = undefined;
    else this._setIndicator(m, pos, bad);
  }

  // ---- move / select ------------------------------------------------------

  private _onPointerDown(ev: PointerEvent): void {
    if (this._gesture || ev.button !== 0) return;
    const el = ev.composedPath().find((n) => n instanceof VrButton) as VrButton | undefined;
    if (!el) {
      this._emitSelect(undefined);
      return;
    }
    const id = el.button.id;
    const timer = window.setTimeout(() => this._arm(), LONG_PRESS_MS);
    this._gesture = { kind: "pending", id, pointerId: ev.pointerId, x: ev.clientX, y: ev.clientY, timer, el };
  }

  private _arm(): void {
    const g = this._gesture;
    if (g?.kind !== "pending") return;
    haptic("medium");
    this.setPointerCapture(g.pointerId);
    this.classList.add("dragging");
    Object.assign(g.el.style, { zIndex: "2", opacity: "0.85", pointerEvents: "none" });
    this._gesture = { kind: "drag", id: g.id, pointerId: g.pointerId, x: g.x, y: g.y, el: g.el, cell: null };
    this._emitSelect(g.id);
  }

  private _onPointerMove = (ev: PointerEvent): void => {
    const g = this._gesture;
    if (!g || g.pointerId !== ev.pointerId) return;

    if (g.kind === "pending") {
      // Moved before the long-press: the user is scrolling, not dragging.
      if (Math.hypot(ev.clientX - g.x, ev.clientY - g.y) > MOVE_TOLERANCE_PX) this._cancel();
      return;
    }
    if (g.kind === "resize") {
      this._resizeMove(ev);
      return;
    }

    g.el.style.transform = `translate(${ev.clientX - g.x}px, ${ev.clientY - g.y}px)`;
    const m = this._metrics();
    const dragged = this.remote.buttons.find((b) => b.id === g.id);
    if (!m || !dragged) return;

    // Snap by the button's top-left cell, keeping the grab offset.
    const size = cellSize(m);
    const pitch = size + m.gap;
    const grabX = g.x - (m.left + dragged.position.x * pitch);
    const grabY = g.y - (m.top + dragged.position.y * pitch);
    const pointerCell = cellAt(m, ev.clientX, ev.clientY, this._grid!.rows);
    const cell = pointerCell
      ? cellAt(m, ev.clientX - grabX + size / 2, ev.clientY - grabY + size / 2, this._grid!.rows)
      : null;

    const changed = (cell?.x !== g.cell?.x || cell?.y !== g.cell?.y);
    g.cell = cell;
    if (!changed) return;
    if (!cell) {
      haptic("selection");
      this._indicator = undefined;
      this._setIndicatorForRemove(m);
      return;
    }
    haptic("selection");
    const result = moveButton(this.remote.buttons, g.id, cell, m.columns);
    this._setIndicator(m, { ...dragged.position, ...cell }, !result.ok);
  };

  private _onPointerUp = (ev: PointerEvent): void => {
    const g = this._gesture;
    if (!g || g.pointerId !== ev.pointerId) return;

    if (g.kind === "pending") {
      this._cancel();
      this._emitSelect(g.id);
      return;
    }
    if (g.kind === "resize") {
      this._resizeEnd();
      return;
    }

    const cell = g.cell;
    const id = g.id;
    this._cancel();
    if (!cell) {
      // Released outside the grid: the editor deletes with undo.
      this._emitDelete(id);
      return;
    }
    const result = moveButton(this.remote.buttons, id, cell, this.remote.grid.columns);
    if (result.ok) {
      if (result.buttons !== this.remote.buttons) this._emit(result.buttons);
    } else {
      haptic("heavy");
    }
  };

  private _cancel = (): void => {
    const g = this._gesture;
    if (!g) return;
    if (g.kind === "pending") window.clearTimeout(g.timer);
    if (g.kind === "drag") {
      Object.assign(g.el.style, { transform: "", zIndex: "", opacity: "", pointerEvents: "" });
    }
    if (this.hasPointerCapture?.(g.pointerId)) this.releasePointerCapture(g.pointerId);
    this.classList.remove("dragging");
    this._gesture = undefined;
    this._indicator = undefined;
    this._preview = undefined;
  };

  private _setIndicator(m: GridMetrics, pos: { x: number; y: number; w?: number; h?: number }, bad: boolean): void {
    const size = cellSize(m);
    const pitch = size + m.gap;
    const host = this.getBoundingClientRect();
    const w = pos.w ?? 1;
    const h = pos.h ?? 1;
    this._indicator = {
      left: m.left - host.left + pos.x * pitch,
      top: m.top - host.top + pos.y * pitch,
      width: w * pitch - m.gap,
      height: h * pitch - m.gap,
      bad,
      remove: false,
    };
  }

  private _setIndicatorForRemove(m: GridMetrics): void {
    const host = this.getBoundingClientRect();
    this._indicator = { left: m.left - host.left, top: 0, width: m.width, height: 0, bad: true, remove: true };
  }

  // ---- resize -------------------------------------------------------------

  private _onHandleDown(ev: PointerEvent): void {
    ev.stopPropagation();
    if (this._gesture || !this.selectedId) return;
    const button = this.remote.buttons.find((b) => b.id === this.selectedId);
    if (!button) return;
    this.setPointerCapture(ev.pointerId);
    this.classList.add("dragging");
    this._gesture = {
      kind: "resize",
      id: button.id,
      pointerId: ev.pointerId,
      size: { w: button.position.w ?? 1, h: button.position.h ?? 1 },
    };
  }

  private _resizeMove(ev: PointerEvent): void {
    const g = this._gesture;
    const m = this._metrics();
    if (g?.kind !== "resize" || !m) return;
    const button = this.remote.buttons.find((b) => b.id === g.id)!;
    const pitch = cellSize(m) + m.gap;
    const w = Math.max(1, Math.round((ev.clientX - (m.left + button.position.x * pitch) + m.gap) / pitch));
    const h = Math.max(1, Math.round((ev.clientY - (m.top + button.position.y * pitch) + m.gap) / pitch));
    if (w === g.size.w && h === g.size.h) return;
    const result = resizeButton(this.remote.buttons, g.id, { w, h }, m.columns);
    if (!result.ok) return;
    g.size = { w, h };
    haptic("selection");
    this._preview = result.buttons;
  }

  private _resizeEnd(): void {
    const preview = this._preview;
    this._cancel();
    if (preview) this._emit(preview);
  }

  // ---- render -------------------------------------------------------------

  private _renderHandle() {
    const buttons = this._preview ?? this.remote.buttons;
    const selected = buttons.find((b) => b.id === this.selectedId);
    const m = this._metrics();
    if (!selected || !m) return nothing;
    const pitch = cellSize(m) + m.gap;
    const host = this.getBoundingClientRect();
    const right = m.left - host.left + (selected.position.x + (selected.position.w ?? 1)) * pitch - m.gap;
    const bottom = m.top - host.top + (selected.position.y + (selected.position.h ?? 1)) * pitch - m.gap;
    return html`<div
      class="handle"
      style="left:${right}px; top:${bottom}px"
      aria-label="Resize"
      @pointerdown=${this._onHandleDown}
    ></div>`;
  }

  protected override updated(): void {
    // The handle is positioned from the grid's layout, which settles after render.
    if (this.selectedId && !this._handlePositioned) {
      this._handlePositioned = true;
      requestAnimationFrame(() => this.requestUpdate());
    } else {
      this._handlePositioned = false;
    }
  }
  private _handlePositioned = false;

  override render() {
    if (!this.remote) return nothing;
    const remote = this._preview ? { ...this.remote, buttons: this._preview } : this.remote;
    const ind = this._indicator;
    return html`
      <div
        class="canvas"
        @pointerdown=${this._onPointerDown}
        @contextmenu=${(ev: Event) => ev.preventDefault()}
      >
        <vr-grid .remote=${remote} .interactive=${false} .selectedId=${this.selectedId} .extraRows=${1} ?fit=${this.fit}></vr-grid>
        ${ind && !ind.remove
          ? html`<div
              class="indicator ${ind.bad ? "bad" : ""}"
              style="left:${ind.left}px; top:${ind.top}px; width:${ind.width}px; height:${ind.height}px"
            ></div>`
          : nothing}
        ${this._gesture?.kind !== "drag" ? this._renderHandle() : nothing}
      </div>
      <div class="hint ${ind?.remove ? "remove" : ""}">
        ${ind?.remove
          ? "Release to delete"
          : "Tap to edit · hold and drag to move · drag the corner to resize · drop outside to delete"}
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }
    :host([fit]) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    :host([fit]) .canvas {
      flex: 1;
      min-height: 0;
    }
    .canvas {
      position: relative;
      padding: 8px;
      border-radius: 12px;
      /* Same background as the card, so buttons look as they will on the
         dashboard; the dashed edge marks the drop area. */
      background: var(--card-background-color, #fff);
      border: 2px dashed var(--divider-color, #ccc);
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    /* Only while a drag is armed; otherwise the dialog must stay scrollable. */
    :host(.dragging) .canvas {
      touch-action: none;
    }
    .indicator {
      position: absolute;
      box-sizing: border-box;
      border: 2px dashed var(--primary-color, #03a9f4);
      border-radius: 12px;
      pointer-events: none;
      transition: left 60ms, top 60ms;
    }
    .indicator.bad {
      border-color: var(--error-color, #db4437);
    }
    .handle {
      position: absolute;
      width: 28px;
      height: 28px;
      margin: -18px 0 0 -18px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      border: 3px solid var(--card-background-color, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      /* The handle is only for resizing, so it can always block scrolling. */
      touch-action: none;
      cursor: nwse-resize;
      z-index: 3;
    }
    .hint {
      padding: 6px 4px 0;
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .hint.remove {
      color: var(--error-color, #db4437);
      font-weight: 600;
    }
  `;
}

if (!customElements.get("vr-canvas")) customElements.define("vr-canvas", VrCanvas);
