// <virtual-remote-card>: renders a stored or inline remote, optionally several
// stored remotes as swappable profiles.

import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { findRemoteEntity, press } from "./actions";
import { VrButton, type PressDetail } from "./button";
import "./editor/editor";
import "./grid";
import { rowCount } from "./geometry";
import { errorMessage, haptic, toast, type HomeAssistant } from "./ha";
import { optionForProfile, profileIndexForState, type ProfileInfo } from "./profiles";
import { inlineRemote, remoteIds, type CardConfig, type RemoteDefinition } from "./types";

export const CARD_VERSION = __CARD_VERSION__;
const SWIPE_MIN_PX = 60;
/** How long a tapped tab wins over the profile entity's (stale) state. */
const PENDING_PROFILE_MS = 3000;

let versionChecked = false;

type RemoteSlot = { remote: RemoteDefinition } | { error: string } | { loading: true };

export class VirtualRemoteCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _slots: { state: true },
    _localIndex: { state: true },
    _pending: { state: true },
    _staleVersion: { state: true },
    _fullscreen: { state: true },
  };

  declare hass: HomeAssistant;
  declare _config: CardConfig;
  declare _slots: Record<string, RemoteSlot>;
  declare _localIndex: number;
  declare _pending?: { index: number; until: number };
  declare _staleVersion?: string;
  declare _fullscreen: boolean;

  private _unsubs: Array<Promise<() => void>> = [];
  private _subscribedFor?: string;
  private _inFlight = new Set<string>();
  private _swipe?: { id: number; x: number; y: number; t: number };

  constructor() {
    super();
    this._slots = {};
    this._localIndex = 0;
    this._fullscreen = false;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("virtual-remote-card-editor");
  }

  static getStubConfig(hass?: HomeAssistant): Partial<CardConfig> {
    const stored = Object.values(hass?.states ?? {}).find(
      (s) => s.entity_id.startsWith("remote.") && typeof s.attributes.remote_id === "string",
    );
    if (stored) return { remote_id: stored.attributes.remote_id };
    return {
      name: "Remote",
      grid: { columns: 3 },
      buttons: [
        { id: "vol_up", icon: "mdi:volume-plus", position: { x: 0, y: 0, w: 1, h: 1 } },
        { id: "mute", icon: "mdi:volume-mute", position: { x: 1, y: 0, w: 1, h: 1 } },
        { id: "vol_down", icon: "mdi:volume-minus", position: { x: 2, y: 0, w: 1, h: 1 } },
      ],
    };
  }

  setConfig(config: CardConfig): void {
    if (!config) throw new Error("Invalid configuration");
    if (!config.remote_id && !config.profiles?.length && !config.buttons) {
      throw new Error("Set remote_id, profiles, or inline buttons");
    }
    if (config.profiles?.some((p) => !p?.remote_id)) {
      throw new Error("Every profile needs a remote_id");
    }
    this._config = config;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Re-subscribe after HA re-attaches the card (view switches do this).
    this._subscribedFor = undefined;
    if (this.hass) this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!this.hass || !this._config) return;
    const key = JSON.stringify(remoteIds(this._config));
    if (this.isConnected && key !== this._subscribedFor) {
      this._subscribedFor = key;
      this._subscribe();
    }
    if (changed.has("hass") && !versionChecked) {
      versionChecked = true;
      this._checkVersion();
    }
  }

  private _subscribe(): void {
    this._unsubscribe();
    const slots: Record<string, RemoteSlot> = {};
    for (const remoteId of remoteIds(this._config)) {
      slots[remoteId] = this._slots[remoteId] ?? { loading: true };
      const unsub = this.hass.connection.subscribeMessage<{ remote: RemoteDefinition | null }>(
        ({ remote }) => {
          this._slots = {
            ...this._slots,
            [remoteId]: remote ? { remote } : { error: `Remote "${remoteId}" was deleted` },
          };
        },
        { type: "virtual_remote/subscribe", remote_id: remoteId },
      );
      unsub.catch((err) => {
        this._slots = { ...this._slots, [remoteId]: { error: errorMessage(err) } };
      });
      this._unsubs.push(unsub);
    }
    this._slots = slots;
  }

  private _unsubscribe(): void {
    for (const unsub of this._unsubs) unsub.then((fn) => fn()).catch(() => undefined);
    this._unsubs = [];
  }

  /** A cached old card talking to a newer backend: offer a cache-clearing reload. */
  private async _checkVersion(): Promise<void> {
    try {
      const { version } = await this.hass.callWS<{ version: string }>({ type: "virtual_remote/version" });
      if (version !== CARD_VERSION) this._staleVersion = version;
    } catch {
      // Integration not loaded; the remote itself will show the error.
    }
  }

  private async _reload(): Promise<void> {
    try {
      if ("caches" in window) {
        for (const key of await caches.keys()) await caches.delete(key);
      }
    } finally {
      location.reload();
    }
  }

  // ---- profiles -----------------------------------------------------------

  private get _profiles(): ProfileInfo[] {
    return remoteIds(this._config).map((remoteId, i) => {
      const slot = this._slots[remoteId];
      const name =
        this._config.profiles?.[i]?.name ??
        (slot && "remote" in slot ? slot.remote.name : undefined) ??
        remoteId;
      return { remoteId, name };
    });
  }

  private get _activeIndex(): number {
    const count = remoteIds(this._config).length;
    if (this._pending && this._pending.until > Date.now()) return this._pending.index;
    const entity = this._config.profile_entity;
    if (entity) {
      const index = profileIndexForState(this._profiles, this.hass.states[entity]?.state);
      if (index >= 0) return index;
    }
    return Math.min(this._localIndex, Math.max(0, count - 1));
  }

  private async _selectProfile(index: number): Promise<void> {
    const profiles = this._profiles;
    if (index < 0 || index >= profiles.length || index === this._activeIndex) return;
    haptic("selection");
    this._localIndex = index;
    const entityId = this._config.profile_entity;
    if (!entityId) return;

    const state = this.hass.states[entityId];
    const option = optionForProfile(state?.attributes.options ?? [], profiles[index]);
    if (!option) {
      toast(this, `${entityId} has no option for "${profiles[index].name}"`);
      return;
    }
    this._pending = { index, until: Date.now() + PENDING_PROFILE_MS };
    window.setTimeout(() => (this._pending = undefined), PENDING_PROFILE_MS);
    try {
      await this.hass.callService(entityId.split(".")[0], "select_option", { option }, { entity_id: entityId });
    } catch (err) {
      this._pending = undefined;
      toast(this, errorMessage(err));
    }
  }

  private _onSwipeStart(ev: PointerEvent): void {
    if (!ev.isPrimary || remoteIds(this._config).length < 2) return;
    this._swipe = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, t: ev.timeStamp };
  }

  private _onSwipeEnd(ev: PointerEvent): void {
    const s = this._swipe;
    this._swipe = undefined;
    if (!s || s.id !== ev.pointerId || ev.timeStamp - s.t > 700) return;
    const dx = ev.clientX - s.x;
    const dy = ev.clientY - s.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dy) > Math.abs(dx) / 2) return;
    this._selectProfile(this._activeIndex + (dx < 0 ? 1 : -1));
  }

  // ---- pressing -----------------------------------------------------------

  private _current(): { remote?: RemoteDefinition; remoteId?: string; error?: string; loading?: boolean } {
    const ids = remoteIds(this._config);
    if (!ids.length) return { remote: inlineRemote(this._config) };
    const remoteId = ids[this._activeIndex];
    const slot = this._slots[remoteId] ?? { loading: true };
    if ("remote" in slot) return { remote: slot.remote, remoteId };
    if ("error" in slot) return { remoteId, error: slot.error };
    return { remoteId, loading: true };
  }

  private async _onPress(ev: CustomEvent<PressDetail>): Promise<void> {
    const { button, hold, repeat } = ev.detail;
    // A press (e.g. a hold whose thumb drifts sideways) is never also a swipe.
    this._swipe = undefined;
    const source = ev.composedPath().find((n) => n instanceof VrButton) as VrButton | undefined;
    // Don't queue repeat ticks behind a slow call; drop them instead.
    if (repeat && this._inFlight.has(button.id)) return;

    const { remoteId } = this._current();
    let entityId: string | undefined;
    if (remoteId) {
      entityId = findRemoteEntity(this.hass, remoteId);
      if (!entityId) {
        source?.flashError();
        toast(this, `No remote entity found for "${remoteId}". Is it disabled?`);
        return;
      }
    }

    this._inFlight.add(button.id);
    try {
      await press({ hass: this.hass, node: this, entityId }, button, hold);
    } catch (err) {
      source?.flashError();
      toast(this, errorMessage(err));
    } finally {
      this._inFlight.delete(button.id);
    }
  }

  // ---- rendering ----------------------------------------------------------

  private _openFullscreen(): void {
    this._fullscreen = true;
    this.updateComplete.then(() => this.renderRoot.querySelector("dialog")?.showModal());
  }

  private _closeFullscreen(): void {
    this.renderRoot.querySelector("dialog")?.close();
  }

  private _renderTabs() {
    const profiles = this._profiles;
    if (profiles.length < 2) return nothing;
    const active = this._activeIndex;
    return html`
      <div class="tabs" role="tablist">
        ${profiles.map(
          (p, i) => html`
            <button
              role="tab"
              class="tab"
              aria-selected=${i === active}
              @click=${() => this._selectProfile(i)}
            >
              ${this._config.profiles?.[i]?.icon
                ? html`<ha-icon .icon=${this._config.profiles[i].icon}></ha-icon>`
                : nothing}
              <span>${p.name}</span>
            </button>
          `,
        )}
      </div>
    `;
  }

  private _renderBody(fit: boolean) {
    const current = this._current();
    let content;
    if (current.error) content = html`<div class="message error">${current.error}</div>`;
    else if (current.loading || !current.remote) content = html`<div class="message">Loading…</div>`;
    else if (!current.remote.buttons.length)
      content = html`<div class="message">No buttons yet. Edit the card to add some.</div>`;
    else content = html`<vr-grid .remote=${current.remote} ?fit=${fit}></vr-grid>`;
    return html`
      <div
        class="body"
        @vr-press=${this._onPress}
        @pointerdown=${this._onSwipeStart}
        @pointerup=${this._onSwipeEnd}
        @pointercancel=${() => (this._swipe = undefined)}
      >
        ${content}
      </div>
    `;
  }

  private _title(): { name: string; icon?: string } {
    const current = this._current();
    const profile = this._config.profiles?.[this._activeIndex];
    return {
      name: this._config.name ?? profile?.name ?? current.remote?.name ?? current.remoteId ?? "",
      icon: this._config.icon ?? profile?.icon ?? current.remote?.icon,
    };
  }

  override render() {
    if (!this._config || !this.hass) return nothing;
    const { name, icon } = this._title();
    const showHeader = this._config.show_header !== false;
    const canFullscreen = this._config.fullscreen !== false;
    return html`
      <ha-card>
        ${this._staleVersion
          ? html`<div class="stale">
              Virtual Remote was updated (${CARD_VERSION} → ${this._staleVersion}).
              <button @click=${this._reload}>Reload</button>
            </div>`
          : nothing}
        ${showHeader
          ? html`<div class="header">
              ${icon ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
              <span class="name">${name}</span>
              ${canFullscreen
                ? html`<button class="icon-btn" aria-label="Fullscreen" @click=${this._openFullscreen}>
                    <ha-icon icon="mdi:fullscreen"></ha-icon>
                  </button>`
                : nothing}
            </div>`
          : nothing}
        ${this._renderTabs()} ${this._renderBody(false)}
      </ha-card>
      ${this._fullscreen
        ? html`<dialog @close=${() => (this._fullscreen = false)} @cancel=${this._closeFullscreen}>
            <div class="fs">
              <div class="header">
                ${icon ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
                <span class="name">${name}</span>
                <button class="icon-btn" aria-label="Close" @click=${this._closeFullscreen}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              ${this._renderTabs()}
              <div class="fs-body">${this._renderBody(true)}</div>
            </div>
          </dialog>`
        : nothing}
    `;
  }

  getCardSize(): number {
    const remote = this._current().remote;
    const rows = remote ? rowCount(remote.buttons) : 2;
    return Math.max(2, Math.ceil(rows * 1.5)) + (this._config?.show_header === false ? 0 : 1);
  }

  getGridOptions() {
    return { columns: 6, min_columns: 3 };
  }

  static override styles = css`
    ha-card {
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 4px;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin: -8px -8px -8px 0;
      border: none;
      background: none;
      color: var(--secondary-text-color);
      border-radius: 50%;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .tabs {
      display: flex;
      gap: 6px;
      padding: 8px 16px 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar {
      display: none;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 0 0 auto;
      min-height: 36px;
      padding: 0 14px;
      border-radius: 18px;
      border: 1px solid var(--divider-color, #ccc);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 14px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .tab ha-icon {
      --mdc-icon-size: 18px;
    }
    .tab[aria-selected="true"] {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .body {
      padding: 12px 16px 16px;
      /* Vertical scroll stays with the page; horizontal moves are our swipe. */
      touch-action: pan-y;
    }
    .message {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .message.error {
      color: var(--error-color, #db4437);
    }
    .stale {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--warning-color, #ffa600);
      color: #000;
      font-size: 13px;
    }
    .stale button {
      margin-left: auto;
      min-height: 32px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    dialog {
      box-sizing: border-box;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color);
    }
    dialog::backdrop {
      background: var(--primary-background-color, #fafafa);
    }
    .fs {
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
        env(safe-area-inset-left);
    }
    .fs .header {
      padding-top: 16px;
    }
    .fs-body {
      flex: 1;
      min-height: 0;
    }
    .fs-body .body {
      height: 100%;
      box-sizing: border-box;
    }
  `;
}

if (!customElements.get("virtual-remote-card")) {
  customElements.define("virtual-remote-card", VirtualRemoteCard);
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type: "virtual-remote-card",
    name: "Virtual Remote",
    description: "A touch-friendly remote with a drag-and-drop layout editor.",
    preview: true,
    documentationURL: "https://github.com/kozelkevinr-create/virtual-remote",
  });
}
