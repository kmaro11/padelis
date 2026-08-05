"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil } from "lucide-react";

import { saveScoreAction } from "@/app/actions/tournaments";
import { cn } from "@/components/ui/cn";
import { isPlayed } from "@/lib/standings";
import {
  activeRoundIndex,
  groupByRound,
  matchNumbers,
  teamName,
} from "@/lib/tournament-view";
import type { Match, Tournament } from "@/lib/types";

export function MatchList({ tournament }: { tournament: Tournament }) {
  const rounds = useMemo(
    () => groupByRound(tournament.matches),
    [tournament.matches],
  );
  const numbers = useMemo(
    () => matchNumbers(tournament.matches),
    [tournament.matches],
  );

  const [selected, setIndex] = useState(() => activeRoundIndex(rounds));
  const [editingId, setEditingId] = useState<string | null>(null);

  /**
   * Tvarkaraštis gali pasikeisti po išsaugojimo (atsiranda pusfinaliai arba
   * dingsta persėtas bracket'as), tad rodyklė ribojama renderio metu.
   */
  const index = Math.min(selected, Math.max(0, rounds.length - 1));
  const group = rounds[index];
  if (!group) return null;

  const remaining = group.matches.length - group.played;
  const isLast = index === rounds.length - 1;

  return (
    <>
      <div className="flex items-center justify-between">
        <RoundArrow
          direction="prev"
          disabled={index === 0}
          onClick={() => {
            setEditingId(null);
            setIndex(index - 1);
          }}
        />

        <div className="text-center">
          <p className="text-md font-semibold tracking-snug">{group.label}</p>
          <p className="mt-0.5 text-xs text-dim">
            {group.complete
              ? "All results in"
              : `${remaining} of ${group.matches.length} left`}
          </p>
        </div>

        <RoundArrow
          direction="next"
          disabled={isLast}
          onClick={() => {
            setEditingId(null);
            setIndex(index + 1);
          }}
        />
      </div>

      <RoundDots count={rounds.length} active={index} />

      <div className="flex flex-col gap-3">
        {group.matches.map((match) => (
          <MatchCard
            key={match.id}
            tournament={tournament}
            match={match}
            number={numbers.get(match.id) ?? 0}
            editing={match.id === editingId}
            onEdit={() => setEditingId(match.id)}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
      </div>

      {!isLast ? (
        <button
          type="button"
          disabled={!group.complete}
          onClick={() => {
            setEditingId(null);
            setIndex(index + 1);
          }}
          className={cn(
            "flex h-[54px] w-full shrink-0 items-center justify-center rounded-tile text-lg font-semibold tracking-snug transition-colors duration-150 ease-ios",
            group.complete
              ? "bg-ink text-white active:bg-black"
              : "bg-fill text-dim",
          )}
        >
          {group.complete
            ? `Next round · ${rounds[index + 1].label}`
            : `${remaining} result${remaining === 1 ? "" : "s"} left`}
        </button>
      ) : null}
    </>
  );
}

function RoundArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous round" : "Next round"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-colors duration-150 ease-ios",
        disabled ? "text-faint" : "text-glyph active:bg-fill",
      )}
    >
      <Icon className="size-5" strokeWidth={2.5} />
    </button>
  );
}

function RoundDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-200 ease-ios",
            index === active ? "w-5 bg-gold" : "w-1.5 bg-hair",
          )}
        />
      ))}
    </div>
  );
}

function MatchCard({
  tournament,
  match,
  number,
  editing,
  onEdit,
  onCancelEdit,
}: {
  tournament: Tournament;
  match: Match;
  number: number;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const home = teamName(tournament.teams, match.homeTeamId);
  const away = teamName(tournament.teams, match.awayTeamId);
  const played = isPlayed(match);

  if (home && away && (editing || !played)) {
    return (
      <ScoreEntryCard
        tournamentId={tournament.id}
        match={match}
        number={number}
        home={home}
        away={away}
        onDone={onCancelEdit}
        editing={editing}
      />
    );
  }

  if (played && match.score) {
    const homeWon = match.score.home > match.score.away;
    return (
      <article className="rounded-[24px] border border-hair bg-fill p-[18px]">
        <header className="mb-3 flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase leading-none tracking-badge text-dim">
            {match.label ?? `Match ${number}`} · Completed
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit result of ${match.label ?? `match ${number}`}`}
              className="flex size-7 items-center justify-center rounded-full text-dim active:bg-hair"
            >
              <Pencil className="size-[14px]" />
            </button>
            <span className="flex size-[18px] items-center justify-center rounded-full bg-ink">
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
          </span>
        </header>
        <ScoreRow name={home} score={match.score.home} winner={homeWon} />
        <ScoreRow name={away} score={match.score.away} winner={!homeWon} />
      </article>
    );
  }

  return (
    <article className="rounded-[24px] border border-hair p-[18px]">
      <header className="mb-3 text-2xs font-semibold uppercase leading-none tracking-badge text-dim">
        {match.label ?? `Match ${number}`} · Waiting for previous round
      </header>
      <PendingRow name={home} />
      <div className="mt-2">
        <PendingRow name={away} />
      </div>
    </article>
  );
}

function ScoreEntryCard({
  tournamentId,
  match,
  number,
  home,
  away,
  onDone,
  editing,
}: {
  tournamentId: string;
  match: Match;
  number: number;
  home: string;
  away: string;
  onDone: () => void;
  editing: boolean;
}) {
  const [homeScore, setHomeScore] = useState(
    match.score ? `${match.score.home}` : "",
  );
  const [awayScore, setAwayScore] = useState(
    match.score ? `${match.score.away}` : "",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const awayRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  const valid = homeScore !== "" && awayScore !== "" && homeScore !== awayScore;

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await saveScoreAction(tournamentId, match.id, {
          home: Number(homeScore),
          away: Number(awayScore),
        });
        onDone();
      } catch {
        setError("Nepavyko išsaugoti.");
      }
    });
  };

  return (
    <article className="rounded-[24px] border-[1.5px] border-gold p-[18px] shadow-[0_6px_22px_rgba(180,144,88,.16)]">
      <header className="mb-3.5 flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase leading-none tracking-badge text-gold">
          {match.label ?? `Match ${number}`}
          {match.court ? ` · Court ${match.court}` : ""}
        </span>
        {editing ? (
          <span className="text-[11.5px] text-dim">Editing</span>
        ) : null}
      </header>

      <ScoreInput
        name={home}
        value={homeScore}
        onChange={setHomeScore}
        onFilled={() => awayRef.current?.focus()}
      />
      <div className="my-3 h-px bg-hair" />
      <ScoreInput
        ref={awayRef}
        name={away}
        value={awayScore}
        onChange={setAwayScore}
        onFilled={() => saveRef.current?.focus()}
      />

      {error ? (
        <p className="mt-3 text-center text-sm text-red-600">{error}</p>
      ) : null}

      {editing ? (
        <p className="mt-4 text-center text-xs text-dim text-pretty">
          Changing a Round Robin result reseeds the bracket, unless it has
          already started.
        </p>
      ) : null}

      <div className="mt-2 flex gap-2">
        {editing ? (
          <button
            type="button"
            onClick={onDone}
            className="flex h-[46px] flex-1 items-center justify-center rounded-[14px] bg-fill text-base font-semibold text-ink"
          >
            Cancel
          </button>
        ) : null}

        <button
          ref={saveRef}
          type="button"
          onClick={save}
          disabled={!valid || pending}
          className={cn(
            "flex h-[46px] flex-1 items-center justify-center rounded-[14px] text-base font-semibold transition-colors duration-150 ease-ios",
            valid && !pending
              ? "bg-gold text-white active:bg-gold-hover"
              : "bg-fill text-dim",
          )}
        >
          {pending ? "Saving…" : editing ? "Update result" : "Save result"}
        </button>
      </div>
    </article>
  );
}

/**
 * Vienas skaitmuo, 0–6. Įvedus skaičių fokusas pats šoka toliau, o naujas
 * paspaudimas perrašo esamą reikšmę — taip taisyti greičiau nei trinti.
 */
function ScoreInput({
  ref,
  name,
  value,
  onChange,
  onFilled,
}: {
  ref?: React.Ref<HTMLInputElement>;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onFilled: () => void;
}) {
  const handle = (raw: string) => {
    const digits = raw.replace(/[^0-6]/g, "");
    if (digits === "") {
      onChange("");
      return;
    }

    onChange(digits.slice(-1));
    onFilled();
  };

  return (
    <label className="flex items-center gap-3">
      <span className="flex-1 text-md font-semibold tracking-snug">{name}</span>
      <input
        ref={ref}
        inputMode="numeric"
        pattern="[0-6]"
        maxLength={2}
        value={value}
        onChange={(event) => handle(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        aria-label={`${name} score, 0 to 6`}
        className={cn(
          "h-14 w-[58px] shrink-0 rounded-badge text-center text-4xl font-bold outline-none transition-colors duration-150 ease-ios",
          value === ""
            ? "border-2 border-gold bg-white text-ink placeholder:text-faint"
            : "bg-ink text-white",
        )}
        placeholder="0"
      />
    </label>
  );
}

function ScoreRow({
  name,
  score,
  winner,
}: {
  name: string | null;
  score: number;
  winner: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-3 py-[3px]", !winner && "opacity-45")}
    >
      <span
        className={cn(
          "flex-1 text-[15.5px]",
          winner ? "font-semibold" : "font-medium",
        )}
      >
        {name ?? "—"}
      </span>
      <span className="text-2xl font-bold leading-none">{score}</span>
    </div>
  );
}

function PendingRow({ name }: { name: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-[15.5px] font-medium">
        {name ?? "Winner TBD"}
      </span>
      <span className="h-10 w-11 shrink-0 rounded-field bg-fill" />
    </div>
  );
}
