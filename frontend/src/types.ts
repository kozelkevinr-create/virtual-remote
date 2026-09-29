// Config models. Keep in step with REMOTE_SCHEMA in store.py.

export type ActionType = "none" | "perform-action" | "navigate" | "more-info" | "url";

export interface ActionConfig {
  action: ActionType | string;
  perform_action?: string;
  target?: Record<string, unknown>;
  data?: Record<string, unknown>;
  navigation_path?: string;
  url_path?: string;
  entity?: string;
}

export type Shape = "circle" | "rect" | "pill";
export type Haptic = "none" | "light" | "medium" | "heavy" | "selection";

export interface Position {
  x: number;
  y: number;
  /** Defaults to 1, as in the backend schema. */
  w?: number;
  h?: number;
}

export interface RepeatConfig {
  enabled: boolean;
  delay_ms: number;
  interval_ms: number;
}

export interface ButtonConfig {
  id: string;
  label?: string;
  icon?: string;
  shape?: Shape;
  color?: { bg?: string; fg?: string };
  position: Position;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  repeat?: RepeatConfig;
  haptic?: Haptic;
}

export interface GridConfig {
  columns: number;
  gap: number;
}

export interface RemoteDefinition {
  id?: string;
  name: string;
  icon?: string;
  grid: GridConfig;
  buttons: ButtonConfig[];
}

export interface ProfileConfig {
  remote_id: string;
  name?: string;
  icon?: string;
}

export interface CardConfig {
  type: string;
  /** Stored remote. Without it, `buttons`/`grid`/`name` define an inline remote. */
  remote_id?: string;
  name?: string;
  icon?: string;
  grid?: Partial<GridConfig>;
  buttons?: ButtonConfig[];
  /** Several stored remotes behind a tab strip. Overrides `remote_id`. */
  profiles?: ProfileConfig[];
  /** input_select/select holding the active profile, shared by all devices. */
  profile_entity?: string;
  show_header?: boolean;
  fullscreen?: boolean;
}

export const DEFAULT_GRID: GridConfig = { columns: 4, gap: 8 };
export const NONE_ACTION: ActionConfig = { action: "none" };
export const DEFAULT_REPEAT: RepeatConfig = { enabled: false, delay_ms: 400, interval_ms: 150 };

/** Fill in the defaults the backend schema applies, for inline remotes. */
export function normalizeButton(button: ButtonConfig): ButtonConfig {
  return {
    label: "",
    shape: "rect",
    haptic: "light",
    ...button,
    position: { w: 1, h: 1, ...button.position },
    tap_action: upgradeAction(button.tap_action ?? NONE_ACTION),
    hold_action: upgradeAction(button.hold_action ?? NONE_ACTION),
    repeat: { ...DEFAULT_REPEAT, ...button.repeat },
  };
}

/** Same `call-service` → `perform-action` upgrade the backend does. */
export function upgradeAction(action: ActionConfig & { service?: string; service_data?: Record<string, unknown> }): ActionConfig {
  if (action.action !== "call-service") return action;
  const { service, service_data, ...rest } = action;
  return {
    ...rest,
    action: "perform-action",
    perform_action: rest.perform_action ?? service,
    data: rest.data ?? service_data,
  };
}

export function inlineRemote(config: CardConfig): RemoteDefinition {
  return {
    name: config.name ?? "",
    icon: config.icon,
    grid: { ...DEFAULT_GRID, ...config.grid },
    buttons: (config.buttons ?? []).map(normalizeButton),
  };
}

/** The stored remote ids a card config refers to, in tab order. */
export function remoteIds(config: CardConfig): string[] {
  if (config.profiles?.length) return config.profiles.map((p) => p.remote_id);
  return config.remote_id ? [config.remote_id] : [];
}
