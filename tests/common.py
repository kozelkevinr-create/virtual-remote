"""Helpers shared by the test modules."""

from __future__ import annotations

from homeassistant import config_entries
from homeassistant.core import HomeAssistant

from custom_components.virtual_remote.const import DOMAIN

ENTITY_ID = "remote.living_room_tv"
REMOTE_ID = "living_room_tv"


async def create_remote(hass: HomeAssistant, name: str = "Living Room TV"):
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": name, "icon": "mdi:television"}
    )
    await hass.async_block_till_done()
    return result


def button(button_id: str, **action) -> dict:
    return {
        "id": button_id,
        "position": {"x": 0, "y": 0},
        "tap_action": {"action": "perform-action", **action},
    }
