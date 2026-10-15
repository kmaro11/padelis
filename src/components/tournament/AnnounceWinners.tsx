"use client";

import { useState } from "react";
import { Check, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/Button";

/** Nukopijuoja galutinę klasifikaciją — įklijuoti į FB grupę. */
export function AnnounceWinners({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ink" onClick={copy}>
        {copied ? (
          <>
            <Check className="mr-2 size-5" strokeWidth={3} />
            Nukopijuota — įklijuok į FB
          </>
        ) : (
          <>
            <Megaphone className="mr-2 size-5" />
            Paskelbti laimėtojus
          </>
        )}
      </Button>
      {error ? (
        // be HTTPS ar leidimo naršyklė neleidžia rašyti į iškarpinę —
        // tada bent parodom tekstą, kad būtų galima pažymėti ranka
        <textarea
          readOnly
          value={text}
          rows={Math.min(14, text.split("\n").length)}
          onFocus={(event) => event.currentTarget.select()}
          className="rounded-tile bg-fill p-3 text-sm outline-none"
        />
      ) : null}
    </div>
  );
}
