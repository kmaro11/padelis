import { Screen } from "@/components/layout/AppShell";
import { PlayerList } from "@/components/players/PlayerList";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { listRatings } from "@/db/queries";
import { MIN_TOURNAMENTS_PUBLIC } from "@/lib/rating";
import { plural } from "@/lib/tournament-view";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const rows = await listRatings();
  const ranked = rows.filter((row) => row.ranked).length;

  return (
    <Screen>
      <header>
        <ScreenTitle>Players</ScreenTitle>
        <p className="mt-[7px] text-sm text-dim">
          {rows.length} {plural(rows.length, "player", "players")} ·{" "}
          {ranked} reitinguojami
        </p>
        <p className="mt-1 text-xs text-faint">
          Į reitingą patenkama nuo {MIN_TOURNAMENTS_PUBLIC} turnyrų
        </p>
      </header>

      <PlayerList players={rows} />
    </Screen>
  );
}
