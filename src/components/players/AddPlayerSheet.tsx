"use client";

import { useState, useTransition } from "react";

import { createPlayerAction } from "@/app/actions/players";
import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

/** Naujo žaidėjo įvedimas apatiniame lange — sąrašo viršuje lieka paieška. */
export function AddPlayerSheet({
  initialName,
  existing,
  onAdded,
  onClose,
}: {
  /** paieškos tekstas — dažniausiai tai ir yra naujo žaidėjo vardas */
  initialName: string;
  existing: Player[];
  onAdded: (player: Player) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clean = name.trim();
  const duplicate = existing.some(
    (player) => player.name.trim().toLowerCase() === clean.toLowerCase(),
  );
  const canAdd = clean.length > 0 && !duplicate && !pending;

  const submit = () => {
    if (!canAdd) return;

    setError(null);
    startTransition(async () => {
      try {
        onAdded(await createPlayerAction(clean));
        onClose();
      } catch {
        setError("Nepavyko išsaugoti. Patikrink ryšį ir bandyk dar kartą.");
      }
    });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative flex flex-col gap-4 rounded-t-sheet bg-white p-5 pb-8">
        <p className="text-center text-md font-semibold tracking-snug">
          New player
        </p>
        <input
          autoFocus
          value={name}
          maxLength={60}
          placeholder="Name Surname"
          aria-label="Player name"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
            if (event.key === "Escape") onClose();
          }}
          className="rounded-field bg-fill px-3 py-2.5 text-base outline-none placeholder:text-dim"
        />
        {duplicate ? (
          <p className="-mt-2 text-xs text-red-600">
            „{clean}“ jau yra sąraše.
          </p>
        ) : null}
        {error ? (
          <p className="-mt-2 text-xs text-red-600">{error}</p>
        ) : null}
        <div className="flex flex-col gap-2.5">
          <Button onClick={submit} disabled={!canAdd} className="disabled:opacity-60">
            {pending ? "Adding…" : "Add player"}
          </Button>
          <Button variant="neutral" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
