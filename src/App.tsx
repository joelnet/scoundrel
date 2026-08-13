import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  BookOpen,
  Download,
  Footprints,
  Heart,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Undo2,
  UserRound
} from "lucide-react";
import { CardFace, cardName } from "./components/CardFace";
import { RulesDialog } from "./components/RulesDialog";
import { applyAction, canAvoidRoom, canUseWeapon, createGame, isMonster, isPotion, isWeapon, MAX_HEALTH } from "./game/engine";
import { loadBestScore, loadSession, saveBestScore, saveSession } from "./game/persistence";
import type { Card, GameAction, GameState, PersistedSession } from "./game/types";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type DropTarget = "health" | "weapon" | "barehand";
const CARD_BACK_URL = `${import.meta.env.BASE_URL}card-back.svg`;

function cardScatter(card: Card, slot: number): React.CSSProperties {
  const seed = [...card.id].reduce((total, character) => total + character.charCodeAt(0), slot * 17);
  const angle = ((seed % 31) - 15) / 8;
  const x = ((seed * 7 + slot * 5) % 9) - 4;
  const y = ((seed * 11 + slot * 3) % 10) - 2;
  return {
    "--card-angle": `${angle}deg`,
    "--card-x": `${x}px`,
    "--card-y": `${y}px`
  } as React.CSSProperties;
}

interface DragState {
  card: Card;
  x: number;
  y: number;
  over: DropTarget | null;
}

interface PointerOrigin {
  id: number;
  card: Card;
  x: number;
  y: number;
  dragging: boolean;
}

interface DropPreview {
  primary: string;
  secondary: string;
  legal: boolean;
  showHeart?: boolean;
}

function isLegalDrop(card: Card, target: DropTarget, state: GameState): boolean {
  if (target === "health") return isPotion(card);
  if (target === "weapon") return isWeapon(card) || canUseWeapon(state, card);
  return isMonster(card);
}

function describeDrop(card: Card, target: DropTarget, state: GameState): DropPreview {
  if (!isLegalDrop(card, target, state)) {
    if (target === "health") return { primary: "Not a potion", secondary: "Only Hearts restore health", legal: false };
    if (target === "barehand") return { primary: "Not a monster", secondary: "Only black cards can be fought", legal: false };
    if (isMonster(card) && !state.weapon) return { primary: "No weapon", secondary: "Equip a Diamond first", legal: false };
    if (isMonster(card) && state.weapon?.limit) {
      return { primary: "Weapon is worn", secondary: `Needs a monster valued ${state.weapon.limit} or lower`, legal: false };
    }
    return { primary: "Invalid move", secondary: "Drop a weapon or legal monster here", legal: false };
  }

  if (target === "health") {
    const restored = state.potionUsed ? 0 : Math.min(card.value, MAX_HEALTH - state.health);
    return {
      primary: restored > 0 ? `+${restored}` : "No healing",
      secondary: state.potionUsed ? "Potion already used this room" : `${state.health} → ${state.health + restored}`,
      legal: true,
      showHeart: restored > 0
    };
  }

  if (target === "barehand") {
    return { primary: `−${card.value}`, secondary: `${state.health} → ${Math.max(0, state.health - card.value)}`, legal: true, showHeart: true };
  }

  if (isWeapon(card)) {
    return {
      primary: `Equip ${card.rank}♦`,
      secondary: state.weapon ? `Replace ${state.weapon.card.rank}♦ and its stack` : "Ready for any monster",
      legal: true
    };
  }

  const damage = Math.max(0, card.value - state.weapon!.card.value);
  return {
    primary: damage ? `−${damage}` : "No damage",
    secondary: `Weapon limit becomes ${card.value}`,
    legal: true,
    showHeart: damage > 0
  };
}

function initialSession(): PersistedSession {
  if (typeof window !== "undefined") {
    const restored = loadSession(window.localStorage);
    if (restored) return restored;
  }
  return { version: 1, present: createGame(), past: [] };
}

export default function App() {
  const [session, setSession] = useState<PersistedSession>(initialSession);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => loadBestScore(window.localStorage));
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState(session.present.message);
  const pointerOrigin = useRef<PointerOrigin | null>(null);
  const suppressClick = useRef(false);
  const state = session.present;
  const selectedCard = state.room.find((card) => card.id === selectedId) ?? null;
  const isFinalPartialRoom = state.room.length + state.resolvedThisRoom < 4;
  const modalOpen = rulesOpen || state.status !== "playing";

  useEffect(() => {
    saveSession(window.localStorage, session);
  }, [session]);

  useEffect(() => {
    setAnnouncement(state.message);
    if (state.status !== "playing" && state.score !== null) {
      const best = loadBestScore(window.localStorage);
      if (best === null || state.score > best) {
        saveBestScore(window.localStorage, state.score);
        setBestScore(state.score);
      }
    }
  }, [state.message, state.score, state.status]);

  useEffect(() => {
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const commit = useCallback((action: GameAction) => {
    setSession((current) => {
      const next = applyAction(current.present, action);
      if (next === current.present) return current;
      return { version: 1, present: next, past: [...current.past, current.present].slice(-100) };
    });
    setSelectedId(null);
  }, []);

  const undo = useCallback(() => {
    setSession((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return { version: 1, present: previous, past: current.past.slice(0, -1) };
    });
    setSelectedId(null);
  }, []);

  const startNewGame = useCallback(() => {
    if (state.status === "playing" && !window.confirm("Leave this dungeon and start a new game?")) return;
    setSession({ version: 1, present: createGame(), past: [] });
    setSelectedId(null);
  }, [state.status]);

  const resolveDrop = useCallback((card: Card, target: DropTarget) => {
    if (target === "health" && isPotion(card)) {
      commit({ type: "resolve-potion", cardId: card.id });
      return true;
    }
    if (target === "weapon" && isWeapon(card)) {
      commit({ type: "equip-weapon", cardId: card.id });
      return true;
    }
    if (target === "weapon" && isMonster(card) && canUseWeapon(state, card)) {
      commit({ type: "fight-with-weapon", cardId: card.id });
      return true;
    }
    if (target === "barehand" && isMonster(card)) {
      commit({ type: "fight-barehanded", cardId: card.id });
      return true;
    }
    setAnnouncement(`${cardName(card)} cannot be used there.`);
    return false;
  }, [commit, state]);

  const handleCardClick = (card: Card) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setSelectedId((current) => current === card.id ? null : card.id);
  };

  const handleDoubleClick = (card: Card) => {
    if (isPotion(card)) commit({ type: "resolve-potion", cardId: card.id });
    else if (isWeapon(card)) commit({ type: "equip-weapon", cardId: card.id });
    else if (isMonster(card) && !state.weapon) commit({ type: "fight-barehanded", cardId: card.id });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, card: Card) => {
    if (event.button !== 0) return;
    pointerOrigin.current = { id: event.pointerId, card, x: event.clientX, y: event.clientY, dragging: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = pointerOrigin.current;
    if (!origin || origin.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    if (distance > 8) {
      origin.dragging = true;
      event.preventDefault();
      const dropElement = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop]");
      setDrag({
        card: origin.card,
        x: event.clientX,
        y: event.clientY,
        over: dropElement ? dropElement.dataset.drop as DropTarget : null
      });
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
    const origin = pointerOrigin.current;
    if (!origin || origin.id !== event.pointerId) return;
    if (origin.dragging) {
      suppressClick.current = true;
      const dropElement = cancelled ? null : document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop]");
      if (dropElement) resolveDrop(origin.card, dropElement.dataset.drop as DropTarget);
      else if (!cancelled) setAnnouncement(`${cardName(origin.card)} returns to the room.`);
    }
    pointerOrigin.current = null;
    setDrag(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (event.key === "Escape") {
        if (rulesOpen) setRulesOpen(false);
        else setSelectedId(null);
      }
      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !rulesOpen) {
        const cards = [...document.querySelectorAll<HTMLButtonElement>(".room-card")];
        if (!cards.length) return;
        const current = cards.indexOf(document.activeElement as HTMLButtonElement);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        cards[(current + direction + cards.length) % cards.length].focus();
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rulesOpen, undo]);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const remaining = state.dungeon.length + state.room.length;
  const legalActions = useMemo(() => {
    if (!selectedCard) return [];
    if (isPotion(selectedCard)) return [{ label: state.potionUsed ? "Discard potion" : "Drink potion", icon: Heart, action: { type: "resolve-potion", cardId: selectedCard.id } as GameAction }];
    if (isWeapon(selectedCard)) return [{ label: "Equip weapon", icon: Shield, action: { type: "equip-weapon", cardId: selectedCard.id } as GameAction }];
    const actions = [{ label: `Barehanded · ${selectedCard.value} damage`, icon: UserRound, action: { type: "fight-barehanded", cardId: selectedCard.id } as GameAction }];
    if (canUseWeapon(state, selectedCard) && state.weapon) {
      actions.unshift({
        label: `Use weapon · ${Math.max(0, selectedCard.value - state.weapon.card.value)} damage`,
        icon: Swords,
        action: { type: "fight-with-weapon", cardId: selectedCard.id } as GameAction
      });
    }
    return actions;
  }, [selectedCard, state]);
  const dropZoneState = (target: DropTarget) => {
    if (!drag) return "";
    const legal = isLegalDrop(drag.card, target, state);
    if (drag.over !== target) return legal ? "legal" : "";
    return legal ? "legal hovered" : "invalid-hovered";
  };
  const healthPreview = drag?.over === "health" ? describeDrop(drag.card, "health", state) : null;
  const weaponPreview = drag?.over === "weapon" ? describeDrop(drag.card, "weapon", state) : null;
  const barehandPreview = drag?.over === "barehand" ? describeDrop(drag.card, "barehand", state) : null;

  return (
    <>
      <main className="game-app">
        <header className="topbar" inert={modalOpen ? true : undefined} aria-hidden={modalOpen || undefined}>
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">♠</span>
            <span className="brand-copy"><strong>Scoundrel</strong></span>
          </div>

          <div className="top-stats" aria-label="Game status">
            <span><Heart aria-hidden="true" /> <strong>{state.health}</strong><small>Health</small></span>
            <span><span className="mini-card" aria-hidden="true" /> <strong>{remaining}</strong><small>Cards</small></span>
            <span><Sparkles aria-hidden="true" /> <strong>{state.score ?? "–"}</strong><small>Score</small></span>
            <span className="best-stat"><strong>{bestScore ?? "–"}</strong><small>Best</small></span>
          </div>

          <nav className="toolbar" aria-label="Game controls">
            <button className="icon-button" type="button" onClick={startNewGame} aria-label="New game" title="New game"><RotateCcw aria-hidden="true" /></button>
            <button className="icon-button" type="button" onClick={undo} disabled={!session.past.length} aria-label="Undo" title="Undo (Ctrl or Command plus Z)"><Undo2 aria-hidden="true" /></button>
            <button className="icon-button" type="button" onClick={() => setRulesOpen(true)} aria-label="Rules and credits" title="Rules and credits"><BookOpen aria-hidden="true" /></button>
            {installPrompt && <button className="icon-button" type="button" onClick={install} aria-label="Install app" title="Install app"><Download aria-hidden="true" /></button>}
          </nav>
        </header>

        <section className="table" aria-label="Scoundrel card table" inert={modalOpen ? true : undefined} aria-hidden={modalOpen || undefined}>
          <div className="upper-table">
            <div className="dungeon-area">
              <div className="deck-stack" aria-label={`${state.dungeon.length} cards in the dungeon`}>
                {state.dungeon.length > 2 && <span className="deck-shadow deck-shadow-2" />}
                {state.dungeon.length > 1 && <span className="deck-shadow deck-shadow-1" />}
                {state.dungeon.length > 0 ? <img src={CARD_BACK_URL} alt="Dungeon deck" /> : <span className="empty-slot">Dungeon</span>}
              </div>
              <span className="area-label">Dungeon · {state.dungeon.length}</span>
            </div>

            <div className="room-area">
              <div className="room-heading">
                <span>Room {state.roomNumber}</span>
                <small>{isFinalPartialRoom ? "Final chamber · resolve all" : `${Math.max(0, 3 - state.resolvedThisRoom)} choices left`}</small>
              </div>
              <div className="room-cards">
                {state.room.map((card, slot) => (
                  <CardFace
                    key={card.id}
                    card={card}
                    style={cardScatter(card, slot)}
                    selected={selectedId === card.id}
                    className={`room-card ${drag?.card.id === card.id ? "drag-source" : ""}`}
                    onClick={() => handleCardClick(card)}
                    onDoubleClick={() => handleDoubleClick(card)}
                    onPointerDown={(event) => handlePointerDown(event, card)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endPointer}
                    onPointerCancel={(event) => endPointer(event, true)}
                  />
                ))}
                {Array.from({ length: Math.max(0, 4 - state.room.length) }, (_, index) => <span className="vacant-card" key={index} />)}
              </div>
            </div>
          </div>

          <div className="lower-table">
            <div className="discard-area">
              <div className="discard-pile">
                {state.discard.length ? <img src={CARD_BACK_URL} alt="Face-down discard pile" /> : <span className="empty-slot">Discard</span>}
              </div>
              <span className="area-label">Discard · {state.discard.length}</span>
            </div>

            <div className={`drop-zone health-zone ${dropZoneState("health")}`} data-drop="health">
              <Heart aria-hidden="true" />
              <span><strong>{state.health} / 20</strong><small>{state.potionUsed ? "Potion used" : "Drop potion"}</small></span>
              {healthPreview && <DropEffect preview={healthPreview} />}
            </div>

            <div className={`weapon-area drop-zone ${dropZoneState("weapon")}`} data-drop="weapon">
              {state.weapon ? (
                <div className="weapon-stack">
                  <CardFace card={state.weapon.card} compact className="equipped-card" />
                  {state.weapon.slain.slice(-4).map((monster, index, visible) => (
                    <CardFace
                      card={monster}
                      compact
                      className="slain-card"
                      style={{ transform: `translateY(${(index + 1) * 18}px)`, zIndex: visible.length + index }}
                      key={monster.id}
                    />
                  ))}
                </div>
              ) : <Shield className="zone-icon" aria-hidden="true" />}
              <span className="zone-copy"><strong>{state.weapon ? `${state.weapon.card.rank}♦ weapon` : "No weapon"}</strong><small>{state.weapon ? (state.weapon.limit ? `Can fight ${state.weapon.limit} or lower` : "Ready for any monster") : "Drop weapon"}</small></span>
              {weaponPreview && <DropEffect preview={weaponPreview} />}
            </div>

            <div className={`drop-zone barehand-zone ${dropZoneState("barehand")}`} data-drop="barehand">
              <UserRound aria-hidden="true" />
              <span><strong>Barehanded</strong><small>Take full damage</small></span>
              {barehandPreview && <DropEffect preview={barehandPreview} />}
            </div>

            <div className="room-controls">
              <button className="avoid-button" type="button" onClick={() => commit({ type: "avoid-room" })} disabled={!canAvoidRoom(state)} aria-label="Avoid room">
                <Footprints aria-hidden="true" /><span>Avoid room</span>
              </button>
            </div>
          </div>

          <div className={`action-tray ${selectedCard ? "visible" : ""}`} aria-label="Card actions">
            {selectedCard && (
              <>
                <span className="selected-label">{cardName(selectedCard)}</span>
                {legalActions.map(({ label, icon: Icon, action }) => (
                  <button type="button" onClick={() => commit(action)} key={label}><Icon aria-hidden="true" />{label}</button>
                ))}
                <button type="button" className="cancel-action" onClick={() => setSelectedId(null)}>Cancel</button>
              </>
            )}
          </div>

          <div className="status-line" aria-hidden="true">{state.message}</div>
          <div className="sr-only" aria-live="polite">{announcement}</div>
        </section>

        {state.status !== "playing" && (
          <div className="modal-backdrop result-backdrop">
            <section className="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title">
              <span className="result-suit" aria-hidden="true">{state.status === "won" ? "♦" : "♠"}</span>
              <span className="eyebrow">{state.status === "won" ? "Dungeon cleared" : "Run ended"}</span>
              <h2 id="result-title">{state.status === "won" ? "You survived" : "The dungeon wins"}</h2>
              <strong className="final-score">{state.score}</strong>
              <span className="score-label">Final score</span>
              <p>{state.message}</p>
              <div className="result-actions">
                <button type="button" onClick={undo} disabled={!session.past.length}><Undo2 aria-hidden="true" />Undo</button>
                <button type="button" className="primary-button" onClick={startNewGame} autoFocus><RotateCcw aria-hidden="true" />New game</button>
              </div>
            </section>
          </div>
        )}

        <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
        {drag && <CardFace card={drag.card} compact className="drag-ghost" style={{ left: drag.x, top: drag.y }} />}
      </main>

      <div className="rotate-screen">
        <RotateCcw aria-hidden="true" />
        <strong>Turn your device</strong>
        <span>Scoundrel plays in landscape.</span>
      </div>
    </>
  );
}

function DropEffect({ preview }: { preview: DropPreview }) {
  return (
    <output className={`drop-preview ${preview.legal ? "positive" : "invalid"}`} aria-hidden="true">
      <strong>{preview.primary}{preview.showHeart && <Heart className="preview-heart" />}</strong>
      <small>{preview.secondary}</small>
    </output>
  );
}
