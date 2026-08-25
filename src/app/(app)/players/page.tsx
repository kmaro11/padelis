import { Screen } from "@/components/layout/AppShell";
import { PlayerList } from "@/components/players/PlayerList";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { listRatings } from "@/db/queries";
import { plural } from "@/lib/tournament-view";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const rows = await listRatings();
  const active = rows.filter((row) => row.tournamentsPlayed > 0).length;

  return (
    <Screen>
      <header>
        <ScreenTitle>Players</ScreenTitle>
        <p className="mt-[7px] text-sm text-dim">
          {rows.length} {plural(rows.length, "player", "players")} · {active}{" "}
          jau žaidė
        </p>
      </header>

      <PlayerList players={rows} />
    </Screen>
  );
}
