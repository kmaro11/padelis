"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteTournamentAction } from "@/app/actions/tournaments";

export function DeleteTournament({
  tournamentId,
  name,
}: {
  tournamentId: string;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-700 active:opacity-60"
      >
        <Trash2 className="size-4" />
        Delete tournament
      </button>

      {confirming ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setConfirming(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="relative rounded-t-sheet bg-white p-5 pb-8">
            <p className="text-center text-md font-semibold tracking-snug">
              Delete “{name}”?
            </p>
            <p className="mx-auto mt-2 max-w-[280px] text-center text-xs-plus leading-relaxed text-dim text-pretty">
              Its teams, schedule and results are removed. This cannot be
              undone.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteTournamentAction(tournamentId);
                    router.replace("/events");
                  })
                }
                className="flex h-[54px] items-center justify-center rounded-tile bg-red-700 text-lg font-semibold text-white active:bg-red-800 disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Delete tournament"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
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
