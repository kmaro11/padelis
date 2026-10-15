"use client";

import { Check } from "lucide-react";

import {
  FORMAT_DESCRIPTION,
  FORMAT_LABEL,
  GROUPS_FINALS_TEAMS,
  type TournamentFormat,
} from "@/lib/types";
import { cn } from "../ui/cn";

export const TEAM_COUNTS = [4, 6, 8, 10, 12, 14, 16] as const;

export function TeamCountGrid({
  value,
  onChange,
}: {
  value: number;
  onChange: (count: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {TEAM_COUNTS.map((count) => {
        const selected = count === value;
        return (
          <button
            key={count}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(count)}
            className={cn(
              "flex h-[68px] flex-col items-center justify-center rounded-tile transition-colors duration-150 ease-ios",
              selected
                ? "bg-gold text-white shadow-gold"
                : "bg-fill text-ink active:bg-hair",
            )}
          >
            <span className="text-4xl font-bold tracking-display">{count}</span>
            <span
              className={cn(
                "mt-1 text-2xs",
                selected ? "text-white/70" : "text-dim",
              )}
            >
              teams
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const COURT_COUNTS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Kortų skaičius ir jų tikri pavadinimai — klube kortai dažnai sunumeruoti
 * ne nuo 1 (pvz. 10–13). Tuščias laukas = įprastas numeris.
 */
export function CourtPicker({
  count,
  names,
  onCountChange,
  onNamesChange,
}: {
  count: number;
  names: string[];
  onCountChange: (count: number) => void;
  onNamesChange: (names: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-md font-semibold tracking-snug">Courts</span>
      <div className="grid grid-cols-6 gap-2">
        {COURT_COUNTS.map((option) => {
          const selected = option === count;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onCountChange(option)}
              className={cn(
                "flex h-11 items-center justify-center rounded-field text-base font-semibold transition-colors duration-150 ease-ios",
                selected
                  ? "bg-gold text-white shadow-gold-sm"
                  : "bg-fill text-ink active:bg-hair",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <CourtNameInputs count={count} names={names} onChange={onNamesChange} />
    </div>
  );
}

/** Po laukelį kiekvienam kortui; placeholder'is — numeris pagal nutylėjimą. */
export function CourtNameInputs({
  count,
  names,
  onChange,
}: {
  count: number;
  names: string[];
  onChange: (names: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-dim">
        Court numbers at the club (optional)
      </span>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: count }, (_, index) => (
          <input
            key={index}
            value={names[index] ?? ""}
            maxLength={20}
            placeholder={`${index + 1}`}
            aria-label={`Court ${index + 1} name`}
            onChange={(event) =>
              onChange(
                Array.from({ length: count }, (_, position) =>
                  position === index
                    ? event.target.value
                    : (names[position] ?? ""),
                ),
              )
            }
            className="h-11 min-w-0 rounded-field bg-fill px-3 text-center text-base outline-none"
          />
        ))}
      </div>
    </div>
  );
}

/** Ar turnyras skaičiuojamas į žaidėjų reitingą. */
export function RatedCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3.5 rounded-card border p-[18px] text-left transition-colors duration-150 ease-ios",
        checked ? "border-gold bg-gold-soft" : "border-hair",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2",
          checked ? "border-gold bg-gold" : "border-hair",
        )}
      >
        {checked ? (
          <Check className="size-3 text-white" strokeWidth={3} />
        ) : null}
      </span>
      <span className="text-md font-semibold tracking-snug">
        Trečiadienio pasižaidimai su reitingais
      </span>
    </button>
  );
}

const FORMATS: TournamentFormat[] = [
  "round-robin",
  "placement",
  "final-four",
  "groups-finals",
];

export function FormatCards({
  value,
  onChange,
  teamCount,
}: {
  value: TournamentFormat;
  onChange: (format: TournamentFormat) => void;
  teamCount: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {FORMATS.map((format) => {
        const selected = format === value;
        const disabled =
          (format === "final-four" && teamCount < 4) ||
          // dvi grupės po keturias — kitokio komandų skaičiaus formatas nepriima
          (format === "groups-finals" && teamCount !== GROUPS_FINALS_TEAMS);

        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(format)}
            className={cn(
              "flex items-start gap-3.5 rounded-card border p-[18px] text-left transition-colors duration-150 ease-ios",
              selected ? "border-gold bg-gold-soft" : "border-hair",
              disabled && "opacity-40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-gold bg-gold" : "border-hair",
              )}
            >
              {selected ? (
                <Check className="size-3 text-white" strokeWidth={3} />
              ) : null}
            </span>
            <span className="flex-1">
              <span className="block text-md font-semibold tracking-snug">
                {FORMAT_LABEL[format]}
              </span>
              <span className="mt-1 block text-xs-plus leading-relaxed text-dim">
                {FORMAT_DESCRIPTION[format]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
