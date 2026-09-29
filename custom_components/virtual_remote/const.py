"""Constants for the Virtual Remote integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "virtual_remote"

STORAGE_KEY: Final = f"{DOMAIN}.remotes"
STORAGE_VERSION: Final = 1
STORAGE_MINOR_VERSION: Final = 1

CONF_REMOTE_ID: Final = "remote_id"

DEFAULT_ICON: Final = "mdi:remote"
DEFAULT_COLUMNS: Final = 4
DEFAULT_GAP: Final = 8

# Commands the entity maps turn_on / turn_off onto, in order of preference.
POWER_ON_COMMANDS: Final = ("power_on", "power")
POWER_OFF_COMMANDS: Final = ("power_off", "power")
