import { Screen } from "@/components/layout/AppShell";
import { PlayerList } from "@/components/players/PlayerList";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { listPlayers } from "@/db/queries";
import { plural } from "@/lib/tournament-view";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await listPlayers();

  return (
    <Screen>
      <header>
        <ScreenTitle>Players</ScreenTitle>
        <p className="mt-[7px] text-sm text-dim">
          {players.length} {plural(players.length, "player", "players")} saved
        </p>
      </header>

      <PlayerList players={players} />
    </Screen>
  );
}
