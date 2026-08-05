import { listTournaments } from "@/db/queries";
import { isPlayed } from "@/lib/standings";
import { matchNumbers, teamName } from "@/lib/tournament-view";
import { FORMAT_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

const HEADER = [
  "tournament",
  "date",
  "format",
  "match",
  "stage",
  "round",
  "court",
  "home_team",
  "home_score",
  "away_team",
  "away_score",
];

export async function GET() {
  const tournaments = await listTournaments();
  const rows: string[][] = [HEADER];

  for (const tournament of tournaments) {
    const numbers = matchNumbers(tournament.matches);

    for (const match of tournament.matches) {
      rows.push([
        tournament.name,
        tournament.date,
        FORMAT_LABEL[tournament.format],
        `${numbers.get(match.id) ?? ""}`,
        match.label ?? match.stage,
        `${match.round}`,
        match.court ? `${match.court}` : "",
        teamName(tournament.teams, match.homeTeamId) ?? "",
        isPlayed(match) ? `${match.score?.home}` : "",
        teamName(tournament.teams, match.awayTeamId) ?? "",
        isPlayed(match) ? `${match.score?.away}` : "",
      ]);
    }
  }

  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="padel-results.csv"`,
    },
  });
}

function escapeCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
