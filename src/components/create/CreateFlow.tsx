"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import { createTournamentAction } from "@/app/actions/tournaments";
import { Screen } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { parseDate } from "@/lib/date";
import {
  GROUPS_FINALS_TEAMS,
  type Player,
  type TeamDraft,
  type TournamentFormat,
} from "@/lib/types";
import { Calendar } from "./Calendar";
import { FormatCards, RatedCheckbox, TeamCountGrid } from "./steps";
import { TeamBuilder, type TeamSlots } from "./TeamBuilder";

const STEPS = ["Date", "Teams", "Names", "Format"] as const;

export interface CreateDefaults {
  defaultTeams: number;
  defaultFormat: TournamentFormat;
  courts: number;
}

export function CreateFlow({
  defaults,
  players: initialPlayers,
}: {
  defaults: CreateDefaults;
  players: Player[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [teamCount, setTeamCount] = useState(defaults.defaultTeams);
  const [players, setPlayers] = useState(initialPlayers);
  const [teams, setTeams] = useState<TeamSlots[]>(() =>
    emptyTeams(defaults.defaultTeams),
  );
  const [format, setFormat] = useState<TournamentFormat>(
    defaults.defaultFormat,
  );
  const [rated, setRated] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (createdId) {
    return <SuccessScreen tournamentId={createdId} />;
  }

  const canContinue = step === 0 ? date !== null : true;

  const back = () => {
    if (step === 0) router.back();
    else setStep((current) => current - 1);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const id = await createTournamentAction({
          name: suggestName(date as string),
          date: date as string,
          format,
          courts: defaults.courts,
          rated,
          teams: toDrafts(teams, players),
        });
        setCreatedId(id);
      } catch {
        setError("Nepavyko išsaugoti. Patikrink ryšį ir bandyk dar kartą.");
      }
    });
  };

  const setCount = (count: number) => {
    setTeamCount(count);
    // "Grupės + Finalai" veikia tik su 8 — pakeitus skaičių formatas nebetinka
    if (count !== GROUPS_FINALS_TEAMS) {
      setFormat((current) =>
        current === "groups-finals" ? defaults.defaultFormat : current,
      );
    }
    setTeams((current) =>
      Array.from(
        { length: count },
        (_, index) =>
          current[index] ?? { player1Id: null, player2Id: null },
      ),
    );
  };

  return (
    <Screen nav={false}>
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="flex size-9 items-center justify-center rounded-full text-glyph active:bg-fill"
          >
            <ArrowLeft className="size-5" />
          </button>
          <SectionLabel>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </SectionLabel>
        </div>
        <ProgressBar value={step + 1} total={STEPS.length} tone="on-light" />
      </header>

      {step === 0 ? (
        <>
          <h1 className="text-5xl font-bold tracking-display">When?</h1>
          <Calendar value={date} onChange={setDate} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <h1 className="text-5xl font-bold tracking-display">How many?</h1>
          <p className="-mt-2 text-sm text-dim">
            {teamCount} teams · {teamCount * 2} players
          </p>
          <TeamCountGrid value={teamCount} onChange={setCount} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h1 className="text-5xl font-bold tracking-display">Teams</h1>
          <TeamBuilder
            teams={teams}
            players={players}
            onChange={(index, slots) =>
              setTeams((current) =>
                current.map((item, position) =>
                  position === index ? slots : item,
                ),
              )
            }
            onPlayerCreated={(player) =>
              setPlayers((current) =>
                [...current, player].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              )
            }
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h1 className="text-5xl font-bold tracking-display">Format</h1>
          <FormatCards
            value={format}
            onChange={setFormat}
            teamCount={teamCount}
          />
          <RatedCheckbox checked={rated} onChange={setRated} />
        </>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pb-2">
        {error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : null}
        <Button onClick={next} disabled={!canContinue || pending}>
          {step < STEPS.length - 1
            ? "Continue"
            : pending
              ? "Creating…"
              : "Create tournament"}
        </Button>
      </div>
    </Screen>
  );
}

function SuccessScreen({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-ink px-6 text-center text-white">
      <div className="flex size-[78px] items-center justify-center rounded-full bg-gold shadow-gold">
        <Check className="size-9 text-white" strokeWidth={3} />
      </div>
      <h1 className="text-2xl font-semibold tracking-heading">
        Tournament ready
      </h1>
      <p className="max-w-[260px] text-base-plus text-on-ink text-pretty">
        The schedule is generated. Enter results as they come in.
      </p>
      <div className="mt-4 flex w-full max-w-[300px] flex-col gap-2.5">
        <Link
          href={`/tournament/${tournamentId}`}
          className="flex h-[54px] items-center justify-center rounded-tile bg-gold text-lg font-semibold text-white shadow-gold"
        >
          Open tournament
        </Link>
        <Link
          href="/events"
          className="flex h-[54px] items-center justify-center rounded-tile text-lg font-semibold text-on-ink"
        >
          Back to events
        </Link>
      </div>
    </div>
  );
}

function emptyTeams(count: number): TeamSlots[] {
  return Array.from({ length: count }, () => ({
    player1Id: null,
    player2Id: null,
  }));
}

/**
 * Komandos pavadinimas kildinamas iš žaidėjų ("Jonas / Petras"), o ID
 * įrašomi atskirai — pagal juos vėliau traukiama žaidėjo statistika.
 * Nepasirinkus nė vieno lieka tuščias vardas — `createTeams` duos "Team N".
 */
function toDrafts(teams: TeamSlots[], players: Player[]): TeamDraft[] {
  const byId = new Map(players.map((player) => [player.id, player.name]));

  return teams.map((team) => ({
    name: [team.player1Id, team.player2Id]
      .map((id) => (id ? byId.get(id) : undefined))
      .filter(Boolean)
      .join(" / ")
      .slice(0, 60),
    player1Id: team.player1Id,
    player2Id: team.player2Id,
  }));
}

/** Handoff'e pavadinimo žingsnio nėra — vardas kildinamas iš datos. */
function suggestName(iso: string): string {
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(parseDate(iso));
  return `${weekday} tournament`;
}
