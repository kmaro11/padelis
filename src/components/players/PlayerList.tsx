"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { deletePlayerAction, renamePlayerAction } from "@/app/actions/players";
import { cn } from "@/components/ui/cn";
import { initials } from "@/lib/tournament-view";
import type { Player, RatingRow } from "@/lib/types";
import { AddPlayerSheet } from "./AddPlayerSheet";

function byName(a: RatingRow, b: RatingRow): number {
  return a.player.name.localeCompare(b.player.name);
}

/** 1 turnyras · 2–9 turnyrai · 10–20, 0 turnyrų */
function tournamentWord(count: number): string {
  const last = count % 10;
  const teens = count % 100 >= 11 && count % 100 <= 19;

  if (teens || last === 0) return "turnyrų";
  if (last === 1) return "turnyras";
  return "turnyrai";
}

const SHORT_DATE = new Intl.DateTimeFormat("lt-LT", {
  day: "numeric",
  month: "short",
});

/** Naujai pridėtas žaidėjas — dar be turnyrų. */
function freshRow(player: Player): RatingRow {
  return {
    player,
    rating: 1000,
    tournamentsPlayed: 0,
    lastPlayedAt: null,
    stale: false,
    lastChange: null,
    movement: null,
    ranked: false,
  };
}

/**
 * Vardų sąrašas su aktyvumu — kiek turnyrų sužaidė ir kada paskutinį kartą.
 * Reitingai lieka atskirame Reitingų ekrane.
 */
export function PlayerList({ players }: { players: RatingRow[] }) {
  const [list, setList] = useState(() => [...players].sort(byName));
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const clean = query.trim();
  const visible = useMemo(() => {
    if (clean.length === 0) return list;
    const needle = clean.toLocaleLowerCase("lt");
    return list.filter((row) =>
      row.player.name.toLocaleLowerCase("lt").includes(needle),
    );
  }, [list, clean]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 pb-2">
        <span className="flex flex-1 items-center gap-2 rounded-field bg-fill px-3">
          <Search className="size-4 shrink-0 text-faint" />
          <input
            type="search"
            value={query}
            maxLength={60}
            placeholder="Search players"
            aria-label="Search players"
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent py-2.5 text-base outline-none placeholder:text-dim"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="text-faint"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </span>
        <button
          type="button"
          aria-label="Add player"
          onClick={() => setAdding(true)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-white shadow-gold active:bg-gold-hover"
        >
          <Plus className="size-5" strokeWidth={3} />
        </button>
      </div>

      {visible.length === 0 && clean.length > 0 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-3.5 border-b border-hair py-3.5 text-left"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
            <Plus className="size-4" strokeWidth={3} />
          </span>
          <span className="text-base">Add “{clean}”</span>
        </button>
      ) : null}

      {adding ? (
        <AddPlayerSheet
          initialName={visible.length === 0 ? clean : ""}
          existing={list.map((row) => row.player)}
          onAdded={(player) => {
            setList((current) => [...current, freshRow(player)].sort(byName));
            setQuery("");
          }}
          onClose={() => setAdding(false)}
        />
      ) : null}

      {visible.map((row) => (
        <PlayerRow
          key={row.player.id}
          row={row}
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
                .sort(byName),
            )
          }
          onDeletePrompt={() => {
            setEditing(null);
            setDeleting(row.player.id);
          }}
          onDeleteCancel={() => setDeleting(null)}
          onDeleted={() =>
            setList((current) => current.filter((item) => item.player.id !== row.player.id))
          }
        />
      ))}
    </div>
  );
}

function PlayerRow({
  row,
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
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDone: () => void;
  onRenamed: (name: string) => void;
  onDeletePrompt: () => void;
  onDeleteCancel: () => void;
  onDeleted: () => void;
}) {
  const player = row.player;
  const [name, setName] = useState(player.name);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const clean = name.trim();
    if (clean.length === 0 || clean === player.name) {
      setName(player.name);
      onDone();
      return;
    }

    startTransition(async () => {
      await renamePlayerAction(player.id, clean);
      onRenamed(clean);
      onDone();
    });
  };

  const remove = () => {
    startTransition(async () => {
      await deletePlayerAction(player.id);
      onDeleted();
    });
  };

  return (
    <div className="flex items-center gap-3.5 border-b border-hair py-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fill text-sm font-semibold text-dim">
        {initials(editing ? name : player.name)}
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
                setName(player.name);
                onDone();
              }
            }}
            className="flex-1 rounded-field bg-fill px-3 py-2 text-base outline-none"
          />
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setName(player.name);
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
            Remove {player.name}?
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
            aria-label={`Confirm delete ${player.name}`}
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
          <Link
            href={`/players/${player.id}`}
            className="flex min-w-0 flex-1 flex-col"
          >
            <span className="truncate text-base font-medium">
              {player.name}
            </span>
            <span className="mt-0.5 truncate text-xs text-dim">
              {row.tournamentsPlayed === 0
                ? "Dar nežaidė"
                : `${row.tournamentsPlayed} ${tournamentWord(row.tournamentsPlayed)}`}
              {row.lastPlayedAt
                ? ` · ${SHORT_DATE.format(new Date(`${row.lastPlayedAt}T00:00:00`))}`
                : null}
            </span>
          </Link>
          <button
            type="button"
            aria-label={`Rename ${player.name}`}
            onClick={onEdit}
            className="flex size-9 items-center justify-center rounded-full text-faint active:bg-fill"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${player.name}`}
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
