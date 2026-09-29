// Placeholder served until the Lit card lands in build step 3, which replaces
// this file with the Vite bundle. It only proves the resource is loaded and
// the WebSocket API answers.
const CARD_VERSION = "0.2.0";

class VirtualRemoteCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._loaded = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this._load();
    }
  }

  async _load() {
    let text;
    try {
      const { version } = await this._hass.callWS({ type: "virtual_remote/version" });
      const id = this._config.remote_id;
      if (id) {
        const remote = await this._hass.callWS({ type: "virtual_remote/get", remote_id: id });
        text = `${remote.name}: ${remote.buttons.length} button(s)`;
      } else {
        const { remotes } = await this._hass.callWS({ type: "virtual_remote/list" });
        text = `${remotes.length} stored remote(s): ${remotes.map((r) => r.id).join(", ") || "none"}`;
      }
      text += ` · card ${CARD_VERSION}, backend ${version}`;
    } catch (err) {
      text = `Error: ${err.message ?? err}`;
    }
    this.innerHTML = "";
    const card = document.createElement("ha-card");
    card.header = "Virtual Remote";
    const body = document.createElement("div");
    body.className = "card-content";
    body.textContent = text;
    card.appendChild(body);
    this.appendChild(card);
  }

  getCardSize() {
    return 2;
  }

  static getStubConfig() {
    return {};
  }
}

if (!customElements.get("virtual-remote-card")) {
  customElements.define("virtual-remote-card", VirtualRemoteCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "virtual-remote-card",
    name: "Virtual Remote",
    description: "A touch-friendly remote built from a stored layout.",
  });
}
