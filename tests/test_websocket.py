"""WebSocket API: version, list/get, save and delete."""

from __future__ import annotations

from homeassistant.components.websocket_api import ERR_UNAUTHORIZED
from homeassistant.core import HomeAssistant

from custom_components.virtual_remote import DATA_STORE
from custom_components.virtual_remote.const import CARD_VERSION, DOMAIN

from .common import ENTITY_ID, REMOTE_ID, button, create_remote


async def test_version(hass: HomeAssistant, hass_ws_client) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": f"{DOMAIN}/version"})
    msg = await client.receive_json()

    assert msg["success"]
    assert msg["result"] == {"version": CARD_VERSION}


async def test_list_and_get(hass: HomeAssistant, hass_ws_client) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": f"{DOMAIN}/list"})
    msg = await client.receive_json()
    assert [remote["id"] for remote in msg["result"]["remotes"]] == [REMOTE_ID]

    await client.send_json_auto_id({"type": f"{DOMAIN}/get", "remote_id": REMOTE_ID})
    msg = await client.receive_json()
    assert msg["result"]["name"] == "Living Room TV"
    assert msg["result"]["buttons"] == []


async def test_get_unknown_remote(hass: HomeAssistant, hass_ws_client) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": f"{DOMAIN}/get", "remote_id": "nope"})
    msg = await client.receive_json()

    assert not msg["success"]
    assert msg["error"]["translation_key"] == "unknown_remote"
    assert msg["error"]["translation_placeholders"] == {"remote_id": "nope"}


async def test_save_updates_layout_and_entity(
    hass: HomeAssistant, hass_ws_client
) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/save",
            "remote_id": REMOTE_ID,
            "grid": {"columns": 3},
            "buttons": [button("vol_up", perform_action="media_player.volume_up")],
            # Not accepted: name and icon belong to the config entry.
        }
    )
    msg = await client.receive_json()

    assert msg["success"]
    assert msg["result"]["grid"] == {"columns": 3, "gap": 8}
    assert msg["result"]["name"] == "Living Room TV"
    assert hass.data[DATA_STORE].get(REMOTE_ID)["buttons"][0]["id"] == "vol_up"
    await hass.async_block_till_done()
    assert hass.states.get(ENTITY_ID).attributes["commands"] == ["vol_up"]


async def test_save_rejects_invalid_layout(hass: HomeAssistant, hass_ws_client) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/save",
            "remote_id": REMOTE_ID,
            # Valid on their own; invalid only because the ids repeat.
            "buttons": [{"id": "a", "position": {"x": 0, "y": 0}}] * 2,
        }
    )
    msg = await client.receive_json()

    assert not msg["success"]
    assert msg["error"]["translation_key"] == "invalid_remote"
    assert hass.data[DATA_STORE].get(REMOTE_ID)["buttons"] == []


async def test_save_unknown_remote(hass: HomeAssistant, hass_ws_client) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/save", "remote_id": "nope", "buttons": []}
    )
    msg = await client.receive_json()

    assert not msg["success"]
    assert msg["error"]["translation_key"] == "unknown_remote"
    assert "nope" not in [r["id"] for r in hass.data[DATA_STORE].list_remotes()]


async def test_delete_removes_entry_and_layout(
    hass: HomeAssistant, hass_ws_client
) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": f"{DOMAIN}/delete", "remote_id": REMOTE_ID})
    msg = await client.receive_json()
    await hass.async_block_till_done()

    assert msg["success"]
    assert hass.config_entries.async_entries(DOMAIN) == []
    assert hass.data[DATA_STORE].list_remotes() == []
    assert hass.states.get(ENTITY_ID) is None


async def test_writes_require_admin(
    hass: HomeAssistant, hass_ws_client, hass_read_only_access_token
) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass, hass_read_only_access_token)

    for msg_type in ("save", "delete"):
        await client.send_json_auto_id(
            {"type": f"{DOMAIN}/{msg_type}", "remote_id": REMOTE_ID}
        )
        msg = await client.receive_json()
        assert msg["error"]["code"] == ERR_UNAUTHORIZED

    # Reads stay open to every user so non-admins can use the card.
    await client.send_json_auto_id({"type": f"{DOMAIN}/get", "remote_id": REMOTE_ID})
    assert (await client.receive_json())["success"]


async def test_subscribe_pushes_changes_and_deletion(
    hass: HomeAssistant, hass_ws_client
) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": f"{DOMAIN}/subscribe", "remote_id": REMOTE_ID})
    sub_id = (await client.receive_json())["id"]
    initial = await client.receive_json()
    assert initial["id"] == sub_id
    assert initial["event"]["remote"]["buttons"] == []

    store = hass.data[DATA_STORE]
    remote = store.get(REMOTE_ID)
    remote["buttons"] = [{"id": "ok", "position": {"x": 0, "y": 0}}]
    store.upsert(remote)
    changed = await client.receive_json()
    assert [b["id"] for b in changed["event"]["remote"]["buttons"]] == ["ok"]

    store.delete(REMOTE_ID)
    deleted = await client.receive_json()
    assert deleted["event"] == {"remote": None}


async def test_subscribe_unknown_remote(hass: HomeAssistant, hass_ws_client) -> None:
    await create_remote(hass)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": f"{DOMAIN}/subscribe", "remote_id": "nope"})
    msg = await client.receive_json()

    assert msg["error"]["translation_key"] == "unknown_remote"
