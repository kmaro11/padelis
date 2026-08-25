"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { deletePlayerAction, renamePlayerAction } from "@/app/actions/players";
import { cn } from "@/components/ui/cn";
import { initials } from "@/lib/tournament-view";
import type { Player, RatingRow } from "@/lib/types";
import { AddPlayerRow } from "./AddPlayerRow";

/** Reitingas mažėjančiai, o susilyginus — pagal vardą. */
function byRating(a: RatingRow, b: RatingRow): number {
  return b.rating - a.rating || a.player.name.localeCompare(b.player.name);
}

/** Naujai pridėtas žaidėjas — 1000, dar be turnyrų (§7). */
function freshRow(player: Player): RatingRow {
  return {
    player,
    rating: 1000,
    tournamentsPlayed: 0,
    lastPlayedAt: null,
    stale: false,
    lastChange: null,
    ranked: false,
  };
}

export function PlayerList({ players }: { players: RatingRow[] }) {
  const [list, setList] = useState(players);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <AddPlayerRow
        onAdded={(player) =>
          setList((current) => [...current, freshRow(player)].sort(byRating))
        }
      />

      {list.map((row, index) => (
        <PlayerRow
          key={row.player.id}
          row={row}
          rank={row.ranked ? index + 1 : null}
          editing={editing === row.player.id}
          deleting={deleting === row.player.id}
          onEdit={() => {
            setDeleting(null);
            setEditing(row.player.id);
          }}
          onDone={() => setEditing(null)}
          onRenamed={(name) =>
            setList((current) =>
              current
                .map((item) =>
                  item.player.id === row.player.id
                    ? { ...item, player: { ...item.player, name } }
                    : item,
                )
                .sort(byRating),
            )
          }
          onDeletePrompt={() => {
            setEditing(null);
            setDeleting(row.player.id);
          }}
          onDeleteCancel={() => setDeleting(null)}
          onDeleted={() =>
            setList((current) =>
              current.filter((item) => item.player.id !== row.player.id),
            )
          }
        />
      ))}
    </div>
  );
}

function PlayerRow({
  row,
  rank,
  editing,
  deleting,
  onEdit,
  onDone,
  onRenamed,
  onDeletePrompt,
  onDeleteCancel,
  onDeleted,
}: {
  row: RatingRow;
  rank: number | null;
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDone: () => void;
  onRenamed: (name: string) => void;
  onDeletePrompt: () => void;
  onDeleteCancel: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(row.player.name);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const clean = name.trim();
    if (clean.length === 0 || clean === row.player.name) {
      setName(row.player.name);
      onDone();
      return;
    }

    startTransition(async () => {
      await renamePlayerAction(row.player.id, clean);
      onRenamed(clean);
      onDone();
    });
  };

  const remove = () => {
    startTransition(async () => {
      await deletePlayerAction(row.player.id);
      onDeleted();
    });
  };

  return (
    <div className="flex items-center gap-3.5 border-b border-hair py-3.5">
      <span className="w-5 shrink-0 text-center text-sm font-bold text-gold">
        {rank ?? <span className="text-faint">–</span>}
      </span>

      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fill text-sm font-semibold text-dim">
        {initials(editing ? name : row.player.name)}
      </span>

      {editing ? (
        <>
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
              if (event.key === "Escape") {
                setName(row.player.name);
                onDone();
              }
            }}
            className="flex-1 rounded-field bg-fill px-3 py-2 text-base outline-none"
          />
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setName(row.player.name);
              onDone();
            }}
            className="flex size-9 items-center justify-center rounded-full text-glyph active:bg-fill"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Save name"
            onClick={save}
            disabled={pending}
            className={cn(
              "flex size-9 items-center justify-center rounded-full bg-gold text-white",
              pending && "opacity-50",
            )}
          >
            <Check className="size-4" strokeWidth={3} />
          </button>
        </>
      ) : deleting ? (
        <>
          <span className="flex-1 text-base text-dim">
            Remove {row.player.name}?
          </span>
          <button
            type="button"
            aria-label="Cancel delete"
            onClick={onDeleteCancel}
            className="flex size-9 items-center justify-center rounded-full text-glyph active:bg-fill"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Confirm delete ${row.player.name}`}
            onClick={remove}
            disabled={pending}
            className={cn(
              "flex size-9 items-center justify-center rounded-full bg-red-700 text-white",
              pending && "opacity-50",
            )}
          >
            <Check className="size-4" strokeWidth={3} />
          </button>
        </>
      ) : (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={cn(
                "truncate text-base font-medium",
                row.stale && "text-dim",
              )}
            >
              {row.player.name}
            </span>
            <span className="mt-0.5 text-xs text-dim">
              {row.tournamentsPlayed === 0
                ? "Dar nežaidė"
                : `${row.tournamentsPlayed} ${row.tournamentsPlayed === 1 ? "turnyras" : "turnyrai"}`}
              {row.ranked ? null : row.tournamentsPlayed > 0 ? " · nereitinguojamas" : null}
              {row.stale ? " · pasenęs" : null}
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
          <button
            type="button"
            aria-label={`Rename ${row.player.name}`}
            onClick={onEdit}
            className="flex size-9 items-center justify-center rounded-full text-faint active:bg-fill"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${row.player.name}`}
            onClick={onDeletePrompt}
            className="flex size-9 items-center justify-center rounded-full text-faint active:bg-fill"
          >
            <Trash2 className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
