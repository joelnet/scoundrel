# Scoundrel Rules

Scoundrel is a single-player rogue-like card game designed by **Zach Gage and Kurt Bieg** in 2011. It takes about ten minutes and uses a modified standard deck of playing cards.

This rules file follows the designers' original version 1.0 rule sheet:
https://aiscoundrel.com/Scoundrel.pdf

## Objective

Make your way through the entire Dungeon without your Health reaching zero. You begin with **20 Health**.

## Setup

From a standard 52-card deck, remove:

- Both Jokers, if present
- The Aces of Hearts and Diamonds
- The Jacks, Queens, and Kings of Hearts and Diamonds

Shuffle the remaining **44 cards**. Place them face down as the Dungeon and deal four face-up cards to form the first Room.

## Card Types

### Monsters: Clubs and Spades

All 26 black cards are Monsters. A Monster's damage is its value:

- Number cards: their printed number
- Jack: 11
- Queen: 12
- King: 13
- Ace: 14

### Weapons: Diamonds

The nine Diamonds, 2 through 10, are Weapons. A Weapon reduces a Monster's damage by its value.

Weapons are binding. When you choose a Weapon, you must equip it. Equipping a new Weapon discards the previous Weapon and every Monster stacked on it.

### Health Potions: Hearts

The nine Hearts, 2 through 10, are Health Potions. The first Potion chosen in a Room restores its value, up to the starting maximum of 20 Health. Any additional Potion chosen in the same Room is discarded without effect.

## Rooms and Turns

A Room contains four face-up cards. Choose and resolve three cards, one at a time, in any order. Leave the fourth card face up; it carries over as the first card of the next Room. Deal three more cards to refill the Room.

Near the end of the Dungeon there may not be enough cards to refill to four. This final partial Room cannot be avoided and every card in it must be resolved.

## Optional House Rule

This digital version includes a **Skip the final two cards** option, enabled by default. When enabled, the game ends after the last full Room and the remaining incomplete two-card Room is ignored. Disable it in the Rules dialog to use the original rule requiring those cards to be resolved. Your preference is saved for future visits.

## Avoiding a Room

Before choosing any card in a full Room, you may avoid it. Put all four Room cards at the bottom of the Dungeon and deal a new Room of four cards.

You may avoid any number of Rooms during a game, but you may not avoid two Rooms in a row. After avoiding a Room, you must face the next one.

## Combat

When choosing a Monster, fight it either barehanded or with your equipped Weapon.

### Barehanded

Subtract the Monster's full value from your Health, then discard it.

Example: Fighting a 7 barehanded costs 7 Health.

### With a Weapon

Subtract the Weapon value from the Monster value. Lose any positive remainder as Health; damage never goes below zero. Place the defeated Monster face up on the Weapon stack.

Example: A 5 Weapon against a Jack (11) means `11 - 5 = 6` damage. A 5 Weapon against a 3 means no damage.

### Weapon Wear

After a Weapon defeats its first Monster, it may only be used against Monsters whose values are **equal to or lower than the last Monster defeated by that Weapon**.

Example: A Weapon that last defeated a Queen (12) may next fight a 6. If it then defeats that 6, it may only fight Monsters valued 6 or lower until it is replaced.

A Monster too strong for the Weapon must be fought barehanded. The Weapon remains equipped for weaker Monsters.

## Ending and Scoring

The game ends when you clear the Dungeon or your Health reaches zero.

- **Victory:** Your score is your remaining Health.
- **Final Potion bonus:** If your final card is a Potion and your Health finishes at 20, add that Potion's value to your score.
- **Defeat:** Total the values of every unresolved Monster still in the Room and Dungeon. Your score is the negative of that total.

## Digital Controls

### Desktop

- Click a Room card, then click a legal action.
- Drag Potions to Health, Weapons to the Weapon area, and Monsters to the Weapon or Barehanded area.
- Double-click a Potion or Weapon for its unambiguous action. A Monster may be double-clicked for barehanded combat only when no Weapon is equipped.
- Use Left and Right Arrow to move between Room cards, Enter or Space to select, Escape to cancel, and Ctrl/Cmd+Z to undo.

### Mobile

- Play in landscape orientation.
- Tap a Room card, then tap a legal action.
- Cards may also be dragged to highlighted destinations.

## Credit

Scoundrel was co-designed by **[Zach Gage](https://x.com/helvetica?lang=en)** and **[Kurt Bieg](https://www.kurtbieg.com/)**. Copyright © 2011 Zach Gage and Kurt Bieg.

This PWA is an independent digital implementation and is not affiliated with or endorsed by the original designers.
