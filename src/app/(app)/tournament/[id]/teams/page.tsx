import { notFound } from "next/navigation";

import { Screen } from "@/components/layout/AppShell";
import { BackLink } from "@/components/tournament/BackLink";
import { TeamList } from "@/components/tournament/TeamList";
import { getTournament } from "@/db/queries";
import { teamsInGroup } from "@/lib/schedule";
import { computeStandings } from "@/lib/standings";
import { GROUPS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamsPage({
  params,
}: PageProps<"/tournament/[id]/teams">) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const groups =
    tournament.format === "groups-finals" &&
    tournament.teams.some((team) => team.group !== null);

  const records = Object.fromEntries(
    computeStandings(tournament.teams, tournament.matches).map((row) => [
      row.team.id,
      { wins: row.wins, losses: row.losses },
    ]),
  );

  return (
    <Screen>
      <BackLink href={`/tournament/${id}`}>Tournament</BackLink>

      <header>
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-display">
          Teams
        </h1>
        <p className="mt-[7px] text-sm text-dim">
          {tournament.teams.length} entered · tap the pencil to rename
        </p>
      </header>

      {groups ? (
        GROUPS.map((group) => (
          <section key={group}>
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-badge text-dim">
              Grupė {group}
            </p>
            <TeamList
              tournamentId={tournament.id}
              teams={teamsInGroup(tournament.teams, group)}
              records={records}
            />
          </section>
        ))
      ) : (
        <TeamList
          tournamentId={tournament.id}
          teams={tournament.teams}
          records={records}
        />
      )}
    </Screen>
  );
}
