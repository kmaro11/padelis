"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { toISODate } from "@/lib/date";
import { cn } from "../ui/cn";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Calendar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => startOfMonth(today));

  const days = monthGrid(cursor);
  const todayIso = toISODate(today);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="flex size-9 items-center justify-center rounded-full text-glyph active:bg-fill"
        >
          <ChevronLeft className="size-5" />
        </button>

        <span className="text-md font-semibold tracking-snug">
          {new Intl.DateTimeFormat("en-GB", {
            month: "long",
            year: "numeric",
          }).format(cursor)}
        </span>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="flex size-9 items-center justify-center rounded-full text-glyph active:bg-fill"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="flex h-7 items-center justify-center text-2xs font-semibold text-dim"
          >
            {label}
          </span>
        ))}

        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;

          const iso = toISODate(day);
          const selected = iso === value;
          const isToday = iso === todayIso;
          const past = day < today;

          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              aria-pressed={selected}
              onClick={() => onChange(iso)}
              className={cn(
                "flex h-11 items-center justify-center rounded-field text-base transition-colors duration-150 ease-ios",
                selected && "bg-gold font-semibold text-white shadow-gold-sm",
                !selected && isToday && "font-semibold text-gold",
                !selected && !isToday && !past && "text-ink active:bg-fill",
                past && "text-faint",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Grid'as prasideda pirmadieniu; tušti langeliai — null. */
function monthGrid(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const total = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();

  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from(
      { length: total },
      (_, index) =>
        new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
}
