import { describe, expect, it } from "vitest";
import { createGame } from "./engine";
import { BEST_SCORE_KEY, loadBestScore, loadSession, saveBestScore, saveSession, SESSION_KEY } from "./persistence";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    value(key: string) { return values.get(key); }
  };
}

describe("session persistence", () => {
  it("round-trips an active game and undo history", () => {
    const storage = memoryStorage();
    const present = createGame(() => 0.25);
    const previous = createGame(() => 0.75);
    saveSession(storage, { version: 1, present, past: [previous] });
    expect(loadSession(storage)).toEqual({ version: 1, present, past: [previous] });
  });

  it("caps persisted undo snapshots", () => {
    const storage = memoryStorage();
    const present = createGame(() => 0.5);
    saveSession(storage, { version: 1, present, past: Array.from({ length: 120 }, () => present) });
    expect(JSON.parse(storage.value(SESSION_KEY)!).past).toHaveLength(100);
  });

  it("falls back safely for corrupt or incompatible data", () => {
    expect(loadSession(memoryStorage({ [SESSION_KEY]: "not-json" }))).toBeNull();
    expect(loadSession(memoryStorage({ [SESSION_KEY]: JSON.stringify({ version: 2 }) }))).toBeNull();
  });

  it("stores numeric best scores", () => {
    const storage = memoryStorage();
    expect(loadBestScore(storage)).toBeNull();
    saveBestScore(storage, -4);
    expect(storage.value(BEST_SCORE_KEY)).toBe("-4");
    expect(loadBestScore(storage)).toBe(-4);
  });
});
