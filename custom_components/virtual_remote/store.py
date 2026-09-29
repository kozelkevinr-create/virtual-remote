"""Persistent storage for virtual remote definitions."""

from __future__ import annotations

import copy
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util.hass_dict import HassKey

from .const import (
    DEFAULT_COLUMNS,
    DEFAULT_GAP,
    DEFAULT_ICON,
    DOMAIN,
    STORAGE_KEY,
    STORAGE_MINOR_VERSION,
    STORAGE_VERSION,
    signal_remote_updated,
)


def _normalize_action(value: Any) -> dict[str, Any]:
    """Validate an action, upgrading the pre-2024.8 `call-service` form."""
    if not isinstance(value, dict) or not isinstance(value.get("action"), str):
        raise vol.Invalid("action must be an object with an 'action' key")
    action = dict(value)
    if action["action"] == "call-service":
        action["action"] = "perform-action"
        if "service" in action:
            action["perform_action"] = action.pop("service")
        if "service_data" in action:
            action["data"] = action.pop("service_data")
    if action["action"] == "perform-action":
        action["perform_action"] = cv.service(action.get("perform_action"))
    return action


NONE_ACTION: dict[str, Any] = {"action": "none"}

POSITION_SCHEMA = vol.Schema(
    {
        vol.Required("x"): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Required("y"): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional("w", default=1): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Optional("h", default=1): vol.All(vol.Coerce(int), vol.Range(min=1)),
    }
)

BUTTON_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.slug,
        vol.Optional("label", default=""): cv.string,
        vol.Optional("icon"): cv.icon,
        vol.Optional("shape", default="rect"): vol.In(["circle", "rect", "pill"]),
        vol.Optional("color"): vol.Schema(
            {vol.Optional("bg"): cv.string, vol.Optional("fg"): cv.string}
        ),
        vol.Required("position"): POSITION_SCHEMA,
        vol.Optional("tap_action", default=NONE_ACTION): _normalize_action,
        vol.Optional("hold_action", default=NONE_ACTION): _normalize_action,
        vol.Optional("repeat", default={"enabled": False}): vol.Schema(
            {
                vol.Optional("enabled", default=False): cv.boolean,
                vol.Optional("delay_ms", default=400): vol.All(
                    vol.Coerce(int), vol.Range(min=50)
                ),
                vol.Optional("interval_ms", default=150): vol.All(
                    vol.Coerce(int), vol.Range(min=50)
                ),
            }
        ),
        vol.Optional("haptic", default="light"): vol.In(
            ["none", "light", "medium", "heavy", "selection"]
        ),
    }
)


def _unique_button_ids(buttons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ids = [button["id"] for button in buttons]
    if len(ids) != len(set(ids)):
        raise vol.Invalid("button ids must be unique within a remote")
    return buttons


REMOTE_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.slug,
        vol.Required("name"): cv.string,
        vol.Optional("icon", default=DEFAULT_ICON): cv.icon,
        vol.Optional(
            "grid", default={"columns": DEFAULT_COLUMNS, "gap": DEFAULT_GAP}
        ): vol.Schema(
            {
                vol.Optional("columns", default=DEFAULT_COLUMNS): vol.All(
                    vol.Coerce(int), vol.Range(min=1, max=12)
                ),
                vol.Optional("gap", default=DEFAULT_GAP): vol.All(
                    vol.Coerce(int), vol.Range(min=0, max=32)
                ),
            }
        ),
        vol.Optional("buttons", default=list): vol.All(
            [BUTTON_SCHEMA], _unique_button_ids
        ),
    }
)


class RemoteNotFoundError(ServiceValidationError):
    """Raised when a remote id is not in the store."""

    def __init__(self, remote_id: str) -> None:
        super().__init__(
            f"Unknown remote: {remote_id}",
            translation_domain=DOMAIN,
            translation_key="unknown_remote",
            translation_placeholders={"remote_id": remote_id},
        )


class _VersionedStore(Store[dict[str, Any]]):
    """Store with a migration hook so schema changes have somewhere to go."""

    async def _async_migrate_func(
        self,
        old_major_version: int,
        old_minor_version: int,
        old_data: dict[str, Any],
    ) -> dict[str, Any]:
        # No migrations yet; version 1.1 is the first schema.
        return old_data


class RemoteStore:
    """Load, validate and persist remote definitions."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._store = _VersionedStore(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            minor_version=STORAGE_MINOR_VERSION,
        )
        self._remotes: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        data = await self._store.async_load()
        self._remotes = (data or {}).get("remotes", {})

    def _async_schedule_save(self) -> None:
        self._store.async_delay_save(lambda: {"remotes": self._remotes}, 1)

    def list_remotes(self) -> list[dict[str, Any]]:
        return [copy.deepcopy(remote) for remote in self._remotes.values()]

    def get(self, remote_id: str) -> dict[str, Any]:
        try:
            return copy.deepcopy(self._remotes[remote_id])
        except KeyError:
            raise RemoteNotFoundError(remote_id) from None

    def get_button(self, remote_id: str, button_id: str) -> dict[str, Any] | None:
        remote = self._remotes.get(remote_id)
        if remote is None:
            raise RemoteNotFoundError(remote_id)
        for button in remote["buttons"]:
            if button["id"] == button_id:
                return copy.deepcopy(button)
        return None

    def upsert(self, remote: dict[str, Any]) -> dict[str, Any]:
        """Validate and save a full remote definition."""
        validated = REMOTE_SCHEMA(remote)
        self._remotes[validated["id"]] = validated
        self._async_schedule_save()
        async_dispatcher_send(self._hass, signal_remote_updated(validated["id"]))
        return copy.deepcopy(validated)

    def ensure(self, remote_id: str, name: str, icon: str) -> dict[str, Any]:
        """Create an empty remote if one with this id does not exist yet."""
        if remote_id in self._remotes:
            return self.get(remote_id)
        return self.upsert({"id": remote_id, "name": name, "icon": icon})

    def update_meta(self, remote_id: str, name: str, icon: str) -> dict[str, Any]:
        remote = self.get(remote_id)
        remote["name"] = name
        remote["icon"] = icon
        return self.upsert(remote)

    def delete(self, remote_id: str) -> None:
        if self._remotes.pop(remote_id, None) is not None:
            self._async_schedule_save()


DATA_STORE: HassKey[RemoteStore] = HassKey(DOMAIN)
