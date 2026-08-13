import type { GamePreferences, GameState, PersistedSession } from "./types";

export const SESSION_KEY = "scoundrel.session.v1";
export const BEST_SCORE_KEY = "scoundrel.best-score.v1";
export const PREFERENCES_KEY = "scoundrel.preferences.v1";
export const DEFAULT_PREFERENCES: GamePreferences = {
  version: 1,
  skipFinalPartialRoom: true
};

function isState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.dungeon) &&
    Array.isArray(candidate.room) &&
    Array.isArray(candidate.discard) &&
    typeof candidate.health === "number" &&
    ["playing", "won", "lost"].includes(candidate.status ?? "")
  );
}

export function loadSession(storage: Pick<Storage, "getItem">): PersistedSession | null {
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (parsed.version !== 1 || !isState(parsed.present) || !Array.isArray(parsed.past)) return null;
    const past = parsed.past.filter(isState).slice(-100);
    return { version: 1, present: parsed.present, past };
  } catch {
    return null;
  }
}

export function saveSession(storage: Pick<Storage, "setItem">, session: PersistedSession): void {
  storage.setItem(SESSION_KEY, JSON.stringify({ ...session, past: session.past.slice(-100) }));
}

export function loadBestScore(storage: Pick<Storage, "getItem">): number | null {
  const raw = storage.getItem(BEST_SCORE_KEY);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function saveBestScore(storage: Pick<Storage, "setItem">, score: number): void {
  storage.setItem(BEST_SCORE_KEY, String(score));
}

export function loadPreferences(storage: Pick<Storage, "getItem">): GamePreferences {
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<GamePreferences>;
    if (parsed.version !== 1 || typeof parsed.skipFinalPartialRoom !== "boolean") return DEFAULT_PREFERENCES;
    return { version: 1, skipFinalPartialRoom: parsed.skipFinalPartialRoom };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(storage: Pick<Storage, "setItem">, preferences: GamePreferences): void {
  storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}
