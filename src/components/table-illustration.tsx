import type { ItemId } from "@/lib/dinner";
import napa from "@/assets/illustrated/napa.png";
import enoki from "@/assets/illustrated/enoki.png";
import tofu from "@/assets/illustrated/tofu.png";
import beef from "@/assets/illustrated/beef.png";
import lotus from "@/assets/illustrated/lotus.png";
import noodles from "@/assets/illustrated/noodles.png";
import bok from "@/assets/illustrated/bok.png";
import pot from "@/assets/illustrated/pot.png";
import emptyPot from "@/assets/illustrated/empty-pot.png";
import emptySeat from "@/assets/illustrated/empty-seat.png";
import you from "@/assets/illustrated/friend-you.png";
import alex from "@/assets/illustrated/friend-alex.png";
import sam from "@/assets/illustrated/friend-sam.png";
import jordan from "@/assets/illustrated/friend-jordan.png";
import taylor from "@/assets/illustrated/friend-taylor.png";
import riley from "@/assets/illustrated/friend-riley.png";
import casey from "@/assets/illustrated/friend-casey.png";

const dishes = { napa, enoki, tofu, beef, lotus, noodles, bok, pot, broth: pot };
const portraits = [you, alex, sam, jordan, taylor, riley, casey];

// Portraits are fictional illustrations. Stable IDs keep a friend's image unchanged
// after another friend leaves; additional guests reuse this seven-person art set.
export function FriendIllustration({ id }: { id: number }) {
  return (
    <img
      src={portraits[id % portraits.length]}
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      draggable={false}
      className="pt-friend-art"
    />
  );
}

export function EmptySeatIllustration() {
  return <img src={emptySeat} alt="" aria-hidden="true" width={90} height={90} draggable={false} />;
}

export function TableIllustration({
  kind,
  empty = false,
}: {
  kind: ItemId | "pot";
  empty?: boolean;
}) {
  return (
    <img
      src={empty ? emptyPot : dishes[kind]}
      className={`food-art food-${kind}`}
      alt=""
      aria-hidden="true"
      width={240}
      height={kind === "pot" ? 240 : 160}
      decoding="async"
      draggable={false}
    />
  );
}
