"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { deletePlayerAction, renamePlayerAction } from "@/app/actions/players";
import { cn } from "@/components/ui/cn";
import { initials } from "@/lib/tournament-view";
import type { Player } from "@/lib/types";
import { AddPlayerRow } from "./AddPlayerRow";

function byName(a: Player, b: Player): number {
  return a.name.localeCompare(b.name);
}

export function PlayerList({ players }: { players: Player[] }) {
  const [list, setList] = useState(players);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <AddPlayerRow
        onAdded={(player) =>
          setList((current) => [...current, player].sort(byName))
        }
      />

      {list.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          editing={editing === player.id}
          deleting={deleting === player.id}
          onEdit={() => {
            setDeleting(null);
            setEditing(player.id);
          }}
          onDone={() => setEditing(null)}
          onRenamed={(name) =>
            setList((current) =>
              current
                .map((item) =>
                  item.id === player.id ? { ...item, name } : item,
                )
                .sort(byName),
            )
          }
          onDeletePrompt={() => {
            setEditing(null);
            setDeleting(player.id);
          }}
          onDeleteCancel={() => setDeleting(null)}
          onDeleted={() =>
            setList((current) => current.filter((item) => item.id !== player.id))
          }
        />
      ))}
    </div>
  );
}

function PlayerRow({
  player,
  editing,
  deleting,
  onEdit,
  onDone,
  onRenamed,
  onDeletePrompt,
  onDeleteCancel,
  onDeleted,
}: {
  player: Player;
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDone: () => void;
  onRenamed: (name: string) => void;
  onDeletePrompt: () => void;
  onDeleteCancel: () => void;
  onDeleted: () => void;
}) {
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
          <span className="flex-1 text-base font-medium">{player.name}</span>
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
