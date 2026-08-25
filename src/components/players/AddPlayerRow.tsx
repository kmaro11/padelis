"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { createPlayerAction } from "@/app/actions/players";
import { cn } from "@/components/ui/cn";
import type { Player } from "@/lib/types";

export function AddPlayerRow({
  onAdded,
}: {
  onAdded: (player: Player) => void;
}) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const clean = name.trim();
    if (clean.length === 0 || pending) return;

    startTransition(async () => {
      const player = await createPlayerAction(clean);
      onAdded(player);
      setName("");
    });
  };

  return (
    <div className="flex items-center gap-3.5 border-b border-hair py-3.5">
      <input
        value={name}
        maxLength={60}
        placeholder="Player name"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        className="flex-1 rounded-field bg-fill px-3 py-2 text-base outline-none placeholder:text-dim"
      />
      <button
        type="button"
        aria-label="Add player"
        onClick={submit}
        disabled={pending || name.trim().length === 0}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-white",
          (pending || name.trim().length === 0) && "opacity-50",
        )}
      >
        <Plus className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
}
