export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank = "A" | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | "J" | "Q" | "K";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface WeaponState {
  card: Card;
  slain: Card[];
  limit: number | null;
}

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  version: 1;
  status: GameStatus;
  dungeon: Card[];
  room: Card[];
  discard: Card[];
  health: number;
  weapon: WeaponState | null;
  roomNumber: number;
  resolvedThisRoom: number;
  potionUsed: boolean;
  lastRoomAvoided: boolean;
  score: number | null;
  message: string;
}

export type GameAction =
  | { type: "resolve-potion"; cardId: string }
  | { type: "equip-weapon"; cardId: string }
  | { type: "fight-barehanded"; cardId: string }
  | { type: "fight-with-weapon"; cardId: string }
  | { type: "avoid-room" };

export interface PersistedSession {
  version: 1;
  present: GameState;
  past: GameState[];
}

export interface GamePreferences {
  version: 1;
  skipFinalPartialRoom: boolean;
}

export interface GameResult {
  status: Exclude<GameStatus, "playing">;
  score: number;
}
