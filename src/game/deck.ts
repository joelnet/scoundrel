import type { Card, Rank, Suit } from "./types";

const blackRanks: Rank[] = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
const redRanks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export function rankValue(rank: Rank): number {
  if (typeof rank === "number") return rank;
  return { J: 11, Q: 12, K: 13, A: 14 }[rank];
}

function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}`, suit, rank, value: rankValue(rank) };
}

export function createDungeon(): Card[] {
  return [
    ...blackRanks.map((rank) => card("clubs", rank)),
    ...blackRanks.map((rank) => card("spades", rank)),
    ...redRanks.map((rank) => card("diamonds", rank)),
    ...redRanks.map((rank) => card("hearts", rank))
  ];
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
