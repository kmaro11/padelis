"use client";

import { useOptimistic, useTransition } from "react";

import { setRatedAction } from "@/app/actions/tournaments";
import { RatedCheckbox } from "@/components/create/steps";

/** Varnelę galima pataisyti ir po sukūrimo — reitingai persiskaičiuoja. */
export function RatedToggle({
  tournamentId,
  rated,
}: {
  tournamentId: string;
  rated: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(rated);
  const [, startTransition] = useTransition();

  return (
    <RatedCheckbox
      checked={optimistic}
      onChange={(value) =>
        startTransition(async () => {
          setOptimistic(value);
          await setRatedAction(tournamentId, value);
        })
      }
    />
  );
}
