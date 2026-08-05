"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import { createTournamentAction } from "@/app/actions/tournaments";
import { Screen } from "@/components/layout/PhoneFrame";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { parseDate } from "@/lib/date";
import type { TournamentFormat } from "@/lib/types";
import { Calendar } from "./Calendar";
import { FormatCards, TeamCountGrid, TeamNameInputs } from "./steps";

const STEPS = ["Date", "Teams", "Names", "Format"] as const;

export function CreateFlow() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [teamCount, setTeamCount] = useState(6);
  const [names, setNames] = useState<string[]>(() => defaultNames(6));
  const [format, setFormat] = useState<TournamentFormat>("round-robin");
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
          courts: 1,
          teamNames: names,
        });
        setCreatedId(id);
      } catch {
        setError("Nepavyko išsaugoti. Patikrink ryšį ir bandyk dar kartą.");
      }
    });
  };

  const setCount = (count: number) => {
    setTeamCount(count);
    setNames((current) =>
      Array.from({ length: count }, (_, index) => current[index] ?? ""),
    );
  };

  return (
    <Screen>
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
          <TeamCountGrid value={teamCount} onChange={setCount} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h1 className="text-5xl font-bold tracking-display">Teams</h1>
          <TeamNameInputs
            names={names}
            onChange={(index, name) =>
              setNames((current) =>
                current.map((item, position) =>
                  position === index ? name : item,
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

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, () => "");
}

/** Handoff'e pavadinimo žingsnio nėra — vardas kildinamas iš datos. */
function suggestName(iso: string): string {
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(parseDate(iso));
  return `${weekday} tournament`;
}
