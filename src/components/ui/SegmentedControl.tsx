"use client";

import { cn } from "./cn";

export interface Segment<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex rounded-field bg-fill p-[3px]">
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              "flex h-8 flex-1 items-center justify-center rounded-seg text-sm transition-colors duration-150 ease-ios",
              active
                ? "bg-white font-semibold text-ink shadow-seg"
                : "text-dim",
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
