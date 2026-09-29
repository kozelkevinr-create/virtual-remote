// <vr-grid>: lays out a remote's buttons on square cells sized to fit.

import { LitElement, css, html, type PropertyValues } from "lit";
import { repeat } from "lit/directives/repeat.js";
import "./button";
import { rowCount } from "./geometry";
import type { RemoteDefinition } from "./types";

/** Buttons never get shorter than this, whatever the column count. */
export const MIN_CELL_PX = 48;

export class VrGrid extends LitElement {
  static override properties = {
    remote: { attribute: false },
    interactive: { type: Boolean },
    /** Also fit the available height (fullscreen); otherwise width only. */
    fit: { type: Boolean, reflect: true },
    selectedId: { attribute: false },
    /** Extra empty rows to show (editor drop targets). */
    extraRows: { type: Number },
    _cell: { state: true },
  };

  declare remote: RemoteDefinition;
  declare interactive: boolean;
  declare fit: boolean;
  declare selectedId?: string;
  declare extraRows: number;
  declare _cell: number;

  private _observer?: ResizeObserver;

  constructor() {
    super();
    this.interactive = true;
    this.fit = false;
    this.extraRows = 0;
    this._cell = MIN_CELL_PX;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._observer = new ResizeObserver(() => this._measure());
    this._observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("remote") || changed.has("extraRows")) this._measure();
  }

  get rows(): number {
    return Math.max(1, rowCount(this.remote?.buttons ?? []) + this.extraRows);
  }

  /** The grid surface, for the editor's coordinate maths. */
  get surface(): HTMLElement | null {
    return this.renderRoot.querySelector(".grid");
  }

  private _measure(): void {
    if (!this.remote) return;
    const { columns, gap } = this.remote.grid;
    const width = this.clientWidth;
    if (!width) return;
    let cell = (width - gap * (columns - 1)) / columns;
    if (this.fit && this.clientHeight) {
      const rows = this.rows;
      cell = Math.min(cell, (this.clientHeight - gap * (rows - 1)) / rows);
    }
    this._cell = Math.max(MIN_CELL_PX, Math.floor(cell));
  }

  override render() {
    if (!this.remote) return html``;
    const { columns, gap } = this.remote.grid;
    const cell = this._cell;
    const style = `
      grid-template-columns: repeat(${columns}, ${this.fit ? `${cell}px` : "minmax(0, 1fr)"});
      grid-auto-rows: ${cell}px;
      grid-template-rows: repeat(${this.rows}, ${cell}px);
      gap: ${gap}px;
      --vr-icon-size: ${Math.round(Math.min(40, Math.max(20, cell * 0.4)))}px;
      --vr-label-size: ${cell < 64 ? 11 : 13}px;
    `;
    return html`
      <div class="grid" style=${style}>
        ${repeat(
          this.remote.buttons,
          (b) => b.id,
          (b) => html`
            <vr-button
              data-id=${b.id}
              .button=${b}
              .interactive=${this.interactive}
              ?selected=${b.id === this.selectedId}
              style="grid-column: ${b.position.x + 1} / span ${b.position.w ?? 1};
                     grid-row: ${b.position.y + 1} / span ${b.position.h ?? 1};"
            ></vr-button>
          `,
        )}
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
    }
    :host([fit]) {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .grid {
      display: grid;
      position: relative;
    }
  `;
}

if (!customElements.get("vr-grid")) customElements.define("vr-grid", VrGrid);
