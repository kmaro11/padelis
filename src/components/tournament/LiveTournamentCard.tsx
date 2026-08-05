import Link from "next/link";

import { FORMAT_LABEL, type Tournament } from "@/lib/types";
import { progress } from "@/lib/standings";
import { ProgressBar } from "../ui/ProgressBar";

/** Dark hero card on Home — the tournament currently being played. */
export function LiveTournamentCard({ tournament }: { tournament: Tournament }) {
  const { played, total } = progress(tournament.matches);

  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="block rounded-card-lg bg-ink p-[22px] text-white"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase leading-none tracking-label text-gold">
          {tournament.status === "in-play" ? "Live now" : "Up next"}
        </span>
        <span className="text-xs text-on-ink-dim">
          {tournament.courts > 1
            ? `Court 1–${tournament.courts}`
            : "Court 1"}
        </span>
      </div>

      <h2 className="mb-1 mt-3 text-3xl font-semibold tracking-heading">
        {tournament.name}
      </h2>
      <p className="text-sm text-on-ink">
        {tournament.teams.length} teams · {FORMAT_LABEL[tournament.format]}
      </p>

      <div className="mb-2 mt-5 flex items-baseline justify-between">
        <span className="text-sm text-on-ink">Progress</span>
        <span className="text-sm font-semibold">
          {played} / {total} matches
        </span>
      </div>
      <ProgressBar value={played} total={total} />
    </Link>
  );
}
