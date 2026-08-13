import { ExternalLink, X } from "lucide-react";

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RulesDialog({ open, onClose }: RulesDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="rules-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <header className="dialog-header">
          <div>
            <span className="eyebrow">How to play</span>
            <h2 id="rules-title">Scoundrel rules</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close rules" title="Close rules" autoFocus>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="rules-content">
          <p className="rules-intro">
            Descend through a 44-card dungeon. Survive every room with as much health as possible.
          </p>

          <div className="rules-grid">
            <article>
              <h3><span className="red-suit">♥</span> Potions</h3>
              <p>Restore the card's value, up to 20 health. Only the first potion in each room heals you.</p>
            </article>
            <article>
              <h3><span className="red-suit">♦</span> Weapons</h3>
              <p>Equip immediately and replace your old weapon. Its value reduces monster damage.</p>
            </article>
            <article>
              <h3>♣ ♠ Monsters</h3>
              <p>Fight barehanded for full damage, or use a legal weapon and take only the difference.</p>
            </article>
            <article>
              <h3>Weapon wear</h3>
              <p>After a weapon kills a monster, it can only fight monsters equal to or weaker than that last victim.</p>
            </article>
          </div>

          <h3>Rooms</h3>
          <p>Choose three of four cards in any order. The unchosen card carries into the next room. You may avoid a full room, placing all four cards under the dungeon, but never avoid two rooms in a row. Resolve every card in the final partial room.</p>

          <h3>Scoring</h3>
          <p>Clear the dungeon to score your remaining health. Finishing at 20 health with a potion as the last card adds that potion's value. If you die, your score is the negative value of all unresolved monsters.</p>

          <h3>Controls</h3>
          <p>Tap or click a card, then choose an action. You can also drag cards to a highlighted destination. On desktop, use arrow keys to move between cards, Enter or Space to select, Escape to cancel, and Ctrl/Cmd+Z to undo.</p>

          <aside className="credit-block">
            <strong>Scoundrel was designed by Zach Gage and Kurt Bieg in 2011.</strong>
            <span>This is an independent digital implementation and is not affiliated with or endorsed by the original designers.</span>
            <a href="https://aiscoundrel.com/Scoundrel.pdf" target="_blank" rel="noreferrer">
              Read the original rules <ExternalLink aria-hidden="true" />
            </a>
          </aside>
        </div>
      </section>
    </div>
  );
}
