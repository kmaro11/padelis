"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";

import { renameTeamAction } from "@/app/actions/tournaments";
import { cn } from "@/components/ui/cn";
import { TeamName } from "./TeamName";
import { initials } from "@/lib/tournament-view";
import type { StandingRow, Team } from "@/lib/types";

export function TeamList({
  tournamentId,
  teams,
  records,
}: {
  tournamentId: string;
  teams: Team[];
  records: Record<string, Pick<StandingRow, "wins" | "losses">>;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      {teams.map((team) => (
        <TeamRow
          key={team.id}
          tournamentId={tournamentId}
          team={team}
          record={records[team.id]}
          editing={editing === team.id}
          onEdit={() => setEditing(team.id)}
          onDone={() => setEditing(null)}
        />
      ))}
    </div>
  );
}

function TeamRow({
  tournamentId,
  team,
  record,
  editing,
  onEdit,
  onDone,
}: {
  tournamentId: string;
  team: Team;
  record?: Pick<StandingRow, "wins" | "losses">;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const clean = name.trim();
    if (clean.length === 0 || clean === team.name) {
      setName(team.name);
      onDone();
      return;
    }

    startTransition(async () => {
      await renameTeamAction(tournamentId, team.id, clean);
      onDone();
    });
  };

  return (
    <div className="flex items-center gap-3.5 border-b border-hair py-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fill text-sm font-semibold text-dim">
        {initials(editing ? name : team.name)}
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
                setName(team.name);
                onDone();
              }
            }}
            className="flex-1 rounded-field bg-fill px-3 py-2 text-base outline-none"
          />
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setName(team.name);
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
      ) : (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <TeamName name={team.name} className="text-base font-medium" />
            <span className="mt-0.5 text-xs text-dim">
              {record ? `${record.wins}W · ${record.losses}L` : "No matches"}
            </span>
          </span>
          <button
            type="button"
            aria-label={`Rename ${team.name}`}
            onClick={onEdit}
            className="flex size-9 items-center justify-center rounded-full text-faint active:bg-fill"
          >
            <Pencil className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
