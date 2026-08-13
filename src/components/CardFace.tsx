import type { PointerEvent as ReactPointerEvent } from "react";
import type { Card } from "../game/types";

const symbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" } as const;

const pipLayouts: Record<number, Array<[number, number, boolean?]>> = {
  2: [[50, 25], [50, 75, true]],
  3: [[50, 20], [50, 50], [50, 80, true]],
  4: [[30, 25], [70, 25], [30, 75, true], [70, 75, true]],
  5: [[30, 22], [70, 22], [50, 50], [30, 78, true], [70, 78, true]],
  6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80, true], [70, 80, true]],
  7: [[30, 17], [70, 17], [50, 35], [30, 50], [70, 50], [30, 83, true], [70, 83, true]],
  8: [[30, 16], [70, 16], [50, 34], [30, 43], [70, 43], [50, 66, true], [30, 84, true], [70, 84, true]],
  9: [[30, 16], [70, 16], [30, 38], [70, 38], [50, 50], [30, 62, true], [70, 62, true], [30, 84, true], [70, 84, true]],
  10: [[30, 14], [70, 14], [50, 29], [30, 36], [70, 36], [30, 64, true], [70, 64, true], [50, 71, true], [30, 86, true], [70, 86, true]]
};

interface CardFaceProps {
  card: Card;
  selected?: boolean;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}

export function cardName(card: Card): string {
  const rankNames = { A: "Ace", J: "Jack", Q: "Queen", K: "King" } as const;
  const rank = typeof card.rank === "string" ? rankNames[card.rank] : card.rank;
  return `${rank} of ${card.suit}`;
}

export function CardFace({
  card,
  selected = false,
  compact = false,
  className = "",
  style,
  onClick,
  onDoubleClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}: CardFaceProps) {
  const symbol = symbols[card.suit];
  const isFace = typeof card.rank === "string";
  const interactive = Boolean(onClick || onPointerDown);
  const content = (
    <>
      <span className="corner corner-top" aria-hidden="true">
        <span>{card.rank}</span>
        <span>{symbol}</span>
      </span>
      <span className="card-center" aria-hidden="true">
        {isFace ? (
          <span className={`honor honor-${card.rank}`}>
            <span>{card.rank}</span>
            <span className="honor-suit">{symbol}</span>
          </span>
        ) : (
          (pipLayouts[card.value] ?? [[50, 50]]).map(([x, y, inverted], index) => (
            <span
              className={`pip ${inverted ? "inverted" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              key={`${x}-${y}-${index}`}
            >
              {symbol}
            </span>
          ))
        )}
      </span>
      <span className="corner corner-bottom" aria-hidden="true">
        <span>{card.rank}</span>
        <span>{symbol}</span>
      </span>
    </>
  );

  if (compact) {
    return (
      <div
        className={`playing-card compact ${selected ? "selected" : ""} ${className}`}
        data-suit={card.suit}
        style={style}
        aria-hidden="true"
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`playing-card ${selected ? "selected" : ""} ${className}`}
      data-suit={card.suit}
      style={style}
      aria-label={cardName(card)}
      aria-pressed={interactive ? selected : undefined}
      tabIndex={interactive ? 0 : -1}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {content}
    </button>
  );
}
