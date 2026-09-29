import { describe, expect, it } from "vitest";
import { cellAt, findFreeSpot, moveButton, overlaps, reflow, resizeButton, rowCount, uniqueId } from "../src/geometry";
import type { ButtonConfig } from "../src/types";

const btn = (id: string, x: number, y: number, w = 1, h = 1): ButtonConfig => ({ id, position: { x, y, w, h } });
const pos = (buttons: ButtonConfig[], id: string) => buttons.find((b) => b.id === id)!.position;

describe("overlaps", () => {
  it("detects shared cells and ignores touching edges", () => {
    expect(overlaps({ x: 0, y: 0, w: 2, h: 1 }, { x: 1, y: 0, w: 1, h: 1 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 1, h: 1 }, { x: 1, y: 0, w: 1, h: 1 })).toBe(false);
  });
});

describe("rowCount", () => {
  it("counts tall buttons", () => {
    expect(rowCount([btn("a", 0, 0), btn("b", 1, 2, 1, 2)])).toBe(4);
    expect(rowCount([])).toBe(0);
  });
});

describe("cellAt", () => {
  // 4 columns, 100px cells, 10px gap: pitch 110, width 430.
  const m = { left: 100, top: 50, width: 430, columns: 4, gap: 10 };

  it("maps points to cells", () => {
    expect(cellAt(m, 105, 55, 2)).toEqual({ x: 0, y: 0 });
    expect(cellAt(m, 100 + 330, 50 + 115, 2)).toEqual({ x: 3, y: 1 });
  });

  it("clamps to the last column inside the margin", () => {
    expect(cellAt(m, 100 + 440, 55, 2)).toEqual({ x: 3, y: 0 });
  });

  it("allows one new row below", () => {
    expect(cellAt(m, 105, 50 + 2 * 110 + 5, 2)).toEqual({ x: 0, y: 2 });
  });

  it("returns null well outside the grid", () => {
    expect(cellAt(m, 0, 55, 2)).toBeNull();
    expect(cellAt(m, 105, -100, 2)).toBeNull();
    expect(cellAt(m, 105, 50 + 5 * 110, 2)).toBeNull();
  });
});

describe("moveButton", () => {
  const buttons = [btn("a", 0, 0), btn("b", 1, 0), btn("wide", 0, 1, 2, 1)];

  it("moves into an empty cell", () => {
    const r = moveButton(buttons, "a", { x: 3, y: 0 }, 4);
    expect(r.ok && pos(r.buttons, "a")).toEqual({ x: 3, y: 0, w: 1, h: 1 });
  });

  it("swaps with a same-sized button", () => {
    const r = moveButton(buttons, "a", { x: 1, y: 0 }, 4);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.swappedWith).toBe("b");
    expect(pos(r.buttons, "a")).toMatchObject({ x: 1, y: 0 });
    expect(pos(r.buttons, "b")).toMatchObject({ x: 0, y: 0 });
  });

  it("refuses partial overlaps and leaving the grid", () => {
    expect(moveButton(buttons, "a", { x: 1, y: 1 }, 4).ok).toBe(false);
    expect(moveButton(buttons, "wide", { x: 3, y: 1 }, 4).ok).toBe(false);
  });

  it("is a no-op when dropped where it started", () => {
    const r = moveButton(buttons, "a", { x: 0, y: 0 }, 4);
    expect(r.ok && r.buttons).toBe(buttons);
  });
});

describe("resizeButton", () => {
  const buttons = [btn("a", 0, 0), btn("b", 2, 0)];

  it("grows into free cells", () => {
    const r = resizeButton(buttons, "a", { w: 2, h: 2 }, 4);
    expect(r.ok && pos(r.buttons, "a")).toEqual({ x: 0, y: 0, w: 2, h: 2 });
  });

  it("refuses overlapping or overflowing sizes", () => {
    expect(resizeButton(buttons, "a", { w: 3, h: 1 }, 4).ok).toBe(false);
    expect(resizeButton(buttons, "b", { w: 3, h: 1 }, 4).ok).toBe(false);
  });
});

describe("findFreeSpot", () => {
  it("finds the first gap row by row", () => {
    expect(findFreeSpot([btn("a", 0, 0), btn("b", 1, 0)], 1, 1, 3)).toEqual({ x: 2, y: 0 });
    expect(findFreeSpot([btn("a", 1, 0)], 2, 1, 3)).toEqual({ x: 0, y: 1 });
  });
});

describe("reflow", () => {
  it("moves buttons that no longer fit and keeps order", () => {
    const out = reflow([btn("a", 0, 0), btn("b", 3, 0), btn("c", 1, 0)], 3);
    expect(out.map((b) => b.id)).toEqual(["a", "b", "c"]);
    expect(pos(out, "b")).toEqual({ x: 2, y: 0, w: 1, h: 1 });
  });

  it("narrows buttons wider than the grid", () => {
    expect(pos(reflow([btn("w", 0, 0, 4, 1)], 2), "w")).toEqual({ x: 0, y: 0, w: 2, h: 1 });
  });
});

describe("uniqueId", () => {
  it("slugifies and numbers duplicates", () => {
    expect(uniqueId([], "Vol Up!")).toBe("vol_up");
    expect(uniqueId([btn("up", 0, 0), btn("up_2", 0, 0)], "up")).toBe("up_3");
    expect(uniqueId([], "!!!")).toBe("button");
  });
});
