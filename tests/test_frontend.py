"""Card serving and Lovelace resource registration."""

from __future__ import annotations

import json
from pathlib import Path

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from custom_components.virtual_remote.const import CARD_URL, CARD_VERSION

from .common import create_remote

INTEGRATION_DIR = Path(__file__).parents[1] / "custom_components" / "virtual_remote"
VERSIONED_URL = f"{CARD_URL}?v={CARD_VERSION}"


def _card_resources(hass: HomeAssistant) -> list[dict]:
    return [
        item
        for item in hass.data[LOVELACE_DATA].resources.async_items()
        if item["url"].startswith(CARD_URL)
    ]


def test_card_version_matches_manifest() -> None:
    manifest = json.loads((INTEGRATION_DIR / "manifest.json").read_text())
    assert manifest["version"] == CARD_VERSION


async def test_card_is_served(hass: HomeAssistant, hass_client) -> None:
    await create_remote(hass)
    client = await hass_client()

    resp = await client.get(CARD_URL)

    assert resp.status == 200
    assert "virtual-remote-card" in await resp.text()


async def test_resource_registered_once(hass: HomeAssistant) -> None:
    await create_remote(hass)
    await create_remote(hass, "Bedroom TV")

    resources = _card_resources(hass)
    assert len(resources) == 1
    assert resources[0]["url"] == VERSIONED_URL
    assert resources[0]["type"] == "module"


async def test_stale_resources_upgraded_and_deduplicated(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {})
    resources = hass.data[LOVELACE_DATA].resources
    await resources.async_load()
    resources.loaded = True
    for version in ("0.0.1", "0.0.2"):
        await resources.async_create_item(
            {"res_type": "module", "url": f"{CARD_URL}?v={version}"}
        )

    await create_remote(hass)

    assert [item["url"] for item in _card_resources(hass)] == [VERSIONED_URL]
