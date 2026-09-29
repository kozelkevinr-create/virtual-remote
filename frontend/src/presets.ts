// Ready-made button clusters for the editor's Add tray. With a media player
// chosen, the buttons that have an obvious media_player action get it.

import { findFreeSpot, full, overlaps, uniqueId } from "./geometry";
import { DEFAULT_REPEAT, type ActionConfig, type ButtonConfig, type Shape } from "./types";

interface PresetButton {
  id: string;
  icon?: string;
  label?: string;
  x: number;
  y: number;
  shape?: Shape;
  /** media_player service to call when a media player is chosen. */
  service?: string;
  data?: Record<string, unknown>;
  repeat?: boolean;
}

export interface Preset {
  key: string;
  name: string;
  icon: string;
  buttons: PresetButton[];
}

const digit = (n: number, x: number, y: number): PresetButton => ({ id: `digit_${n}`, label: String(n), x, y });

export const PRESETS: Preset[] = [
  {
    key: "power",
    name: "Power",
    icon: "mdi:power",
    buttons: [{ id: "power", icon: "mdi:power", x: 0, y: 0, shape: "circle", service: "toggle" }],
  },
  {
    key: "volume",
    name: "Volume",
    icon: "mdi:volume-high",
    buttons: [
      { id: "vol_up", icon: "mdi:volume-plus", x: 0, y: 0, service: "volume_up", repeat: true },
      { id: "mute", icon: "mdi:volume-mute", x: 0, y: 1, service: "volume_mute", data: { is_volume_muted: true } },
      { id: "vol_down", icon: "mdi:volume-minus", x: 0, y: 2, service: "volume_down", repeat: true },
    ],
  },
  {
    key: "channel",
    name: "Channel",
    icon: "mdi:television-classic",
    buttons: [
      { id: "ch_up", icon: "mdi:chevron-up", label: "CH", x: 0, y: 0, repeat: true },
      { id: "ch_down", icon: "mdi:chevron-down", label: "CH", x: 0, y: 1, repeat: true },
    ],
  },
  {
    key: "dpad",
    name: "D-pad",
    icon: "mdi:gamepad",
    buttons: [
      { id: "up", icon: "mdi:chevron-up", x: 1, y: 0, shape: "circle", repeat: true },
      { id: "left", icon: "mdi:chevron-left", x: 0, y: 1, shape: "circle", repeat: true },
      { id: "ok", label: "OK", x: 1, y: 1, shape: "circle" },
      { id: "right", icon: "mdi:chevron-right", x: 2, y: 1, shape: "circle", repeat: true },
      { id: "down", icon: "mdi:chevron-down", x: 1, y: 2, shape: "circle", repeat: true },
    ],
  },
  {
    key: "navigation",
    name: "Back / Home / Menu",
    icon: "mdi:home",
    buttons: [
      { id: "back", icon: "mdi:arrow-left", x: 0, y: 0 },
      { id: "home", icon: "mdi:home", x: 1, y: 0 },
      { id: "menu", icon: "mdi:menu", x: 2, y: 0 },
    ],
  },
  {
    key: "transport",
    name: "Playback",
    icon: "mdi:play-pause",
    buttons: [
      { id: "previous", icon: "mdi:skip-previous", x: 0, y: 0, service: "media_previous_track" },
      { id: "play_pause", icon: "mdi:play-pause", x: 1, y: 0, service: "media_play_pause" },
      { id: "stop", icon: "mdi:stop", x: 2, y: 0, service: "media_stop" },
      { id: "next", icon: "mdi:skip-next", x: 3, y: 0, service: "media_next_track" },
    ],
  },
  {
    key: "numpad",
    name: "Number pad",
    icon: "mdi:dialpad",
    buttons: [
      digit(1, 0, 0), digit(2, 1, 0), digit(3, 2, 0),
      digit(4, 0, 1), digit(5, 1, 1), digit(6, 2, 1),
      digit(7, 0, 2), digit(8, 1, 2), digit(9, 2, 2),
      digit(0, 1, 3),
    ],
  },
  {
    key: "custom",
    name: "Custom button",
    icon: "mdi:gesture-tap-button",
    buttons: [{ id: "button", icon: "mdi:gesture-tap-button", x: 0, y: 0 }],
  },
];

/** Width and height of a preset cluster, in cells. */
export function presetSize(preset: Preset): { w: number; h: number } {
  return {
    w: Math.max(...preset.buttons.map((b) => b.x)) + 1,
    h: Math.max(...preset.buttons.map((b) => b.y)) + 1,
  };
}

function actionFor(b: PresetButton, mediaPlayer?: string): ActionConfig {
  if (!b.service || !mediaPlayer) return { action: "none" };
  return {
    action: "perform-action",
    perform_action: `media_player.${b.service}`,
    target: { entity_id: mediaPlayer },
    ...(b.data ? { data: b.data } : {}),
  };
}

/**
 * The preset's buttons with unique ids. Without `at` they go to the first
 * free spot (a cluster wider than the grid is placed button by button). With
 * `at` (a drag-and-drop target) the cluster's top-left goes there, or null if
 * it would leave the grid or overlap something.
 */
export function placePreset(
  existing: ButtonConfig[],
  preset: Preset,
  columns: number,
  mediaPlayer?: string,
  at?: { x: number; y: number },
): ButtonConfig[] | null {
  const width = Math.max(...preset.buttons.map((b) => b.x)) + 1;
  const height = Math.max(...preset.buttons.map((b) => b.y)) + 1;
  const asBlock = width <= columns;

  let origin;
  if (at) {
    if (at.x + width > columns) return null;
    for (const b of preset.buttons) {
      const pos = full({ x: at.x + b.x, y: at.y + b.y });
      if (existing.some((e) => overlaps(pos, full(e.position)))) return null;
    }
    origin = at;
  } else {
    origin = asBlock ? findFreeSpot(existing, width, height, columns) : { x: 0, y: 0 };
  }

  const added: ButtonConfig[] = [];
  for (const b of preset.buttons) {
    const all = [...existing, ...added];
    const position = at || asBlock
      ? { x: origin.x + b.x, y: origin.y + b.y, w: 1, h: 1 }
      : { ...findFreeSpot(all, 1, 1, columns), w: 1, h: 1 };
    added.push({
      id: uniqueId(all, b.id),
      label: b.label ?? "",
      ...(b.icon ? { icon: b.icon } : {}),
      shape: b.shape ?? "rect",
      position,
      tap_action: actionFor(b, mediaPlayer),
      hold_action: { action: "none" },
      repeat: { ...DEFAULT_REPEAT, enabled: !!b.repeat },
      haptic: "light",
    });
  }
  return added;
}
