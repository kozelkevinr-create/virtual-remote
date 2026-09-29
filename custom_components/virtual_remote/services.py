"""The `virtual_remote.press` action: a friendlier alias for remote.send_command."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.components.remote import (
    ATTR_COMMAND,
    ATTR_HOLD_SECS,
    DOMAIN as REMOTE_DOMAIN,
    SERVICE_SEND_COMMAND,
)
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall, callback
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN

SERVICE_PRESS = "press"
ATTR_HOLD = "hold"

PRESS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Required(ATTR_COMMAND): cv.string,
        vol.Optional(ATTR_HOLD, default=False): cv.boolean,
    }
)


@callback
def async_register_services(hass: HomeAssistant) -> None:
    async def press(call: ServiceCall) -> None:
        # Same code path as the card: straight through remote.send_command.
        data = {
            ATTR_ENTITY_ID: call.data[ATTR_ENTITY_ID],
            ATTR_COMMAND: [call.data[ATTR_COMMAND]],
        }
        if call.data[ATTR_HOLD]:
            data[ATTR_HOLD_SECS] = 0.5
        await hass.services.async_call(
            REMOTE_DOMAIN, SERVICE_SEND_COMMAND, data, blocking=True, context=call.context
        )

    hass.services.async_register(DOMAIN, SERVICE_PRESS, press, schema=PRESS_SCHEMA)
