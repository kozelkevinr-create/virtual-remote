"""Config flow, store and send_command behaviour."""

from __future__ import annotations

import pytest
import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ServiceValidationError

from custom_components.virtual_remote import DATA_STORE
from custom_components.virtual_remote.const import DOMAIN
from custom_components.virtual_remote.store import REMOTE_SCHEMA

from pytest_homeassistant_custom_component.common import async_mock_service

from .common import ENTITY_ID, button as _button, create_remote as _create_remote


async def test_flow_creates_empty_remote(hass: HomeAssistant) -> None:
    result = await _create_remote(hass)

    assert result["type"] is FlowResultType.CREATE_ENTRY
    remote = hass.data[DATA_STORE].get("living_room_tv")
    assert remote["name"] == "Living Room TV"
    assert remote["buttons"] == []
    assert hass.states.get(ENTITY_ID) is not None


async def test_flow_rejects_duplicate_name(hass: HomeAssistant) -> None:
    await _create_remote(hass)
    result = await _create_remote(hass)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_flow_rejects_unsluggable_name(hass: HomeAssistant) -> None:
    result = await _create_remote(hass, name="!!!")

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"name": "invalid_name"}


def test_schema_upgrades_call_service() -> None:
    remote = REMOTE_SCHEMA(
        {
            "id": "tv",
            "name": "TV",
            "buttons": [
                {
                    "id": "mute",
                    "position": {"x": 0, "y": 0},
                    "tap_action": {
                        "action": "call-service",
                        "service": "media_player.volume_mute",
                        "service_data": {"is_volume_muted": True},
                    },
                }
            ],
        }
    )

    assert remote["buttons"][0]["tap_action"] == {
        "action": "perform-action",
        "perform_action": "media_player.volume_mute",
        "data": {"is_volume_muted": True},
    }


def test_schema_rejects_duplicate_button_ids() -> None:
    button = {"id": "a", "position": {"x": 0, "y": 0}}
    with pytest.raises(vol.Invalid):
        REMOTE_SCHEMA({"id": "tv", "name": "TV", "buttons": [button, button]})


async def test_send_command_calls_button_action(hass: HomeAssistant) -> None:
    await _create_remote(hass)
    calls: list[ServiceCall] = async_mock_service(hass, "media_player", "volume_up")
    store = hass.data[DATA_STORE]
    remote = store.get("living_room_tv")
    remote["buttons"] = [
        _button(
            "vol_up",
            perform_action="media_player.volume_up",
            target={"entity_id": "media_player.tv"},
        )
    ]
    store.upsert(remote)

    await hass.services.async_call(
        "remote",
        "send_command",
        {"entity_id": ENTITY_ID, "command": "vol_up", "num_repeats": 3, "delay_secs": 0},
        blocking=True,
    )

    assert len(calls) == 3
    assert calls[0].data["entity_id"] == "media_player.tv"


async def test_held_press_runs_hold_action(hass: HomeAssistant) -> None:
    await _create_remote(hass)
    taps = async_mock_service(hass, "media_player", "media_play_pause")
    holds = async_mock_service(hass, "media_player", "media_stop")
    store = hass.data[DATA_STORE]
    remote = store.get("living_room_tv")
    remote["buttons"] = [
        {
            **_button("play", perform_action="media_player.media_play_pause"),
            "hold_action": {
                "action": "perform-action",
                "perform_action": "media_player.media_stop",
            },
        },
        _button("tap_only", perform_action="media_player.media_play_pause"),
    ]
    store.upsert(remote)

    for command in ("play", "tap_only"):
        await hass.services.async_call(
            "remote",
            "send_command",
            {"entity_id": ENTITY_ID, "command": command, "hold_secs": 0.5},
            blocking=True,
        )

    # A button without a hold action falls back to its tap action.
    assert (len(holds), len(taps)) == (1, 1)


async def test_press_action_is_an_alias(hass: HomeAssistant) -> None:
    await _create_remote(hass)
    calls = async_mock_service(hass, "media_player", "volume_up")
    store = hass.data[DATA_STORE]
    remote = store.get("living_room_tv")
    remote["buttons"] = [_button("vol_up", perform_action="media_player.volume_up")]
    store.upsert(remote)

    await hass.services.async_call(
        DOMAIN, "press", {"entity_id": ENTITY_ID, "command": "vol_up"}, blocking=True
    )

    assert len(calls) == 1


async def test_send_command_unknown_button(hass: HomeAssistant) -> None:
    await _create_remote(hass)

    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            "remote",
            "send_command",
            {"entity_id": ENTITY_ID, "command": "nope"},
            blocking=True,
        )


async def test_send_command_refuses_self_target(hass: HomeAssistant) -> None:
    await _create_remote(hass)
    store = hass.data[DATA_STORE]
    remote = store.get("living_room_tv")
    remote["buttons"] = [
        _button(
            "loop",
            perform_action="remote.send_command",
            target={"entity_id": ENTITY_ID},
            data={"command": "loop"},
        )
    ]
    store.upsert(remote)

    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            "remote",
            "send_command",
            {"entity_id": ENTITY_ID, "command": "loop"},
            blocking=True,
        )


async def test_removing_entry_deletes_layout(hass: HomeAssistant) -> None:
    result = await _create_remote(hass)

    await hass.config_entries.async_remove(result["result"].entry_id)
    await hass.async_block_till_done()

    assert "living_room_tv" not in [r["id"] for r in hass.data[DATA_STORE].list_remotes()]
