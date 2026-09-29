// <virtual-remote-card-editor>: the card's visual editor.
//
// The HA card dialog is cramped on a phone, so this is a mode switcher rather
// than one dense screen: Arrange (drag canvas), Add (presets), Button (sheet),
// Remote (source, profiles, grid).
//
// One RemoteDefinition is edited however it is persisted: inline remotes are
// written back into the card config, stored remotes are saved over the
// WebSocket API (debounced). The UI itself doesn't branch on that.

import { LitElement, css, html, nothing } from "lit";
import { findFreeSpot, reflow, resizeButton, uniqueId } from "../geometry";
import "../grid";
import { errorMessage, fireEvent, haptic, loadHaFormElements, type HomeAssistant } from "../ha";
import { placePreset, presetSize, type Preset } from "../presets";
import { DEFAULT_GRID, inlineRemote, remoteIds, type ButtonConfig, type CardConfig, type RemoteDefinition } from "../types";
import "./button-sheet";
import "./canvas";
import type { VrCanvas } from "./canvas";
import type { PresetDragDetail } from "./palette";
import "./palette";

type Mode = "arrange" | "add" | "button" | "remote";
const MODES: Array<{ mode: Mode; label: string; icon: string }> = [
  { mode: "arrange", label: "Arrange", icon: "mdi:drag-variant" },
  { mode: "add", label: "Add", icon: "mdi:plus-box-multiple" },
  { mode: "button", label: "Button", icon: "mdi:gesture-tap-button" },
  { mode: "remote", label: "Remote", icon: "mdi:remote" },
];
const SAVE_DEBOUNCE_MS = 600;
const UNDO_MS = 6000;

interface StoredSummary {
  id: string;
  name: string;
}

export class VirtualRemoteCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _remote: { state: true },
    _loadError: { state: true },
    _mode: { state: true },
    _selectedId: { state: true },
    _saveState: { state: true },
    _stored: { state: true },
    _editIndex: { state: true },
    _undo: { state: true },
    _ready: { state: true },
    _mediaPlayer: { state: true },
    _expanded: { state: true },
    _notice: { state: true },
  };

  declare hass: HomeAssistant;
  declare _config: CardConfig;
  declare _remote?: RemoteDefinition;
  declare _loadError?: string;
  declare _mode: Mode;
  declare _selectedId?: string;
  declare _saveState: { state: "idle" | "saving" | "saved" | "error"; message?: string };
  declare _stored?: StoredSummary[];
  declare _editIndex: number;
  declare _undo?: { buttons: ButtonConfig[]; message: string; timer: number };
  declare _ready: boolean;
  declare _mediaPlayer?: string;
  declare _expanded: boolean;
  declare _notice?: string;

  private _loadedKey?: string;
  private _saveTimer?: number;
  private _pendingSave?: { remoteId: string; remote: RemoteDefinition };

  constructor() {
    super();
    this._mode = "arrange";
    this._saveState = { state: "idle" };
    this._editIndex = 0;
    this._ready = false;
    this._expanded = false;
  }

  setConfig(config: CardConfig): void {
    this._config = config;
    const ids = remoteIds(config);
    if (this._editIndex >= ids.length) this._editIndex = 0;
    if (!ids.length) {
      this._loadedKey = "inline";
      this._remote = inlineRemote(config);
      this._loadError = undefined;
    } else {
      this._maybeLoad();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    loadHaFormElements()
      .catch(() => undefined)
      .finally(() => (this._ready = true));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._flushSave();
  }

  protected override willUpdate(): void {
    if (this.hass && this._config) {
      this._maybeLoad();
      if (!this._stored) this._loadStoredList();
    }
  }

  // ---- loading & saving ---------------------------------------------------

  private get _editingId(): string | undefined {
    return remoteIds(this._config)[this._editIndex];
  }

  private get _isInline(): boolean {
    return !remoteIds(this._config).length;
  }

  private async _maybeLoad(): Promise<void> {
    const id = this._editingId;
    if (!id || !this.hass || this._loadedKey === id) return;
    this._flushSave();
    this._loadedKey = id;
    this._remote = undefined;
    this._loadError = undefined;
    this._selectedId = undefined;
    try {
      const remote = await this.hass.callWS<RemoteDefinition>({ type: "virtual_remote/get", remote_id: id });
      if (this._loadedKey === id) this._remote = remote;
    } catch (err) {
      if (this._loadedKey === id) this._loadError = errorMessage(err);
    }
  }

  private async _loadStoredList(): Promise<void> {
    this._stored = [];
    try {
      const { remotes } = await this.hass.callWS<{ remotes: RemoteDefinition[] }>({ type: "virtual_remote/list" });
      this._stored = remotes.map((r) => ({ id: r.id!, name: r.name }));
    } catch (err) {
      this._notice = `Could not list stored remotes: ${errorMessage(err)}`;
    }
  }

  private _fireConfig(config: CardConfig): void {
    this._config = config;
    fireEvent(this, "config-changed", { config });
  }

  /** Apply an edit to the remote being edited, wherever it lives. */
  private _commit(remote: RemoteDefinition): void {
    this._remote = remote;
    if (this._isInline) {
      const { name, icon, grid, buttons } = remote;
      const config: CardConfig = { ...this._config, grid, buttons };
      if (name) config.name = name;
      else delete config.name;
      if (icon) config.icon = icon;
      else delete config.icon;
      this._fireConfig(config);
      return;
    }
    this._pendingSave = { remoteId: this._editingId!, remote };
    this._saveState = { state: "saving" };
    window.clearTimeout(this._saveTimer);
    this._saveTimer = window.setTimeout(() => this._flushSave(), SAVE_DEBOUNCE_MS);
  }

  private async _flushSave(): Promise<void> {
    window.clearTimeout(this._saveTimer);
    const pending = this._pendingSave;
    if (!pending || !this.hass) return;
    this._pendingSave = undefined;
    try {
      const saved = await this.hass.callWS<RemoteDefinition>({
        type: "virtual_remote/save",
        remote_id: pending.remoteId,
        grid: pending.remote.grid,
        buttons: pending.remote.buttons,
      });
      // Adopt the backend's normalised copy unless the user kept editing.
      if (!this._pendingSave && this._loadedKey === pending.remoteId) this._remote = saved;
      if (!this._pendingSave) this._saveState = { state: "saved" };
    } catch (err) {
      this._saveState = { state: "error", message: errorMessage(err) };
    }
  }

  private _setButtons(buttons: ButtonConfig[]): void {
    if (this._remote) this._commit({ ...this._remote, buttons });
  }

  // ---- button edits -------------------------------------------------------

  private _deleteButton(id: string): void {
    if (!this._remote) return;
    const before = this._remote.buttons;
    const button = before.find((b) => b.id === id);
    if (!button) return;
    haptic("medium");
    this._setButtons(before.filter((b) => b.id !== id));
    if (this._selectedId === id) this._selectedId = undefined;
    this._offerUndo(before, `Deleted ${button.label || button.id}`);
  }

  private _offerUndo(buttons: ButtonConfig[], message: string): void {
    if (this._undo) window.clearTimeout(this._undo.timer);
    const timer = window.setTimeout(() => (this._undo = undefined), UNDO_MS);
    this._undo = { buttons, message, timer };
  }

  private _applyUndo(): void {
    if (!this._undo) return;
    window.clearTimeout(this._undo.timer);
    this._setButtons(this._undo.buttons);
    this._undo = undefined;
  }

  private _duplicateButton(id: string): void {
    if (!this._remote) return;
    const buttons = this._remote.buttons;
    const source = buttons.find((b) => b.id === id);
    if (!source) return;
    const w = source.position.w ?? 1;
    const h = source.position.h ?? 1;
    const copy: ButtonConfig = {
      ...structuredClone(source),
      id: uniqueId(buttons, source.id),
      position: { ...findFreeSpot(buttons, w, h, this._remote.grid.columns), w, h },
    };
    this._setButtons([...buttons, copy]);
    this._selectedId = copy.id;
  }

  private _onButtonChange(ev: CustomEvent<{ previousId: string; button: ButtonConfig }>): void {
    if (!this._remote) return;
    const { previousId, button } = ev.detail;
    let buttons = this._remote.buttons;
    const old = buttons.find((b) => b.id === previousId);
    if (!old) return;

    let next = button;
    const size = { w: next.position.w ?? 1, h: next.position.h ?? 1 };
    if (size.w !== (old.position.w ?? 1) || size.h !== (old.position.h ?? 1)) {
      const resized = resizeButton(buttons, previousId, size, this._remote.grid.columns);
      if (!resized.ok) {
        this._notice = "That size would overlap another button or leave the grid.";
        next = { ...next, position: old.position };
      }
    }
    buttons = buttons.map((b) => (b.id === previousId ? next : b));
    this._selectedId = next.id;
    this._setButtons(buttons);
  }

  private _addPreset(preset: Preset): void {
    if (!this._remote) return;
    const added = placePreset(this._remote.buttons, preset, this._remote.grid.columns, this._mediaPlayer) ?? [];
    haptic("light");
    this._setButtons([...this._remote.buttons, ...added]);
    this._selectedId = added.length === 1 ? added[0].id : undefined;
    this._notice = `Added ${preset.name}`;
  }

  /** A preset dragged from the tray onto the canvas lands where it's dropped. */
  private _onPresetDrag(ev: CustomEvent<PresetDragDetail>): void {
    const canvas = this.renderRoot.querySelector<VrCanvas>("vr-canvas");
    const remote = this._remote;
    if (!canvas || !remote) return;
    const { preset, clientX, clientY, phase } = ev.detail;
    if (phase === "start" || phase === "cancel") {
      canvas.showDropPreview(null);
      return;
    }
    const cell = canvas.cellAtPoint(clientX, clientY);
    const placed = cell ? placePreset(remote.buttons, preset, remote.grid.columns, this._mediaPlayer, cell) : null;
    if (phase === "move") {
      canvas.showDropPreview(cell ? { ...cell, ...presetSize(preset) } : null, !placed);
      return;
    }
    canvas.showDropPreview(null);
    if (placed) {
      haptic("light");
      this._setButtons([...remote.buttons, ...placed]);
      this._selectedId = placed.length === 1 ? placed[0].id : undefined;
      this._notice = `Added ${preset.name}`;
    } else if (cell) {
      haptic("heavy");
      this._notice = `${preset.name} doesn't fit there.`;
    }
  }

  // ---- remote settings ----------------------------------------------------

  private _remoteSchema() {
    const stored = this._stored ?? [];
    const inline = this._isInline;
    const multiple = remoteIds(this._config).length > 1;
    return [
      {
        name: "source",
        selector: {
          select: {
            mode: "list",
            options: [
              { value: "stored", label: "Stored remote (shared, works in automations)" },
              { value: "inline", label: "Inline buttons (only in this card)" },
            ],
          },
        },
      },
      ...(!inline
        ? [
            {
              name: "remotes",
              selector: {
                select: {
                  multiple: true,
                  options: stored.map((r) => ({ value: r.id, label: r.name })),
                },
              },
            },
          ]
        : []),
      ...(multiple
        ? [{ name: "profile_entity", selector: { entity: { filter: { domain: ["input_select", "select"] } } } }]
        : []),
      ...(inline
        ? [
            {
              type: "grid",
              name: "",
              schema: [
                { name: "name", selector: { text: {} } },
                { name: "icon", selector: { icon: {} } },
              ],
            },
          ]
        : []),
      {
        type: "grid",
        name: "",
        schema: [
          { name: "columns", selector: { number: { min: 1, max: 12, mode: "slider" } } },
          { name: "gap", selector: { number: { min: 0, max: 32, mode: "slider", unit_of_measurement: "px" } } },
          { name: "show_header", selector: { boolean: {} } },
          { name: "fullscreen", selector: { boolean: {} } },
        ],
      },
    ];
  }

  private _remoteData() {
    const grid = this._remote?.grid ?? DEFAULT_GRID;
    return {
      source: this._isInline ? "inline" : "stored",
      remotes: remoteIds(this._config),
      profile_entity: this._config.profile_entity,
      name: this._config.name ?? "",
      icon: this._config.icon ?? "",
      columns: grid.columns,
      gap: grid.gap,
      show_header: this._config.show_header !== false,
      fullscreen: this._config.fullscreen !== false,
    };
  }

  private _onRemoteChange(ev: CustomEvent<{ value: Record<string, any> }>): void {
    ev.stopPropagation();
    const v = ev.detail.value;
    const old = this._remoteData();

    // Card-level switches.
    let config: CardConfig = { ...this._config };
    for (const key of ["show_header", "fullscreen"] as const) {
      if (v[key]) delete config[key];
      else config[key] = false;
    }

    if (v.source !== old.source) {
      if (v.source === "inline") {
        // Detach: take a copy of the current layout into the card.
        const remote = this._remote ?? inlineRemote({ type: config.type });
        const { remote_id, profiles, profile_entity, ...rest } = config;
        config = { ...rest, name: remote.name, grid: remote.grid, buttons: structuredClone(remote.buttons) };
        this._loadedKey = "inline";
      } else {
        const first = this._stored?.[0]?.id;
        if (!first) {
          this._notice = "Create a remote first under Settings → Devices & services → Add integration → Virtual Remote.";
          return;
        }
        const { buttons, grid, name, icon, ...rest } = config;
        config = { ...rest, remote_id: first };
      }
      this._editIndex = 0;
      this._fireConfig(config);
      this.setConfig(config);
      return;
    }

    if (!this._isInline && JSON.stringify(v.remotes) !== JSON.stringify(old.remotes)) {
      const ids: string[] = v.remotes ?? [];
      const { remote_id, profiles, ...rest } = config;
      config = rest;
      if (ids.length === 1) config.remote_id = ids[0];
      else if (ids.length > 1) {
        const keep = new Map((profiles ?? []).map((p) => [p.remote_id, p]));
        config.profiles = ids.map((id) => keep.get(id) ?? { remote_id: id });
      } else {
        this._notice = "Pick at least one remote.";
        return;
      }
      if (ids.length < 2) delete config.profile_entity;
      this._editIndex = 0;
    }
    if (v.profile_entity !== old.profile_entity) {
      if (v.profile_entity) config.profile_entity = v.profile_entity;
      else delete config.profile_entity;
    }
    if (this._isInline) {
      config.name = v.name || undefined;
      config.icon = v.icon || undefined;
      if (!config.name) delete config.name;
      if (!config.icon) delete config.icon;
    }
    this._fireConfig(config);
    this.setConfig(config);

    // Grid changes belong to the remote itself.
    if (this._remote && (v.columns !== old.columns || v.gap !== old.gap)) {
      const grid = { columns: Number(v.columns), gap: Number(v.gap) };
      const buttons = grid.columns < this._remote.grid.columns ? reflow(this._remote.buttons, grid.columns) : this._remote.buttons;
      this._commit({ ...this._remote, ...(this._isInline ? { name: config.name ?? "", icon: config.icon } : {}), grid, buttons });
    } else if (this._isInline && this._remote) {
      this._remote = { ...this._remote, name: config.name ?? "", icon: config.icon };
    }
  }

  /** One tap to make the input_select that keeps the active profile in sync. */
  private async _createProfileHelper(): Promise<void> {
    const ids = remoteIds(this._config);
    const names = ids.map((id) => this._stored?.find((r) => r.id === id)?.name ?? id);
    try {
      const item = await this.hass.callWS<{ id: string }>({
        type: "input_select/create",
        name: `${this._config.name ?? names[0]} profile`,
        icon: "mdi:remote",
        options: names,
      });
      this._fireConfig({ ...this._config, profile_entity: `input_select.${item.id}` });
      this._notice = "Created a shared profile helper.";
    } catch (err) {
      this._notice = `Could not create the helper: ${errorMessage(err)}`;
    }
  }

  // ---- render -------------------------------------------------------------

  private _renderStatus() {
    const s = this._saveState;
    if (this._isInline || s.state === "idle") return nothing;
    const text = { saving: "Saving…", saved: "Saved", error: `Save failed: ${s.message}` }[s.state];
    return html`<span class="status ${s.state}">${text}</span>`;
  }

  private _renderProfilePicker() {
    const ids = remoteIds(this._config);
    if (ids.length < 2) return nothing;
    return html`
      <div class="editing">
        <span>Editing</span>
        ${ids.map(
          (id, i) => html`<button
            class="chip ${i === this._editIndex ? "on" : ""}"
            @click=${() => {
              this._editIndex = i;
              this._maybeLoad();
            }}
          >
            ${this._stored?.find((r) => r.id === id)?.name ?? id}
          </button>`,
        )}
      </div>
    `;
  }

  private _renderArrange() {
    const remote = this._remote!;
    const selected = remote.buttons.find((b) => b.id === this._selectedId);
    const canvas = (fit: boolean) => html`
      <vr-canvas
        .remote=${remote}
        .selectedId=${this._selectedId}
        ?fit=${fit}
        @canvas-change=${(ev: CustomEvent<{ buttons: ButtonConfig[] }>) => this._setButtons(ev.detail.buttons)}
        @canvas-select=${(ev: CustomEvent<{ id?: string }>) => (this._selectedId = ev.detail.id)}
        @canvas-delete=${(ev: CustomEvent<{ id: string }>) => this._deleteButton(ev.detail.id)}
      ></vr-canvas>
    `;
    return html`
      ${remote.buttons.length
        ? nothing
        : html`<p class="empty">No buttons yet. Open <b>Add</b> to drop in a d-pad, volume keys and more.</p>`}
      ${this._expanded ? nothing : canvas(false)}
      <div class="toolbar">
        ${selected
          ? html`
              <span class="sel">${selected.label || selected.id}</span>
              <button class="chip" @click=${() => (this._mode = "button")}>Edit</button>
              <button class="chip" @click=${() => this._duplicateButton(selected.id)}>Duplicate</button>
              <button class="chip danger" @click=${() => this._deleteButton(selected.id)}>Delete</button>
            `
          : html`<span class="sel muted">Nothing selected</span>`}
        <button class="chip" aria-label="Expand" @click=${this._expand}>
          <ha-icon icon="mdi:arrow-expand"></ha-icon>
        </button>
      </div>
      ${this._expanded
        ? html`<dialog class="expanded" @close=${() => (this._expanded = false)}>
            <div class="expanded-inner">
              <div class="expanded-head">
                <span>Arrange ${remote.name}</span>
                <button class="chip" @click=${this._collapse}>Done</button>
              </div>
              ${canvas(true)}
              ${this._renderUndo()}
            </div>
          </dialog>`
        : nothing}
    `;
  }

  private _expand(): void {
    this._expanded = true;
    this.updateComplete.then(() => this.renderRoot.querySelector<HTMLDialogElement>("dialog.expanded")?.showModal());
  }

  private _collapse(): void {
    this.renderRoot.querySelector<HTMLDialogElement>("dialog.expanded")?.close();
  }

  private _renderButtonMode() {
    const remote = this._remote!;
    const selected = remote.buttons.find((b) => b.id === this._selectedId);
    return html`
      <div class="chips">
        ${remote.buttons.map(
          (b) => html`<button class="chip ${b.id === this._selectedId ? "on" : ""}" @click=${() => (this._selectedId = b.id)}>
            ${b.icon ? html`<ha-icon .icon=${b.icon}></ha-icon>` : nothing}${b.label || b.id}
          </button>`,
        )}
      </div>
      ${selected
        ? html`<vr-button-sheet
            .hass=${this.hass}
            .button=${selected}
            .buttons=${remote.buttons}
            .columns=${remote.grid.columns}
            @button-change=${this._onButtonChange}
            @button-delete=${(ev: CustomEvent<{ id: string }>) => this._deleteButton(ev.detail.id)}
            @button-duplicate=${(ev: CustomEvent<{ id: string }>) => this._duplicateButton(ev.detail.id)}
          ></vr-button-sheet>`
        : html`<p class="empty">${remote.buttons.length ? "Pick a button above, or tap one in Arrange." : "Add some buttons first."}</p>`}
    `;
  }

  private _renderRemoteMode() {
    const multiple = remoteIds(this._config).length > 1;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._remoteData()}
        .schema=${this._remoteSchema()}
        .computeLabel=${(s: { name: string }) =>
          ({
            source: "Buttons come from",
            remotes: "Remotes (pick several to swap between them as profiles)",
            profile_entity: "Shared profile helper",
            name: "Name",
            icon: "Icon",
            columns: "Columns",
            gap: "Spacing",
            show_header: "Show title",
            fullscreen: "Fullscreen button",
          })[s.name] ?? s.name}
        .computeHelper=${(s: { name: string }) =>
          s.name === "profile_entity"
            ? "An input_select whose options are the remote names. Every device follows it, and automations can switch it."
            : undefined}
        @value-changed=${this._onRemoteChange}
      ></ha-form>
      ${multiple && !this._config.profile_entity
        ? html`<button class="chip wide" @click=${this._createProfileHelper}>
            <ha-icon icon="mdi:plus"></ha-icon> Create a shared profile helper
          </button>`
        : nothing}
      ${!this._isInline
        ? html`<p class="note">
            Rename a stored remote or change its icon in Settings → Devices & services → Virtual Remote.
          </p>`
        : nothing}
    `;
  }

  private _renderUndo() {
    if (!this._undo) return nothing;
    return html`<div class="undo">
      <span>${this._undo.message}</span>
      <button @click=${this._applyUndo}>Undo</button>
    </div>`;
  }

  override render() {
    if (!this._config || !this.hass) return nothing;
    if (!this._ready) return html`<p class="empty">Loading editor…</p>`;
    let body;
    if (this._mode === "remote") body = this._renderRemoteMode();
    else if (this._loadError) body = html`<p class="error">${this._loadError}</p>`;
    else if (!this._remote) body = html`<p class="empty">Loading remote…</p>`;
    else if (this._mode === "arrange") body = this._renderArrange();
    else if (this._mode === "add")
      body = html`<vr-palette
          .hass=${this.hass}
          .mediaPlayer=${this._mediaPlayer}
          @media-player-change=${(ev: CustomEvent<{ entityId?: string }>) => (this._mediaPlayer = ev.detail.entityId)}
          @preset-add=${(ev: CustomEvent<{ preset: Preset }>) => this._addPreset(ev.detail.preset)}
          @preset-drag=${this._onPresetDrag}
        ></vr-palette>
        <p class="note">Tap a preset to add it, or hold and drag it onto the layout.</p>
        <vr-canvas
          class="preview"
          .remote=${this._remote}
          .selectedId=${this._selectedId}
          @canvas-change=${(ev: CustomEvent<{ buttons: ButtonConfig[] }>) => this._setButtons(ev.detail.buttons)}
          @canvas-select=${(ev: CustomEvent<{ id?: string }>) => (this._selectedId = ev.detail.id)}
          @canvas-delete=${(ev: CustomEvent<{ id: string }>) => this._deleteButton(ev.detail.id)}
        ></vr-canvas>`;
    else body = this._renderButtonMode();

    return html`
      ${this._renderProfilePicker()}
      <div class="modes" role="tablist">
        ${MODES.map(
          (m) => html`<button
            role="tab"
            class="mode"
            aria-selected=${this._mode === m.mode}
            @click=${() => {
              this._mode = m.mode;
              this._notice = undefined;
            }}
          >
            <ha-icon .icon=${m.icon}></ha-icon><span>${m.label}</span>
          </button>`,
        )}
      </div>
      <div class="statusbar">${this._renderStatus()}</div>
      ${this._notice ? html`<p class="notice">${this._notice}</p>` : nothing}
      <div class="body">${body}</div>
      ${this._expanded ? nothing : this._renderUndo()}
    `;
  }

  static override styles = css`
    :host {
      display: block;
    }
    .modes {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 4px;
      border-radius: 14px;
      background: var(--secondary-background-color, #eee);
    }
    .mode {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-height: 52px;
      border: none;
      border-radius: 10px;
      background: none;
      color: var(--secondary-text-color);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .mode[aria-selected="true"] {
      background: var(--card-background-color, #fff);
      color: var(--primary-color, #03a9f4);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    .statusbar {
      min-height: 18px;
      text-align: right;
      font-size: 12px;
      padding: 4px 2px;
    }
    .status {
      color: var(--secondary-text-color);
    }
    .status.error {
      color: var(--error-color, #db4437);
    }
    .body {
      padding-bottom: 8px;
    }
    .editing,
    .chips,
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 8px 0;
    }
    .editing > span {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 18px;
      border: 1px solid var(--divider-color, #ccc);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .chip ha-icon {
      --mdc-icon-size: 18px;
    }
    .chip.on {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .chip.danger {
      color: var(--error-color, #db4437);
    }
    .chip.wide {
      width: 100%;
      justify-content: center;
      margin-top: 8px;
    }
    .toolbar .sel {
      flex: 1;
      min-width: 80px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .muted {
      color: var(--secondary-text-color);
      font-weight: normal !important;
    }
    .empty,
    .note {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .error,
    .notice {
      font-size: 14px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .notice {
      margin: 4px 0;
      color: var(--primary-color, #03a9f4);
    }
    .preview {
      margin-top: 16px;
      opacity: 0.9;
    }
    .undo {
      position: sticky;
      bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 8px 8px 16px;
      border-radius: 8px;
      background: var(--primary-text-color, #333);
      color: var(--card-background-color, #fff);
      font-size: 14px;
      z-index: 5;
    }
    .undo button {
      margin-left: auto;
      min-height: 36px;
      border: none;
      background: none;
      color: var(--primary-color, #03a9f4);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    dialog.expanded {
      box-sizing: border-box;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
    }
    .expanded-inner {
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right))
        calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left));
    }
    .expanded-inner vr-canvas {
      flex: 1;
      min-height: 0;
    }
    .expanded-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
    }
  `;
}

if (!customElements.get("virtual-remote-card-editor")) {
  customElements.define("virtual-remote-card-editor", VirtualRemoteCardEditor);
}
