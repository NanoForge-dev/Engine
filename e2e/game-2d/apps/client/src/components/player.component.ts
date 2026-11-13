import { type Rect } from "@nanoforge-dev/graphics-2d";

/**
 * The square the arrow keys move, read by the `movePlayer` system.
 *
 * @component
 * @side client
 */
export class Player {
  name = "Player";

  constructor(
    /** The square drawn for the player: the system moves it. */
    public shape: Rect,
  ) {}
}
