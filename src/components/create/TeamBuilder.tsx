"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { cn } from "@/components/ui/cn";
import type { Player } from "@/lib/types";
import { PlayerPicker } from "./PlayerPicker";

/** Vienos komandos sudėtis create flow'e. */
export interface TeamSlots {
  player1Id: string | null;
  player2Id: string | null;
}

export function TeamBuilder({
  teams,
  players,
  onChange,
  onPlayerCreated,
}: {
  teams: TeamSlots[];
  players: Player[];
  onChange: (index: number, slots: TeamSlots) => void;
  onPlayerCreated: (player: Player) => void;
}) {
  /** kurio slot'o picker'is atidarytas */
  const [open, setOpen] = useState<{ team: number; slot: 1 | 2 } | null>(null);

  const byId = new Map(players.map((player) => [player.id, player]));

  const taken = new Set(
    teams.flatMap((team) =>
      [team.player1Id, team.player2Id].filter(
        (id): id is string => id !== null,
      ),
    ),
  );

  const pick = (player: Player | null) => {
    if (!open) return;
    const team = teams[open.team];
    onChange(open.team, {
      ...team,
      [open.slot === 1 ? "player1Id" : "player2Id"]: player?.id ?? null,
    });
    setOpen(null);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {teams.map((team, index) => (
          <div key={index} className="rounded-tile bg-fill p-3">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-label text-dim">
              Team {index + 1}
            </p>

            <div className="flex flex-col gap-2">
              <Slot
                player={team.player1Id ? byId.get(team.player1Id) : undefined}
                onClick={() => setOpen({ team: index, slot: 1 })}
              />
              <Slot
                player={team.player2Id ? byId.get(team.player2Id) : undefined}
                onClick={() => setOpen({ team: index, slot: 2 })}
              />
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <PlayerPicker
          players={players}
          taken={takenExcept(taken, teams[open.team], open.slot)}
          onSelect={pick}
          onClear={() => pick(null)}
          onClose={() => setOpen(null)}
          onPlayerCreated={onPlayerCreated}
        />
      ) : null}
    </>
  );
}

/** Redaguojamas slotas savo paties žaidėjo iš sąrašo neišmeta. */
function takenExcept(
  taken: Set<string>,
  team: TeamSlots,
  slot: 1 | 2,
): Set<string> {
  const own = slot === 1 ? team.player1Id : team.player2Id;
  if (!own) return taken;

  const rest = new Set(taken);
  rest.delete(own);
  return rest;
}

function Slot({
  player,
  onClick,
}: {
  player?: Player;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-field bg-white px-3 py-2.5 text-left",
        "active:bg-hair",
      )}
    >
      <UserPlus
        className={cn("size-4 shrink-0", player ? "text-gold" : "text-faint")}
      />
      <span
        className={cn(
          "flex-1 truncate text-base",
          player ? "text-ink" : "text-dim",
        )}
      >
        {player ? player.name : "Select player"}
      </span>
    </button>
  );
}
