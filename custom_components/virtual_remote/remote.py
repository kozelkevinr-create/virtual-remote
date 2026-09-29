"""Remote entity: turns `remote.send_command` into a button's configured action."""

from __future__ import annotations

import asyncio
from collections.abc import Iterable
from typing import Any

from homeassistant.components.remote import (
    ATTR_DELAY_SECS,
    ATTR_NUM_REPEATS,
    DEFAULT_DELAY_SECS,
    DEFAULT_NUM_REPEATS,
    RemoteEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DATA_STORE
from .const import CONF_REMOTE_ID, DOMAIN, POWER_OFF_COMMANDS, POWER_ON_COMMANDS
from .store import RemoteStore


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    async_add_entities(
        [VirtualRemoteEntity(hass.data[DATA_STORE], entry.data[CONF_REMOTE_ID])]
    )


class VirtualRemoteEntity(RemoteEntity):
    """A remote whose commands are the button ids of a stored layout.

    There is no device behind it to report power state, so the entity is
    always "on"; turn_on/turn_off map onto power buttons if the layout has them.
    """

    _attr_should_poll = False
    _attr_is_on = True

    def __init__(self, store: RemoteStore, remote_id: str) -> None:
        self._store = store
        self._remote_id = remote_id
        remote = store.get(remote_id)
        self._attr_unique_id = remote_id
        self._attr_name = remote["name"]
        self._attr_icon = remote["icon"]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        remote = self._store.get(self._remote_id)
        return {
            "remote_id": self._remote_id,
            "commands": [button["id"] for button in remote["buttons"]],
        }

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._async_press_first(POWER_ON_COMMANDS)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._async_press_first(POWER_OFF_COMMANDS)

    async def async_send_command(self, command: Iterable[str], **kwargs: Any) -> None:
        num_repeats: int = kwargs.get(ATTR_NUM_REPEATS, DEFAULT_NUM_REPEATS)
        delay: float = kwargs.get(ATTR_DELAY_SECS, DEFAULT_DELAY_SECS)
        commands = list(command)
        # Resolve everything up front so a typo fails before anything is sent.
        buttons = [self._get_button(button_id) for button_id in commands]

        for repeat in range(num_repeats):
            for index, button in enumerate(buttons):
                if repeat or index:
                    await asyncio.sleep(delay)
                await self._async_run_action(button)

    async def _async_press_first(self, candidates: tuple[str, ...]) -> None:
        for button_id in candidates:
            if button := self._store.get_button(self._remote_id, button_id):
                await self._async_run_action(button)
                return
        raise ServiceValidationError(
            f"{self.entity_id} has no button with id "
            + " or ".join(repr(c) for c in candidates),
            translation_domain=DOMAIN,
            translation_key="no_power_button",
            translation_placeholders={"commands": ", ".join(candidates)},
        )

    def _get_button(self, button_id: str) -> dict[str, Any]:
        button = self._store.get_button(self._remote_id, button_id)
        if button is None:
            raise ServiceValidationError(
                f"{self.entity_id} has no button with id {button_id!r}",
                translation_domain=DOMAIN,
                translation_key="unknown_command",
                translation_placeholders={"command": button_id},
            )
        return button

    async def _async_run_action(self, button: dict[str, Any]) -> None:
        action = button["tap_action"]
        if action["action"] == "none":
            return
        if action["action"] != "perform-action":
            # navigate / more-info / url only make sense in a browser.
            raise ServiceValidationError(
                f"Button {button['id']!r} uses {action['action']!r}, "
                "which only the card can perform",
                translation_domain=DOMAIN,
                translation_key="frontend_only_action",
                translation_placeholders={
                    "command": button["id"],
                    "action": action["action"],
                },
            )

        target: dict[str, Any] = dict(action.get("target") or {})
        data: dict[str, Any] = dict(action.get("data") or {})
        targeted = target.get(ATTR_ENTITY_ID, data.get(ATTR_ENTITY_ID, []))
        if isinstance(targeted, str):
            targeted = [targeted]
        if self.entity_id in targeted:
            raise ServiceValidationError(
                f"Button {button['id']!r} targets {self.entity_id} itself",
                translation_domain=DOMAIN,
                translation_key="self_target",
                translation_placeholders={"command": button["id"]},
            )

        domain, service = action["perform_action"].split(".", 1)
        await self.hass.services.async_call(
            domain,
            service,
            data,
            target=target or None,
            blocking=True,
            context=self._context,
        )
