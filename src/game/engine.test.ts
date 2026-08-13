import { describe, expect, it } from "vitest";
import { createDungeon } from "./deck";
import { applyAction, canAvoidRoom, canUseWeapon, createGame, MAX_HEALTH } from "./engine";
import type { Card, GameState } from "./types";

function get(id: string): Card {
  const card = createDungeon().find((candidate) => candidate.id === id);
  if (!card) throw new Error(`Missing test card: ${id}`);
  return card;
}

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    version: 1,
    status: "playing",
    dungeon: [],
    room: [],
    discard: [],
    health: MAX_HEALTH,
    weapon: null,
    roomNumber: 1,
    resolvedThisRoom: 0,
    potionUsed: false,
    lastRoomAvoided: false,
    score: null,
    message: "",
    ...overrides
  };
}

describe("the Scoundrel deck", () => {
  it("contains the canonical 44 cards", () => {
    const deck = createDungeon();
    expect(deck).toHaveLength(44);
    expect(deck.filter((card) => card.suit === "clubs" || card.suit === "spades")).toHaveLength(26);
    expect(deck.filter((card) => card.suit === "diamonds")).toHaveLength(9);
    expect(deck.filter((card) => card.suit === "hearts")).toHaveLength(9);
    expect(deck.some((card) => card.id === "hearts-A")).toBe(false);
    expect(get("spades-A").value).toBe(14);
    expect(get("clubs-K").value).toBe(13);
  });

  it("supports deterministic shuffle injection", () => {
    expect(createGame(() => 0).room.map((card) => card.id)).toEqual(createGame(() => 0).room.map((card) => card.id));
    expect(createGame(() => 0.999).room.map((card) => card.id)).not.toEqual(createGame(() => 0).room.map((card) => card.id));
  });
});

describe("rooms", () => {
  it("resolves three cards, carries one, and deals three", () => {
    const initial = state({
      room: [get("hearts-2"), get("hearts-3"), get("hearts-4"), get("clubs-2")],
      dungeon: [get("diamonds-2"), get("spades-2"), get("diamonds-3")]
    });
    const one = applyAction(initial, { type: "resolve-potion", cardId: "hearts-2" });
    const two = applyAction(one, { type: "resolve-potion", cardId: "hearts-3" });
    const three = applyAction(two, { type: "resolve-potion", cardId: "hearts-4" });
    expect(three.room.map((card) => card.id)).toEqual(["clubs-2", "diamonds-2", "spades-2", "diamonds-3"]);
    expect(three.roomNumber).toBe(2);
    expect(three.potionUsed).toBe(false);
  });

  it("allows a room to be avoided, then blocks a consecutive avoidance", () => {
    const initial = state({
      room: [get("clubs-2"), get("clubs-3"), get("clubs-4"), get("clubs-5")],
      dungeon: [get("spades-2"), get("spades-3"), get("spades-4"), get("spades-5")]
    });
    expect(canAvoidRoom(initial)).toBe(true);
    const avoided = applyAction(initial, { type: "avoid-room" });
    expect(avoided.room.map((card) => card.id)).toEqual(["spades-2", "spades-3", "spades-4", "spades-5"]);
    expect(canAvoidRoom(avoided)).toBe(false);
    expect(applyAction(avoided, { type: "avoid-room" })).toBe(avoided);
  });

  it("requires every card in the final partial room", () => {
    const first = applyAction(state({ room: [get("hearts-2"), get("clubs-2")] }), { type: "resolve-potion", cardId: "hearts-2" });
    expect(first.status).toBe("playing");
    expect(canAvoidRoom(first)).toBe(false);
    const finished = applyAction(first, { type: "fight-barehanded", cardId: "clubs-2" });
    expect(finished.status).toBe("won");
    expect(finished.score).toBe(18);
  });
});

describe("card resolution", () => {
  it("uses only the first potion in a room and caps health at 20", () => {
    const initial = state({ health: 18, room: [get("hearts-5"), get("hearts-9"), get("clubs-2"), get("clubs-3")] });
    const healed = applyAction(initial, { type: "resolve-potion", cardId: "hearts-5" });
    expect(healed.health).toBe(20);
    expect(healed.potionUsed).toBe(true);
    const discarded = applyAction(healed, { type: "resolve-potion", cardId: "hearts-9" });
    expect(discarded.health).toBe(20);
    expect(discarded.discard.map((card) => card.id)).toEqual(["hearts-5", "hearts-9"]);
  });

  it("replaces a binding weapon and discards its slain stack", () => {
    const oldWeapon = { card: get("diamonds-5"), slain: [get("clubs-6")], limit: 6 };
    const equipped = applyAction(state({ room: [get("diamonds-9")], weapon: oldWeapon }), { type: "equip-weapon", cardId: "diamonds-9" });
    expect(equipped.weapon?.card.id).toBe("diamonds-9");
    expect(equipped.weapon?.limit).toBeNull();
    expect(equipped.discard.map((card) => card.id)).toEqual(["diamonds-5", "clubs-6"]);
  });

  it("reduces damage and tightens the weapon limit after each kill", () => {
    const initial = state({
      health: 20,
      room: [get("clubs-Q"), get("spades-6"), get("clubs-10")],
      weapon: { card: get("diamonds-5"), slain: [], limit: null }
    });
    const queen = applyAction(initial, { type: "fight-with-weapon", cardId: "clubs-Q" });
    expect(queen.health).toBe(13);
    expect(queen.weapon?.limit).toBe(12);
    const six = applyAction(queen, { type: "fight-with-weapon", cardId: "spades-6" });
    expect(six.health).toBe(12);
    expect(six.weapon?.limit).toBe(6);
    expect(canUseWeapon(six, get("clubs-10"))).toBe(false);
    expect(applyAction(six, { type: "fight-with-weapon", cardId: "clubs-10" })).toBe(six);
  });

  it("rejects actions for the wrong card type", () => {
    const initial = state({ room: [get("clubs-2")] });
    expect(applyAction(initial, { type: "resolve-potion", cardId: "clubs-2" })).toBe(initial);
    expect(applyAction(initial, { type: "equip-weapon", cardId: "missing" })).toBe(initial);
  });
});

describe("scoring", () => {
  it("scores remaining health on victory", () => {
    const won = applyAction(state({ room: [get("diamonds-2")], health: 11 }), { type: "equip-weapon", cardId: "diamonds-2" });
    expect(won.status).toBe("won");
    expect(won.score).toBe(11);
  });

  it("adds the final potion bonus when health finishes at 20", () => {
    const won = applyAction(state({ room: [get("hearts-7")], health: 16 }), { type: "resolve-potion", cardId: "hearts-7" });
    expect(won.status).toBe("won");
    expect(won.score).toBe(27);
  });

  it("scores unresolved room and dungeon monsters negatively on death", () => {
    const lost = applyAction(state({
      health: 3,
      room: [get("clubs-5"), get("spades-K"), get("hearts-2")],
      dungeon: [get("clubs-A"), get("diamonds-8")]
    }), { type: "fight-barehanded", cardId: "clubs-5" });
    expect(lost.status).toBe("lost");
    expect(lost.health).toBe(0);
    expect(lost.score).toBe(-27);
  });
});
