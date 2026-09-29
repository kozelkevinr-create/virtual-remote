# AGENTS.md

Home Assistant custom integration (`custom_components/virtual_remote/`) plus a
Lovelace card for building **virtual remotes** with a drag-and-drop editor.
Mobile (the HA companion app) is the primary target, not an afterthought.

The approved design and 8-step build order live in
`~/.claude/plans/abundant-percolating-seal.md`. Read it before starting a new step.

## Architecture rules

- **The backend owns remote definitions.** They live in HA storage
  (`store.py`, key `virtual_remote.remotes`), not in card config. A card either
  references a stored remote by `remote_id` or defines buttons inline.
- **One config entry = one remote = one `remote` entity.** The entry's
  `remote_id` is `slugify(name)` at creation time and never changes; renames
  only touch `name`/`icon`.
- **Every press goes through `remote.send_command`**, whether it comes from the
  card or an automation, so both use the same code path. Only `perform-action` and `none`
  run server-side. `navigate`/`more-info`/`url` are card-only.
- Store `perform-action`, never `call-service` (renamed in HA 2024.8).
  `store.py` upgrades the old form on validation. Keep that working.
- Schema changes to stored data need a bump of `STORAGE_VERSION` /
  `STORAGE_MINOR_VERSION` and a branch in `_VersionedStore._async_migrate_func`.
- Card-serving and Lovelace resource registration belong in `async_setup`
  (once per process), never `async_setup_entry`.
- User-facing errors are `ServiceValidationError` with a `translation_key`.
  Every key and `{placeholder}` must exist in `strings.json`, and
  `translations/en.json` is a copy of it, so keep the two identical.

## Frontend (from build step 3 on)

TypeScript + Lit + Vite, bundled to a single file committed at
`custom_components/virtual_remote/frontend/virtual-remote-card.js` so HACS
users need no Node. Drag-and-drop uses native Pointer Events, with no library. Only
set `touch-action: none` once a drag is armed (after the long-press), or the
editor dialog can't scroll on phones.

## Testing

- Python tests use `pytest-homeassistant-custom-component`. HA needs
  **Python 3.13+** (the dev Mac's system Python is 3.9, so use Homebrew's):
  ```sh
  /opt/homebrew/bin/python3.13 -m venv .venv
  .venv/bin/pip install -r requirements_test.txt
  .venv/bin/pytest -q -p no:logging
  ```
  On 3.13 the harness resolves to HA 2026.2.x, and newer HA may need 3.14.
  `home-assistant-frontend` must match the HA version's
  `package_constraints.txt`. Without it, the manifest's `frontend` dependency
  fails every setup test.
- HA's `slugify()` returns `"unknown"` (not `""`) for input with no
  alphanumerics, so don't rely on an empty slug to detect bad names.
- Desktop-browser testing at narrow width does **not** substitute for testing
  in the companion app on a real phone (touch vs. scroll, haptics, caching).

## Tools

When the MCP servers are connected, use them for narrow work and review what
they return:

- `typesafe` / `jev_ask_boolean`: yes/no verification (e.g. strings ↔ code
  consistency, manifest conventions). Batch related questions in one call and
  re-check low-confidence answers by hand.
- `local-llm` / `ask_local_model`: text chores such as UI strings, docs and
  boilerplate prose. Not for code. It runs on a desktop that may be asleep, so
  retry once if it reports unavailable.

## Open items

- `manifest.json` `documentation`/`issue_tracker` URLs still use an `OWNER`
  placeholder.
