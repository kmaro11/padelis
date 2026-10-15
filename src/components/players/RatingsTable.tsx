import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { cn } from "@/components/ui/cn";
import { MIN_TOURNAMENTS_PUBLIC, STALE_DAYS } from "@/lib/rating";
import { initials } from "@/lib/tournament-view";
import type { RatingRow } from "@/lib/types";

const SHORT_DATE = new Intl.DateTimeFormat("lt-LT", {
  day: "numeric",
  month: "short",
});

/** §9 — vieša lentelė: vieta, žaidėjas, reitingas, turnyrų, paskutinis kartas. */
export function RatingsTable({ rows }: { rows: RatingRow[] }) {
  // Dar nežaidę į reitingų langą nepatenka — jie visi turi vienodą 1000 ir
  // lentelės nepapildo. Juos tvarkyti galima Players ekrane.
  const played = rows.filter((row) => row.tournamentsPlayed > 0);

  const ranked = played.filter((row) => row.ranked);
  const waiting = played.filter((row) => !row.ranked);

  return (
    <>
      <div className="flex flex-col">
        {ranked.map((row, index) => (
          <Row key={row.player.id} row={row} rank={index + 1} />
        ))}
      </div>

      {waiting.length > 0 ? (
        <section>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-badge text-dim">
            Dar ne lentelėje · reikia {MIN_TOURNAMENTS_PUBLIC} turnyrų
          </p>
          <div className="flex flex-col">
            {waiting.map((row) => (
              <Row key={row.player.id} row={row} rank={null} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Row({ row, rank }: { row: RatingRow; rank: number | null }) {
  const podium = rank !== null && rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-hair py-3",
        row.stale && "opacity-60",
      )}
    >
      <span className="flex w-7 shrink-0 flex-col items-center gap-1">
        <span
          className={cn(
            "text-base font-bold leading-none",
            podium ? "text-gold" : "text-dim",
          )}
        >
          {rank ?? "–"}
        </span>
        <Movement value={row.movement} />
      </span>

      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fill text-xs font-semibold text-dim">
        {initials(row.player.name)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-medium">
          {row.player.name}
        </span>
        <span className="mt-0.5 truncate text-xs text-dim">
          {row.tournamentsPlayed === 0
            ? "Dar nežaidė"
            : `${row.tournamentsPlayed} ${tournamentWord(row.tournamentsPlayed)}`}
          {row.lastPlayedAt
            ? ` · ${SHORT_DATE.format(new Date(`${row.lastPlayedAt}T00:00:00`))}`
            : null}
          {row.stale ? ` · nežaidė ${STALE_DAYS}+ d.` : null}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <span className="text-base font-semibold tabular-nums">
          {row.rating}
        </span>
        {row.lastChange !== null && row.lastChange !== 0 ? (
          <span
            className={cn(
              "mt-0.5 text-xs tabular-nums",
              row.lastChange > 0 ? "text-gold" : "text-dim",
            )}
          >
            {row.lastChange > 0 ? "+" : "−"}
            {Math.abs(row.lastChange)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** ↑2 / ↓1 / – / NAUJ. — vietos pokytis nuo paskutinio turnyro. */
function Movement({ value }: { value: RatingRow["movement"] }) {
  if (value === null) return null;

  if (value === "new") {
    return (
      <span className="text-[9px] font-semibold uppercase leading-none tracking-badge text-gold">
        Nauj.
      </span>
    );
  }

  if (value === 0) {
    return (
      <span aria-label="Liko ten pat" className="text-faint">
        <Minus className="size-3" strokeWidth={3} />
      </span>
    );
  }

  const Arrow = value > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      aria-label={value > 0 ? `Pakilo ${value}` : `Nukrito ${-value}`}
      className={cn(
        "flex items-center text-[10.5px] font-semibold leading-none tabular-nums",
        value > 0 ? "text-emerald-600" : "text-red-600",
      )}
    >
      <Arrow className="size-3" strokeWidth={3} />
      {Math.abs(value)}
    </span>
  );
}

/** 1 turnyras · 2–9 turnyrai · 10–20, 0 turnyrų */
function tournamentWord(count: number): string {
  const last = count % 10;
  const teens = count % 100 >= 11 && count % 100 <= 19;

  if (teens || last === 0) return "turnyrų";
  if (last === 1) return "turnyras";
  return "turnyrai";
}
