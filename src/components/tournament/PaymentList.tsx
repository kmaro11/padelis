"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { setPaidAction } from "@/app/actions/tournaments";
import { cn } from "@/components/ui/cn";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PayerRow } from "@/lib/types";

const key = (row: Pick<PayerRow, "teamId" | "slot">) =>
  `${row.teamId}:${row.slot}`;

/**
 * Mokesčių sąrašas: vardas ir varnelė, du stulpeliai — kad visi tilptų į
 * ekraną be slinkimo. Eilė ta pati kaip komandų, tad pora atsiduria vienoje
 * grid eilutėje. Varnelė persijungia iš karto (aikštelėje spaudžiama
 * greitai), o serveris pavejamas fone; jei įrašyti nepavyko — grąžinam.
 */
export function PaymentList({
  tournamentId,
  payers,
}: {
  tournamentId: string;
  payers: PayerRow[];
}) {
  const [paid, setPaid] = useState(
    () => new Set(payers.filter((row) => row.paid).map(key)),
  );
  const [, startTransition] = useTransition();

  const toggle = (row: PayerRow) => {
    const id = key(row);
    const next = !paid.has(id);

    setPaid((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

    startTransition(async () => {
      try {
        await setPaidAction(tournamentId, row.teamId, row.slot, next);
      } catch {
        setPaid((current) => {
          const copy = new Set(current);
          if (next) copy.delete(id);
          else copy.add(id);
          return copy;
        });
      }
    });
  };

  const owing = payers.length - paid.size;

  return (
    <>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-base font-semibold tracking-snug">
            {paid.size} / {payers.length} paid
          </span>
          <span className="text-xs text-dim">
            {owing > 0 ? `${owing} still owe` : "All settled"}
          </span>
        </div>
        <ProgressBar value={paid.size} total={payers.length} tone="on-light" />
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        {payers.map((row) => (
          <PayerLine
            key={key(row)}
            payer={row}
            paid={paid.has(key(row))}
            onToggle={() => toggle(row)}
          />
        ))}
      </div>
    </>
  );
}

function PayerLine({
  payer,
  paid,
  onToggle,
}: {
  payer: PayerRow;
  paid: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={paid}
      onClick={onToggle}
      className="flex w-full min-w-0 items-center gap-2.5 border-b border-hair py-2.5 text-left active:bg-fill"
    >
      <span
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-150 ease-ios",
          paid ? "border-gold bg-gold text-white" : "border-hair text-white",
        )}
      >
        <Check className="size-3" strokeWidth={3.5} />
      </span>
      <span className={cn("truncate text-sm", paid && "text-dim")}>
        {payer.name}
      </span>
    </button>
  );
}
