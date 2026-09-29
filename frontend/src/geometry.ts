// Pure grid maths for the card and the drag-and-drop editor. Positions are in
// grid cells: x/y from the top-left, w/h at least 1.

import type { ButtonConfig, Position } from "./types";

/** A position with its size filled in. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rowCount(buttons: ButtonConfig[]): number {
  return buttons.reduce((rows, b) => Math.max(rows, b.position.y + (b.position.h ?? 1)), 0);
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function fits(pos: Rect, columns: number): boolean {
  return pos.x >= 0 && pos.y >= 0 && pos.w >= 1 && pos.h >= 1 && pos.x + pos.w <= columns;
}

export function full(pos: Position): Rect {
  return { x: pos.x, y: pos.y, w: pos.w ?? 1, h: pos.h ?? 1 };
}

export interface GridMetrics {
  /** Grid element's bounding box in client coordinates. */
  left: number;
  top: number;
  width: number;
  columns: number;
  gap: number;
}

export function cellSize(m: Pick<GridMetrics, "width" | "columns" | "gap">): number {
  return (m.width - m.gap * (m.columns - 1)) / m.columns;
}

/**
 * Cell under a client point, clamped to the columns. Rows are unbounded below
 * so a button can be dropped into a new row. Returns null outside the grid's
 * horizontal bounds or above it (with a half-cell margin), which the editor
 * treats as "drop to delete".
 */
export function cellAt(m: GridMetrics, clientX: number, clientY: number, rows: number): { x: number; y: number } | null {
  const size = cellSize(m);
  const pitch = size + m.gap;
  const relX = clientX - m.left;
  const relY = clientY - m.top;
  const margin = size / 2;
  const height = rows * pitch - m.gap;
  if (relX < -margin || relX > m.width + margin || relY < -margin || relY > height + pitch + margin) {
    return null;
  }
  const x = Math.min(m.columns - 1, Math.max(0, Math.floor(relX / pitch)));
  const y = Math.max(0, Math.floor(relY / pitch));
  return { x, y };
}

export type MoveResult =
  | { ok: true; buttons: ButtonConfig[]; swappedWith?: string }
  | { ok: false };

function withPosition(buttons: ButtonConfig[], id: string, position: Rect): ButtonConfig[] {
  return buttons.map((b) => (b.id === id ? { ...b, position } : b));
}

function collisions(buttons: ButtonConfig[], ignore: string[], pos: Rect): ButtonConfig[] {
  return buttons.filter((b) => !ignore.includes(b.id) && overlaps(full(b.position), pos));
}

/**
 * Move a button so its top-left lands on `to`. An empty target just moves it.
 * If it lands squarely on one other button of the same size, the two swap.
 * Anything else (partial overlaps, several buttons, off the grid) is refused.
 */
export function moveButton(
  buttons: ButtonConfig[],
  id: string,
  to: { x: number; y: number },
  columns: number,
): MoveResult {
  const dragged = buttons.find((b) => b.id === id);
  if (!dragged) return { ok: false };
  const from = full(dragged.position);
  const target: Rect = { ...from, x: to.x, y: to.y };
  if (target.x === from.x && target.y === from.y) return { ok: true, buttons };
  if (!fits(target, columns)) return { ok: false };

  const hits = collisions(buttons, [id], target);
  if (hits.length === 0) return { ok: true, buttons: withPosition(buttons, id, target) };

  if (hits.length === 1) {
    const other = hits[0];
    const otherPos = full(other.position);
    if (otherPos.x === target.x && otherPos.y === target.y && otherPos.w === from.w && otherPos.h === from.h) {
      const swapped = withPosition(withPosition(buttons, id, target), other.id, { ...otherPos, x: from.x, y: from.y });
      return { ok: true, buttons: swapped, swappedWith: other.id };
    }
  }
  return { ok: false };
}

/** Change a button's size in cells; refused if it would leave the grid or overlap. */
export function resizeButton(
  buttons: ButtonConfig[],
  id: string,
  size: { w: number; h: number },
  columns: number,
): MoveResult {
  const button = buttons.find((b) => b.id === id);
  if (!button) return { ok: false };
  const target: Rect = { ...full(button.position), w: size.w, h: size.h };
  if (!fits(target, columns) || collisions(buttons, [id], target).length) return { ok: false };
  return { ok: true, buttons: withPosition(buttons, id, target) };
}

/** First free top-left (row by row) where a w×h block fits. */
export function findFreeSpot(buttons: ButtonConfig[], w: number, h: number, columns: number): { x: number; y: number } {
  const width = Math.min(w, columns);
  for (let y = 0; ; y++) {
    for (let x = 0; x + width <= columns; x++) {
      const pos = { x, y, w: width, h };
      if (collisions(buttons, [], pos).length === 0) return { x, y };
    }
  }
}

/** Buttons that no longer fit after the column count shrinks, moved to free spots. */
export function reflow(buttons: ButtonConfig[], columns: number): ButtonConfig[] {
  const kept: ButtonConfig[] = [];
  const misfits: ButtonConfig[] = [];
  for (const b of buttons) (fits(full(b.position), columns) ? kept : misfits).push(b);
  for (const b of misfits) {
    const w = Math.min(b.position.w ?? 1, columns);
    const h = b.position.h ?? 1;
    const spot = findFreeSpot(kept, w, h, columns);
    kept.push({ ...b, position: { ...spot, w, h } });
  }
  // Keep the original order so ids and tab order don't jump around.
  return buttons.map((b) => kept.find((k) => k.id === b.id)!);
}

/** A button id unique within the remote, based on `base`. */
export function uniqueId(buttons: ButtonConfig[], base: string): string {
  const ids = new Set(buttons.map((b) => b.id));
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "button";
  if (!ids.has(slug)) return slug;
  for (let n = 2; ; n++) if (!ids.has(`${slug}_${n}`)) return `${slug}_${n}`;
}
