import { Directions } from "@/components/roi/Directions";

export const dynamic = "force-dynamic";

/**
 * Three alternative directions for the money screen, for Logan to pick from.
 *
 * A scratch surface, not part of the flow. Delete it once a direction is
 * chosen; leaving design options live is how a prospect ends up on one.
 */
export default function RoiDirectionsPage() {
  return <Directions />;
}
