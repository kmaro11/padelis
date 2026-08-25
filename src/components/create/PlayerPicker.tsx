"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";

import { createPlayerAction } from "@/app/actions/players";
import { cn } from "@/components/ui/cn";
import type { Player } from "@/lib/types";

/**
 * Žaidėjo pasirinkimas iš sąrašo. Jau užimti žaidėjai nerodomi — tas pats
 * žmogus negali atsidurti dviejose komandose. Jei paieška nieko neranda,
 * siūlom įrašyti naują — turnyro dieną atėjusio svečio nereikia vaikytis
 * per atskirą ekraną.
 */
export function PlayerPicker({
  players,
  taken,
  onSelect,
  onClear,
  onClose,
  onPlayerCreated,
}: {
  players: Player[];
  /** kitų slotų užimti id */
  taken: Set<string>;
  onSelect: (player: Player) => void;
  onClear: () => void;
  onClose: () => void;
  onPlayerCreated: (player: Player) => void;
}) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const clean = query.trim();

  const matches = useMemo(() => {
    const available = players.filter((player) => !taken.has(player.id));
    if (clean.length === 0) return available;

    const needle = clean.toLowerCase();
    return available.filter((player) =>
      player.name.toLowerCase().includes(needle),
    );
  }, [players, taken, clean]);

  /** „Pridėti naują" tik tada, kai tokio vardo tikrai nėra. */
  const exists = players.some(
    (player) => player.name.trim().toLowerCase() === clean.toLowerCase(),
  );
  const canCreate = clean.length > 0 && !exists;

  const create = () => {
    if (!canCreate || pending) return;

    startTransition(async () => {
      const player = await createPlayerAction(clean);
      onPlayerCreated(player);
      onSelect(player);
    });
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <div className="relative flex max-h-[78%] flex-col rounded-t-sheet bg-white pb-8 pt-5">
        <div className="flex items-center gap-2 px-5">
          <span className="flex flex-1 items-center gap-2 rounded-field bg-fill px-3">
            <Search className="size-4 shrink-0 text-faint" />
            <input
              autoFocus
              value={query}
              maxLength={60}
              placeholder="Search players"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                if (matches.length === 1) onSelect(matches[0]);
                else if (canCreate) create();
              }}
              className="w-full bg-transparent py-2.5 text-base outline-none placeholder:text-dim"
            />
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-glyph active:bg-fill"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto px-5">
          {canCreate ? (
            <button
              type="button"
              onClick={create}
              disabled={pending}
              className={cn(
                "flex w-full items-center gap-3 border-b border-hair py-3.5 text-left",
                pending && "opacity-50",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-white">
                <Plus className="size-4" strokeWidth={3} />
              </span>
              <span className="text-base">
                {pending ? "Adding…" : `Add “${clean}”`}
              </span>
            </button>
          ) : null}

          {matches.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onSelect(player)}
              className="flex w-full items-center border-b border-hair py-3.5 text-left text-base last:border-b-0 active:bg-fill"
            >
              {player.name}
            </button>
          ))}

          {matches.length === 0 && !canCreate ? (
            <p className="py-6 text-center text-sm text-dim">
              {players.length === 0
                ? "No players yet — type a name to add one."
                : "Everyone is already picked."}
            </p>
          ) : null}
        </div>

        <div className="px-5 pt-3">
          <button
            type="button"
            onClick={onClear}
            className="flex h-11 w-full items-center justify-center rounded-tile bg-fill text-base font-semibold text-ink active:bg-hair"
          >
            Clear slot
          </button>
        </div>
      </div>
    </div>
  );
}
