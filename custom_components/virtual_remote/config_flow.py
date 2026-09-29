"""Config flow for Virtual Remote: one config entry per remote."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import CONF_ICON, CONF_NAME
from homeassistant.core import callback
from homeassistant.helpers.selector import IconSelector, TextSelector
from homeassistant.util import slugify

from .const import CONF_REMOTE_ID, DEFAULT_ICON, DOMAIN


def _schema(name: str = "", icon: str = DEFAULT_ICON) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_NAME, default=name): TextSelector(),
            vol.Required(CONF_ICON, default=icon): IconSelector(),
        }
    )


class VirtualRemoteConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create a new, empty virtual remote."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            name = user_input[CONF_NAME]
            # slugify() returns "unknown" rather than "" for names like "!!!".
            if not any(char.isalnum() for char in name):
                errors[CONF_NAME] = "invalid_name"
            else:
                remote_id = slugify(name)
                await self.async_set_unique_id(remote_id)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=user_input[CONF_NAME],
                    data={
                        CONF_REMOTE_ID: remote_id,
                        CONF_NAME: user_input[CONF_NAME],
                        CONF_ICON: user_input[CONF_ICON],
                    },
                )

        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(_schema(), user_input),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return VirtualRemoteOptionsFlow()


class VirtualRemoteOptionsFlow(OptionsFlow):
    """Rename a remote or change its icon. The id stays fixed."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self.config_entry
        if user_input is not None:
            self.hass.config_entries.async_update_entry(
                entry, title=user_input[CONF_NAME]
            )
            return self.async_create_entry(data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=_schema(
                entry.options.get(CONF_NAME, entry.data[CONF_NAME]),
                entry.options.get(CONF_ICON, entry.data.get(CONF_ICON, DEFAULT_ICON)),
            ),
        )
