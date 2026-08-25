import { cn } from "@/components/ui/cn";
import { TeamName } from "./TeamName";
import { computeFinalPlacings } from "@/lib/standings";
import { ordinal } from "@/lib/schedule";
import type { FinalPlacing } from "@/lib/standings";
import type { Tournament } from "@/lib/types";

const DECIDED_BY: Record<FinalPlacing["decidedBy"], string> = {
  final: "Final",
  "third-place": "Third place match",
  placement: "Placement match",
  "round-robin": "Round Robin rank",
};

/**
 * Galutinė klasifikacija. Round Robin lentelė duoda tik sėjimą — vietas
 * perrašo finalas, trečios vietos ir placement rungtynės.
 */
export function FinalPlacings({ tournament }: { tournament: Tournament }) {
  const { placings, complete } = computeFinalPlacings(
    tournament.teams,
    tournament.matches,
  );

  if (placings.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-badge text-dim">
          Final standings
        </p>
        {!complete ? (
          <span className="text-2xs font-semibold text-gold">Provisional</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {placings.map((placing) => (
          <div
            key={placing.team.id}
            className={cn(
              "grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded-tile px-3.5 py-3",
              placing.position === 1 && "bg-ink text-white",
              placing.position > 1 && placing.position <= 3 && "bg-fill",
            )}
          >
            <span
              className={cn(
                "text-base font-bold leading-none",
                placing.position <= 3 ? "text-gold" : "text-dim",
              )}
            >
              {placing.position}
            </span>
            <TeamName
              name={placing.team.name}
              className={cn(
                "text-base tracking-snug",
                placing.position <= 3 ? "font-semibold" : "font-medium",
              )}
            />
            <span
              className={cn(
                "shrink-0 text-2xs",
                placing.position === 1 ? "text-on-ink-dim" : "text-dim",
              )}
            >
              {placing.provisional
                ? `${ordinal(placing.position)} · pending`
                : DECIDED_BY[placing.decidedBy]}
            </span>
          </div>
        ))}
      </div>

      {!complete ? (
        <p className="text-xs text-dim text-pretty">
          Positions follow the Round Robin seeding until the remaining matches
          have a result.
        </p>
      ) : null}
    </section>
  );
}
