"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil } from "lucide-react";

import { saveScoreAction } from "@/app/actions/tournaments";
import { cn } from "@/components/ui/cn";
import { SegmentedControl } from "../ui/SegmentedControl";
import { TeamName } from "./TeamName";
import { isPlayed } from "@/lib/standings";
import {
  activeRoundIndex,
  activeTrackKey,
  groupByRound,
  groupTracks,
  matchNumbers,
  plural,
  teamName,
  type RoundGroup,
  type Track,
  type TrackKey,
} from "@/lib/tournament-view";
import type { Match, Tournament } from "@/lib/types";

export function MatchList({ tournament }: { tournament: Tournament }) {
  const tracks = useMemo(() => groupTracks(tournament), [tournament]);

  /**
   * Grupių formate kiekviena grupė turi savo turų juostą — greičiau
   * sužaidusi grupė veda rezultatus ir mato kitą savo turą nelaukdama,
   * kol antra pabaigs. Kituose formatuose lieka vienas bendras sąrašas.
   */
  if (tracks) return <TrackedRounds tournament={tournament} tracks={tracks} />;
  return <AllRounds tournament={tournament} />;
}

function AllRounds({ tournament }: { tournament: Tournament }) {
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

  const goTo = (next: number) => {
    setEditingId(null);
    setIndex(next);
  };

  const upcoming = rounds[index + 1];

  return (
    <RoundView
      tournament={tournament}
      numbers={numbers}
      rounds={rounds}
      index={index}
      eyebrow={group.phase === "knockout" ? "Knockout" : "Round Robin"}
      onIndex={goTo}
      editingId={editingId}
      onEditing={setEditingId}
      next={
        upcoming
          ? {
              label: group.complete
                ? upcoming.phase !== group.phase
                  ? `Start knockout · ${upcoming.label}`
                  : `Next round · ${upcoming.label}`
                : remainingLabel(group),
              disabled: !group.complete,
              onClick: () => goTo(index + 1),
            }
          : null
      }
    />
  );
}

function TrackedRounds({
  tournament,
  tracks,
}: {
  tournament: Tournament;
  tracks: Track[];
}) {
  const [activeKey, setKey] = useState<TrackKey>(() => activeTrackKey(tracks));
  // kiekviena juosta prisimena savo turą, tad perjungus grupę nedingsta vieta
  const [indexes, setIndexes] = useState<Partial<Record<TrackKey, number>>>(
    () =>
      Object.fromEntries(
        tracks.map((track) => [track.key, activeRoundIndex(track.rounds)]),
      ),
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const track = tracks.find((item) => item.key === activeKey) ?? tracks[0];
  const numbers = useMemo(
    () => matchNumbers(track.rounds.flatMap((round) => round.matches)),
    [track],
  );

  const rounds = track.rounds;
  const index = Math.min(
    indexes[track.key] ?? 0,
    Math.max(0, rounds.length - 1),
  );
  const group = rounds[index];

  const goTo = (next: number) => {
    setEditingId(null);
    setIndexes((current) => ({ ...current, [track.key]: next }));
  };

  const switchTo = (key: TrackKey) => {
    setEditingId(null);
    setKey(key);
  };

  const header = (
    <>
      <SegmentedControl
        value={track.key}
        onChange={switchTo}
        segments={tracks.map((item) => ({
          value: item.key,
          label: item.short,
        }))}
      />
      <p className="text-center text-xs text-dim">
        {tracks
          .map((item) =>
            item.total === 0
              ? `${item.label} užrakinti`
              : `${item.label} ${item.played}/${item.total}`,
          )
          .join(" · ")}
      </p>
    </>
  );

  if (!group) {
    const left = tracks
      .filter((item) => item.key !== "knockout")
      .reduce((sum, item) => sum + (item.total - item.played), 0);

    return (
      <>
        {header}
        <p className="rounded-tile bg-fill p-4 text-center text-xs-plus text-dim text-pretty">
          Finalai atsirakins, kai abi grupės sužais visas rungtynes. Liko:{" "}
          <span className="font-semibold text-ink">{left}</span>.
        </p>
      </>
    );
  }

  const upcoming = rounds[index + 1];

  return (
    <>
      {header}
      <RoundView
        tournament={tournament}
        numbers={numbers}
        rounds={rounds}
        index={index}
        eyebrow={track.label}
        onIndex={goTo}
        editingId={editingId}
        onEditing={setEditingId}
        next={
          upcoming
            ? {
                label: group.complete
                  ? `Next round · ${upcoming.label}`
                  : remainingLabel(group),
                disabled: !group.complete,
                onClick: () => goTo(index + 1),
              }
            : handoff(tracks, track, switchTo)
        }
      />
    </>
  );
}

/** Paskutinis juostos turas — siūlom, kur eiti toliau. */
function handoff(
  tracks: Track[],
  track: Track,
  switchTo: (key: TrackKey) => void,
): NextStep | null {
  if (!track.complete) return null;

  const pending = tracks.find(
    (item) => item.key !== track.key && item.total > 0 && !item.complete,
  );
  if (!pending) return null;

  const left = pending.total - pending.played;

  return {
    label:
      pending.key === "knockout"
        ? `Pradėti finalus · ${pending.rounds[0].label}`
        : `${pending.label} · liko ${left}`,
    disabled: false,
    onClick: () => switchTo(pending.key),
  };
}

function remainingLabel(group: RoundGroup): string {
  const left = group.matches.length - group.played;
  return `${left} ${plural(left, "result", "results")} left`;
}

interface NextStep {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function RoundView({
  tournament,
  numbers,
  rounds,
  index,
  eyebrow,
  onIndex,
  next,
  editingId,
  onEditing,
}: {
  tournament: Tournament;
  numbers: Map<string, number>;
  rounds: RoundGroup[];
  index: number;
  eyebrow: string;
  onIndex: (index: number) => void;
  next: NextStep | null;
  editingId: string | null;
  onEditing: (id: string | null) => void;
}) {
  const group = rounds[index];
  if (!group) return null;

  const remaining = group.matches.length - group.played;

  return (
    <>
      <div className="flex items-center justify-between">
        <RoundArrow
          direction="prev"
          disabled={index === 0}
          onClick={() => onIndex(index - 1)}
        />

        <div className="text-center">
          <p
            className={cn(
              "text-[10.5px] font-semibold uppercase tracking-badge",
              group.phase === "knockout" ? "text-gold" : "text-dim",
            )}
          >
            {eyebrow}
          </p>
          <p className="mt-1 text-md font-semibold tracking-snug">
            {group.label}
          </p>
          <p className="mt-0.5 text-xs text-dim">
            {group.complete
              ? "All results in"
              : `${remaining} of ${group.matches.length} left`}
          </p>
        </div>

        <RoundArrow
          direction="next"
          disabled={index === rounds.length - 1}
          onClick={() => onIndex(index + 1)}
        />
      </div>

      <RoundDots rounds={rounds} active={index} />

      {group.phase === "knockout" &&
      (index === 0 || rounds[index - 1]?.phase === "round-robin") ? (
        <p className="rounded-tile bg-gold-soft px-4 py-3 text-center text-xs-plus text-pretty">
          <span className="font-semibold text-gold">
            Round Robin is finished.
          </span>{" "}
          <span className="text-dim">
            Everything below is seeded from the final standings.
          </span>
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {group.matches.map((match) => (
          <MatchCard
            key={match.id}
            tournament={tournament}
            match={match}
            number={numbers.get(match.id) ?? 0}
            editing={match.id === editingId}
            onEdit={() => onEditing(match.id)}
            onCancelEdit={() => onEditing(null)}
          />
        ))}
      </div>

      {next ? (
        <button
          type="button"
          disabled={next.disabled}
          onClick={next.onClick}
          className={cn(
            "flex h-[54px] w-full shrink-0 items-center justify-center rounded-tile text-lg font-semibold tracking-snug transition-colors duration-150 ease-ios",
            next.disabled ? "bg-fill text-dim" : "bg-ink text-white active:bg-black",
          )}
        >
          {next.label}
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

/** Tarpas tarp taškučių žymi perėjimą iš Round Robin į atkrintamąsias. */
function RoundDots({
  rounds,
  active,
}: {
  rounds: RoundGroup[];
  active: number;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {rounds.map((group, index) => (
        <Fragment key={group.round}>
          {index > 0 && group.phase !== rounds[index - 1].phase ? (
            <span aria-hidden className="mx-1.5 h-3 w-px bg-hair" />
          ) : null}
          <span
            className={cn(
              "h-1.5 rounded-full transition-all duration-200 ease-ios",
              index === active
                ? cn("w-5", group.phase === "knockout" ? "bg-gold" : "bg-ink")
                : "w-1.5 bg-hair",
            )}
          />
        </Fragment>
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
      <TeamName
        name={name}
        className="flex-1 text-md font-semibold tracking-snug"
      />
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
      <TeamName
        name={name}
        className={cn(
          "flex-1 text-[15.5px]",
          winner ? "font-semibold" : "font-medium",
        )}
      />
      <span className="shrink-0 text-2xl font-bold leading-none">{score}</span>
    </div>
  );
}

function PendingRow({ name }: { name: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {name ? (
        <TeamName name={name} className="flex-1 text-[15.5px] font-medium" />
      ) : (
        <span className="flex-1 text-[15.5px] font-medium">Winner TBD</span>
      )}
      <span className="h-10 w-11 shrink-0 rounded-field bg-fill" />
    </div>
  );
}
