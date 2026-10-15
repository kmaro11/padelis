"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";

import { updateTournamentDetailsAction } from "@/app/actions/tournaments";
import { Calendar } from "@/components/create/Calendar";
import { CourtPicker } from "@/components/create/steps";

export function EditTournament({
  tournamentId,
  name: initialName,
  date: initialDate,
  courts: initialCourts,
  courtNames: initialCourtNames,
}: {
  tournamentId: string;
  name: string;
  date: string;
  courts: number;
  courtNames: string[] | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [date, setDate] = useState(initialDate);
  const [courts, setCourts] = useState(initialCourts);
  const [courtNames, setCourtNames] = useState(initialCourtNames ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setName(initialName);
    setDate(initialDate);
    setCourts(initialCourts);
    setCourtNames(initialCourtNames ?? []);
    setError(null);
    setOpen(false);
  };

  const clean = name.trim();
  const courtsChanged =
    courts !== initialCourts ||
    courtNames
      .slice(0, courts)
      .map((value) => value.trim())
      .join("\n") !== (initialCourtNames ?? []).join("\n");
  const changed =
    clean !== initialName || date !== initialDate || courtsChanged;

  const save = () => {
    if (clean.length === 0 || !changed) return close();

    setError(null);
    startTransition(async () => {
      try {
        await updateTournamentDetailsAction(tournamentId, {
          name: clean,
          date,
          courts,
          courtNames: courtNames.slice(0, courts),
        });
        setOpen(false);
      } catch {
        setError("Nepavyko išsaugoti. Patikrink ryšį ir bandyk dar kartą.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Edit name and date"
        onClick={() => setOpen(true)}
        className="mt-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-faint active:bg-fill"
      >
        <Pencil className="size-4" />
      </button>

      {open ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Cancel"
            onClick={close}
            className="absolute inset-0 bg-black/30"
          />
          <div className="relative flex max-h-[90%] flex-col gap-4 overflow-y-auto rounded-t-sheet bg-white p-5 pb-8">
            <p className="text-center text-md font-semibold tracking-snug">
              Edit tournament
            </p>
            <input
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") save();
                if (event.key === "Escape") close();
              }}
              aria-label="Tournament name"
              className="rounded-field bg-fill px-3 py-2.5 text-base outline-none"
            />
            <Calendar value={date} onChange={setDate} allowPast />
            <CourtPicker
              count={courts}
              names={courtNames}
              onCountChange={setCourts}
              onNamesChange={setCourtNames}
            />
            {error ? (
              <p className="text-center text-sm text-red-600">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={pending || clean.length === 0}
                onClick={save}
                className="flex h-[54px] items-center justify-center rounded-tile bg-gold text-lg font-semibold text-white shadow-gold disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={close}
                className="flex h-[54px] items-center justify-center rounded-tile bg-fill text-lg font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
