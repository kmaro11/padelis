/** Parses an ISO yyyy-mm-dd string as a local calendar date. */
export function parseDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "Saturday, 8 August" */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** "August" / "September" — used as list group headings. */
export function formatMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long" }).format(
    parseDate(iso),
  );
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** { day: "8", weekday: "SAT" } for the square date badge. */
export function dateBadgeParts(iso: string): { day: string; caption: string } {
  const date = parseDate(iso);
  return {
    day: `${date.getDate()}`,
    caption: new Intl.DateTimeFormat("en-GB", { weekday: "short" })
      .format(date)
      .toUpperCase(),
  };
}

/** { day: "26", caption: "JUL" } for the recent-list badge. */
export function dateBadgeMonthParts(iso: string): {
  day: string;
  caption: string;
} {
  const date = parseDate(iso);
  return {
    day: `${date.getDate()}`,
    caption: new Intl.DateTimeFormat("en-GB", { month: "short" })
      .format(date)
      .toUpperCase(),
  };
}

export function isPast(iso: string, today = new Date()): boolean {
  return parseDate(iso).getTime() < new Date(toISODate(today)).getTime();
}
