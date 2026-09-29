"""WebSocket API the card and its editor use to read and write remotes."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError

from .const import CARD_VERSION, CONF_REMOTE_ID, DOMAIN
from .store import DATA_STORE, RemoteStore


def _store(hass: HomeAssistant) -> RemoteStore:
    return hass.data[DATA_STORE]


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    for handler in (ws_version, ws_list, ws_get, ws_save, ws_delete):
        websocket_api.async_register_command(hass, handler)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/version"})
@callback
def ws_version(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Backend version, so a cached card can tell it is out of date."""
    connection.send_result(msg["id"], {"version": CARD_VERSION})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list"})
@callback
def ws_list(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    connection.send_result(msg["id"], {"remotes": _store(hass).list_remotes()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get",
        vol.Required(CONF_REMOTE_ID): str,
    }
)
@callback
def ws_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    connection.send_result(msg["id"], _store(hass).get(msg[CONF_REMOTE_ID]))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save",
        vol.Required(CONF_REMOTE_ID): str,
        vol.Optional("grid"): dict,
        vol.Optional("buttons"): list,
    }
)
@websocket_api.require_admin
@callback
def ws_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Replace a remote's grid and/or buttons.

    Remotes are created by the config flow and renamed by the options flow,
    so this never creates a remote or touches its id, name or icon.
    """
    store = _store(hass)
    remote = store.get(msg[CONF_REMOTE_ID])
    for key in ("grid", "buttons"):
        if key in msg:
            remote[key] = msg[key]
    try:
        saved = store.upsert(remote)
    except vol.Invalid as err:
        raise ServiceValidationError(
            f"Invalid remote definition: {err}",
            translation_domain=DOMAIN,
            translation_key="invalid_remote",
            translation_placeholders={"error": str(err)},
        ) from err
    connection.send_result(msg["id"], saved)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/delete",
        vol.Required(CONF_REMOTE_ID): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_delete(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete a remote by removing its config entry, which drops the layout too."""
    remote_id = msg[CONF_REMOTE_ID]
    entry = next(
        (
            entry
            for entry in hass.config_entries.async_entries(DOMAIN)
            if entry.data[CONF_REMOTE_ID] == remote_id
        ),
        None,
    )
    if entry is not None:
        await hass.config_entries.async_remove(entry.entry_id)
    else:
        store = _store(hass)
        # Raises if unknown; otherwise it's an orphaned layout with no entry.
        store.get(remote_id)
        store.delete(remote_id)
    connection.send_result(msg["id"])
