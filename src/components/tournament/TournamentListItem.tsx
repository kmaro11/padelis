import Link from "next/link";

import { dateBadgeParts } from "@/lib/date";
import { FORMAT_LABEL, type Tournament } from "@/lib/types";
import { Chip } from "../ui/Chip";
import { DateBadge } from "../ui/DateBadge";
import { cn } from "../ui/cn";

const STATUS_LABEL: Record<Tournament["status"], string> = {
  draft: "Draft",
  "in-play": "In play",
  completed: "Done",
};

export function TournamentListItem({
  tournament,
}: {
  tournament: Tournament;
}) {
  const { day, caption } = dateBadgeParts(tournament.date);
  const live = tournament.status === "in-play";

  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className={cn(
        "flex items-center gap-4 rounded-card border border-hair p-[18px]",
        live && "shadow-card",
      )}
    >
      <DateBadge day={day} caption={caption} tone={live ? "ink" : "fill"} />
      <div className="flex-1">
        <p className="text-md font-semibold tracking-snug">{tournament.name}</p>
        <p className="mt-[3px] text-xs-plus text-dim">
          {tournament.teams.length} teams · {FORMAT_LABEL[tournament.format]}
        </p>
      </div>
      <Chip tone={live ? "gold" : "neutral"}>
        {STATUS_LABEL[tournament.status]}
      </Chip>
    </Link>
  );
}
