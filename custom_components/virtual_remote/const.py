"""Constants for the Virtual Remote integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "virtual_remote"

STORAGE_KEY: Final = f"{DOMAIN}.remotes"
STORAGE_VERSION: Final = 1
STORAGE_MINOR_VERSION: Final = 1

CONF_REMOTE_ID: Final = "remote_id"

# The card is served from here and registered as a Lovelace resource with
# `?v=CARD_VERSION` appended. Keep CARD_VERSION equal to manifest.json's version.
URL_BASE: Final = f"/{DOMAIN}"
CARD_FILENAME: Final = "virtual-remote-card.js"
CARD_URL: Final = f"{URL_BASE}/{CARD_FILENAME}"
CARD_VERSION: Final = "0.2.0"

DEFAULT_ICON: Final = "mdi:remote"
DEFAULT_COLUMNS: Final = 4
DEFAULT_GAP: Final = 8

# Commands the entity maps turn_on / turn_off onto, in order of preference.
POWER_ON_COMMANDS: Final = ("power_on", "power")
POWER_OFF_COMMANDS: Final = ("power_off", "power")


def signal_remote_updated(remote_id: str) -> str:
    """Dispatcher signal sent whenever a stored remote changes."""
    return f"{DOMAIN}_remote_updated_{remote_id}"
