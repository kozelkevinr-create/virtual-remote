import { describe, expect, it } from "vitest";
import { overlaps, full } from "../src/geometry";
import { PRESETS, placePreset } from "../src/presets";
import { inlineRemote, remoteIds, upgradeAction } from "../src/types";

const preset = (key: string) => PRESETS.find((p) => p.key === key)!;

describe("placePreset", () => {
  it("places a cluster below existing buttons without overlap", () => {
    const first = placePreset([], preset("dpad"), 4)!;
    const second = placePreset(first, preset("dpad"), 4)!;
    const all = [...first, ...second];
    expect(new Set(all.map((b) => b.id)).size).toBe(all.length);
    for (const a of all)
      for (const b of all) if (a !== b) expect(overlaps(full(a.position), full(b.position))).toBe(false);
    expect(second.map((b) => b.id)).toContain("up_2");
  });

  it("wires media player actions when one is chosen", () => {
    const [up] = placePreset([], preset("volume"), 4, "media_player.tv")!;
    expect(up.tap_action).toEqual({
      action: "perform-action",
      perform_action: "media_player.volume_up",
      target: { entity_id: "media_player.tv" },
    });
    expect(up.repeat?.enabled).toBe(true);
    const [ch] = placePreset([], preset("channel"), 4, "media_player.tv")!;
    expect(ch.tap_action).toEqual({ action: "none" });
  });

  it("places clusters wider than the grid button by button", () => {
    const placed = placePreset([], preset("transport"), 2)!;
    expect(placed.every((b) => (b.position.x ?? 0) + (b.position.w ?? 1) <= 2)).toBe(true);
  });

  it("gives every preset backend-valid ids", () => {
    for (const p of PRESETS) for (const b of placePreset([], p, 4)!) expect(b.id).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
  });
});

describe("types", () => {
  it("upgrades call-service like the backend", () => {
    expect(upgradeAction({ action: "call-service", service: "light.toggle", service_data: { a: 1 } } as any)).toEqual({
      action: "perform-action",
      perform_action: "light.toggle",
      data: { a: 1 },
    });
  });

  it("fills inline defaults", () => {
    const remote = inlineRemote({ type: "x", buttons: [{ id: "a", position: { x: 0, y: 0 } }] });
    expect(remote.grid).toEqual({ columns: 4, gap: 8 });
    expect(remote.buttons[0].position).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(remote.buttons[0].tap_action).toEqual({ action: "none" });
  });

  it("lists remote ids: profiles win over remote_id", () => {
    expect(remoteIds({ type: "x", remote_id: "a", profiles: [{ remote_id: "b" }, { remote_id: "c" }] })).toEqual(["b", "c"]);
    expect(remoteIds({ type: "x", remote_id: "a" })).toEqual(["a"]);
    expect(remoteIds({ type: "x" })).toEqual([]);
  });
});

describe("placePreset at a drop target", () => {
  it("places a d-pad with its top-left on the drop cell", () => {
    const result = placePreset([], preset("dpad"), 4, undefined, { x: 1, y: 2 })!;
    expect(result).toHaveLength(5);
    expect(result.find((b) => b.id === "up")!.position).toEqual({ x: 2, y: 2, w: 1, h: 1 });
  });

  it("refuses a cluster that would go past the last column", () => {
    expect(placePreset([], preset("dpad"), 4, undefined, { x: 2, y: 0 })).toBeNull();
  });

  it("refuses a drop onto an occupied cell", () => {
    const existing = [{ id: "a", position: { x: 0, y: 0, w: 1, h: 1 } }];
    expect(placePreset(existing, preset("power"), 4, undefined, { x: 0, y: 0 })).toBeNull();
  });

  it("drops onto any free cell", () => {
    const result = placePreset([], preset("power"), 4, undefined, { x: 3, y: 5 })!;
    expect(result).toHaveLength(1);
    expect(result[0].position).toEqual({ x: 3, y: 5, w: 1, h: 1 });
  });

  it("still finds a free spot without a drop target", () => {
    expect(placePreset([], preset("dpad"), 4)).toHaveLength(5);
  });
});
