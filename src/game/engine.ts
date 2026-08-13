import { createDungeon, shuffle } from "./deck";
import type { Card, GameAction, GameState } from "./types";

export const MAX_HEALTH = 20;

export function isMonster(card: Card): boolean {
  return card.suit === "clubs" || card.suit === "spades";
}

export function isWeapon(card: Card): boolean {
  return card.suit === "diamonds";
}

export function isPotion(card: Card): boolean {
  return card.suit === "hearts";
}

function cardLabel(card: Card): string {
  const symbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" };
  return `${card.rank}${symbols[card.suit]}`;
}

function dealFromDungeon(dungeon: Card[], count: number): { drawn: Card[]; dungeon: Card[] } {
  return { drawn: dungeon.slice(0, count), dungeon: dungeon.slice(count) };
}

export function createGame(random: () => number = Math.random): GameState {
  const shuffled = shuffle(createDungeon(), random);
  const { drawn, dungeon } = dealFromDungeon(shuffled, 4);
  return {
    version: 1,
    status: "playing",
    dungeon,
    room: drawn,
    discard: [],
    health: MAX_HEALTH,
    weapon: null,
    roomNumber: 1,
    resolvedThisRoom: 0,
    potionUsed: false,
    lastRoomAvoided: false,
    score: null,
    message: "The first room waits. Choose a card."
  };
}

export function canUseWeapon(state: GameState, card: Card): boolean {
  return Boolean(
    state.weapon &&
      isMonster(card) &&
      (state.weapon.limit === null || card.value <= state.weapon.limit)
  );
}

export function canAvoidRoom(state: GameState): boolean {
  return (
    state.status === "playing" &&
    state.room.length === 4 &&
    state.resolvedThisRoom === 0 &&
    !state.lastRoomAvoided
  );
}

function unresolvedMonsterTotal(state: GameState): number {
  return [...state.room, ...state.dungeon]
    .filter(isMonster)
    .reduce((total, card) => total + card.value, 0);
}

function removeRoomCard(room: Card[], cardId: string): Card[] {
  return room.filter((card) => card.id !== cardId);
}

function finishIfNeeded(state: GameState, lastCard: Card): GameState {
  if (state.health <= 0) {
    const lostState = { ...state, health: 0 };
    const score = -unresolvedMonsterTotal(lostState);
    return {
      ...lostState,
      status: "lost",
      score,
      message: `The dungeon claims you. Final score: ${score}.`
    };
  }

  const normalRoomComplete = state.room.length === 1 && state.resolvedThisRoom >= 3;
  const partialRoomComplete = state.dungeon.length === 0 && state.room.length === 0;

  if (partialRoomComplete) {
    const bonus = isPotion(lastCard) && state.health === MAX_HEALTH ? lastCard.value : 0;
    const score = state.health + bonus;
    return {
      ...state,
      status: "won",
      score,
      message: bonus
        ? `Dungeon cleared with ${state.health} health and a ${bonus}-point final potion bonus.`
        : `Dungeon cleared with ${state.health} health.`
    };
  }

  if (!normalRoomComplete) return state;

  const { drawn, dungeon } = dealFromDungeon(state.dungeon, 3);
  return {
    ...state,
    dungeon,
    room: [...state.room, ...drawn],
    roomNumber: state.roomNumber + 1,
    resolvedThisRoom: 0,
    potionUsed: false,
    lastRoomAvoided: false,
    message: drawn.length < 3 ? "The final chamber is open. Resolve every card." : "A new room opens."
  };
}

function resolveCard(state: GameState, cardId: string, update: (card: Card) => Partial<GameState>): GameState {
  if (state.status !== "playing") return state;
  const card = state.room.find((candidate) => candidate.id === cardId);
  if (!card) return state;

  const next: GameState = {
    ...state,
    ...update(card),
    room: removeRoomCard(state.room, cardId),
    resolvedThisRoom: state.resolvedThisRoom + 1
  };
  return finishIfNeeded(next, card);
}

export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.status !== "playing") return state;

  switch (action.type) {
    case "avoid-room": {
      if (!canAvoidRoom(state)) return state;
      const rotatedDungeon = [...state.dungeon, ...state.room];
      const { drawn, dungeon } = dealFromDungeon(rotatedDungeon, 4);
      return {
        ...state,
        dungeon,
        room: drawn,
        roomNumber: state.roomNumber + 1,
        resolvedThisRoom: 0,
        potionUsed: false,
        lastRoomAvoided: true,
        message: "Room avoided. The next room must be faced."
      };
    }

    case "resolve-potion":
      {
        const potion = state.room.find((card) => card.id === action.cardId);
        if (!potion || !isPotion(potion)) return state;
      }
      return resolveCard(state, action.cardId, (card) => {
        if (state.potionUsed) {
          return {
            discard: [...state.discard, card],
            message: `${cardLabel(card)} is discarded; only one potion works per room.`
          };
        }
        const healed = Math.min(card.value, MAX_HEALTH - state.health);
        return {
          health: state.health + healed,
          potionUsed: true,
          discard: [...state.discard, card],
          message: healed > 0 ? `${cardLabel(card)} restores ${healed} health.` : `${cardLabel(card)} is used at full health.`
        };
      });

    case "equip-weapon":
      {
        const weapon = state.room.find((card) => card.id === action.cardId);
        if (!weapon || !isWeapon(weapon)) return state;
      }
      return resolveCard(state, action.cardId, (card) => {
        const oldWeaponCards = state.weapon ? [state.weapon.card, ...state.weapon.slain] : [];
        return {
          weapon: { card, slain: [], limit: null },
          discard: [...state.discard, ...oldWeaponCards],
          message: `${cardLabel(card)} is equipped${state.weapon ? ", replacing the old weapon" : ""}.`
        };
      });

    case "fight-barehanded":
      {
        const monster = state.room.find((card) => card.id === action.cardId);
        if (!monster || !isMonster(monster)) return state;
      }
      return resolveCard(state, action.cardId, (card) => {
        return {
          health: state.health - card.value,
          discard: [...state.discard, card],
          message: `${cardLabel(card)} deals ${card.value} damage barehanded.`
        };
      });

    case "fight-with-weapon":
      {
        const monster = state.room.find((card) => card.id === action.cardId);
        if (!monster || !canUseWeapon(state, monster)) return state;
      }
      return resolveCard(state, action.cardId, (card) => {
        if (!state.weapon) return {};
        const damage = Math.max(0, card.value - state.weapon.card.value);
        return {
          health: state.health - damage,
          weapon: {
            ...state.weapon,
            slain: [...state.weapon.slain, card],
            limit: card.value
          },
          message: `${cardLabel(state.weapon.card)} defeats ${cardLabel(card)}${damage ? `; you take ${damage} damage` : " without injury"}.`
        };
      });
  }
}
