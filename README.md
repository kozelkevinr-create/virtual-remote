# Virtual Remote

Build touch-friendly remotes for Home Assistant and arrange them by dragging
buttons around, right on your phone.

- **Any action.** A button can run any Home Assistant action, so it works with
  Broadlink, ESPHome, media players, scripts and anything else.
- **Made for phones.** Large touch targets, press-and-hold repeat for volume,
  haptics in the companion app, and no accidental presses while scrolling.
- **Drag-and-drop editor** inside the normal "Edit dashboard" flow.
- **One set of buttons for the card and automations.** Each remote is a
  `remote.*` entity, and `remote.send_command` presses the same buttons the card
  shows.
- **Profiles.** Swap between several remotes (TV, Apple TV, soundbar) in one
  card. The active one can be shared by every device.

<!-- TODO: GIFs of the editor and of profile switching on a phone. -->

## Install

### HACS (recommended)

1. HACS → ⋮ → **Custom repositories** → add
   `https://github.com/kozelkevinr-create/virtual-remote` as an **Integration**.
2. Install **Virtual Remote** and restart Home Assistant.

### Manual

Copy `custom_components/virtual_remote/` into your `config/custom_components/`
and restart. The card ships prebuilt inside that folder, so you don't need Node.

## Create a remote

Settings → Devices & services → **Add integration** → **Virtual Remote**. Give
it a name. The name becomes the remote's permanent ID (for example
`living_room_tv`), and you get a `remote.living_room_tv` entity. Create one
remote per device you want to control.

## Add the card

Edit a dashboard → **Add card** → **Virtual Remote**. The card is registered as
a dashboard resource automatically.

> **YAML-mode dashboards:** add the resource yourself:
> ```yaml
> lovelace:
>   resources:
>     - url: /virtual_remote/virtual-remote-card.js?v=0.3.0
>       type: module
> ```

### The editor

The editor has four tabs so it stays usable on a phone:

| Tab | What it does |
|---|---|
| **Arrange** | Tap a button to select it. **Hold, then drag** to move it. Dropping it on a button of the same size swaps them. Drag the round corner handle to resize. Drop a button outside the grid to delete it (you can undo). ⤢ opens a fullscreen canvas. |
| **Add** | Presets: power, volume, channel, d-pad, back/home/menu, playback, number pad, custom. Tap one to add it at the first free spot, or **hold and drag** it onto the layout to place it exactly (the outline turns red where it won't fit). Pick a media player first, and the power, volume and playback buttons are wired to it. |
| **Button** | Label, icon, tap and hold actions, repeat-while-held, shape, colours, vibration, size, and command ID. |
| **Remote** | Stored or inline, which remotes (profiles), shared profile helper, columns, spacing, title and fullscreen button. |

A short drag scrolls the editor as usual. A button only moves after you hold it
for about a quarter of a second.

Changes to a stored remote save automatically, and every open card updates
live. Changes to an inline remote are saved with the card.

### Card options

```yaml
type: custom:virtual-remote-card
remote_id: living_room_tv   # a stored remote
show_header: true           # title bar (default true)
fullscreen: true            # fullscreen button in the title bar (default true)
```

Inline remotes live only in the card and have no entity:

```yaml
type: custom:virtual-remote-card
name: Kitchen
grid: { columns: 3 }
buttons:
  - id: lights
    icon: mdi:lightbulb
    position: { x: 0, y: 0 }
    tap_action:
      action: perform-action
      perform_action: light.toggle
      target: { entity_id: light.kitchen }
```

## Profiles

Put several stored remotes in one card and swap between them with the tabs or
by swiping sideways:

```yaml
type: custom:virtual-remote-card
profile_entity: input_select.living_room_remote   # optional
profiles:
  - remote_id: living_room_tv
  - remote_id: apple_tv
  - remote_id: soundbar
    name: Sound        # optional tab label
    icon: mdi:speaker  # optional tab icon
```

With `profile_entity`, the active profile is stored in that `input_select` (or
`select`). Its options are the remote names or IDs. Every phone and tablet
follows it, and automations can switch it. In the editor, **Remote → Create a
shared profile helper** sets this up in one tap. Without `profile_entity`,
each device keeps its own tab.

To press a button on whichever profile is active:

```yaml
action: virtual_remote.press
target:
  entity_id: "remote.{{ states('input_select.living_room_remote') | slugify }}"
data:
  command: vol_up
```

## Automations and voice

Each button's ID is a command:

```yaml
action: remote.send_command
target: { entity_id: remote.living_room_tv }
data:
  command: [vol_up, vol_up, vol_up]
  delay_secs: 0.2
```

`hold_secs` greater than 0 runs the button's hold action instead of its tap
action. `virtual_remote.press` does the same with a simpler `command` and
`hold` field. `remote.turn_on` and `remote.turn_off` press a button called
`power_on`/`power_off` or, failing that, `power`. The entity's `commands`
attribute lists every button ID.

Navigate, URL and more-info actions only work when the button is pressed from
the card.

## Troubleshooting

- **The card looks out of date after an update.** The card checks its version
  against the integration's. If they differ, a yellow bar offers **Reload**,
  which clears the app's cache. The companion app caches aggressively, so use
  this rather than pull-to-refresh.
- **"No remote entity found".** The remote's entity is disabled. Enable it
  under Settings → Entities.

## Development

```sh
# Backend (needs Python 3.13+)
python3.13 -m venv .venv && .venv/bin/pip install -r requirements_test.txt
.venv/bin/pytest -q -p no:logging

# Frontend
cd frontend && npm ci
npm test            # Vitest: grid geometry, profiles, presets
npm run build       # type-check + bundle to custom_components/virtual_remote/frontend/
npm run watch       # rebuild on save
```

Commit the built `virtual-remote-card.js`. CI fails if it doesn't match the
source. When releasing, bump the version in `manifest.json`,
`frontend/package.json` and `const.py` (`CARD_VERSION`), then rebuild. A test
checks that all three agree.
