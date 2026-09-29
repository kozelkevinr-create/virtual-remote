"""The Virtual Remote integration."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_ICON, CONF_NAME, Platform
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.util.hass_dict import HassKey

from .const import CONF_REMOTE_ID, DEFAULT_ICON, DOMAIN
from .store import RemoteStore

PLATFORMS: list[Platform] = [Platform.REMOTE]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

DATA_STORE: HassKey[RemoteStore] = HassKey(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Load the shared store once per HA process, before any entry sets up."""
    store = RemoteStore(hass)
    await store.async_load()
    hass.data[DATA_STORE] = store
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one virtual remote from a config entry."""
    store = hass.data[DATA_STORE]
    remote_id = entry.data[CONF_REMOTE_ID]
    name = entry.options.get(CONF_NAME, entry.data[CONF_NAME])
    icon = entry.options.get(CONF_ICON, entry.data.get(CONF_ICON, DEFAULT_ICON))
    remote = store.ensure(remote_id, name, icon)
    if (remote["name"], remote["icon"]) != (name, icon):
        # Options flow renamed it; the store is what the card reads.
        store.update_meta(remote_id, name, icon)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Deleting the integration entry deletes the stored layout with it."""
    if (store := hass.data.get(DATA_STORE)) is not None:
        store.delete(entry.data[CONF_REMOTE_ID])


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)
