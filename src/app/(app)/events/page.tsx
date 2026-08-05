"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Screen } from "@/components/layout/PhoneFrame";
import { TournamentListItem } from "@/components/tournament/TournamentListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Fab } from "@/components/ui/Fab";
import { ScreenTitle, SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatMonth, monthKey } from "@/lib/date";
import { useTournaments } from "@/lib/tournament-store";
import type { Tournament } from "@/lib/types";

type Tab = "upcoming" | "past";

export default function EventsPage() {
  const { upcoming, past } = useTournaments();
  const [tab, setTab] = useState<Tab>("upcoming");

  const groups = useMemo(
    () => groupByMonth(tab === "upcoming" ? upcoming : past),
    [tab, upcoming, past],
  );

  return (
    <>
      <Screen>
        <ScreenTitle>Events</ScreenTitle>

        <SegmentedControl
          value={tab}
          onChange={setTab}
          segments={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />

        {groups.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={tab === "upcoming" ? "Nothing scheduled" : "No past events"}
            description={
              tab === "upcoming"
                ? "Pick a date, add your teams, choose a format. About thirty seconds."
                : "Finished tournaments will show up here."
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-[18px]">
              <SectionLabel>{group.label}</SectionLabel>
              <div className="flex flex-col gap-3">
                {group.tournaments.map((tournament) => (
                  <TournamentListItem
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        
      </Screen>

      <Fab href="/create" label="Create tournament" />
    </>
  );
}

interface MonthGroup {
  key: string;
  label: string;
  tournaments: Tournament[];
}

function groupByMonth(tournaments: Tournament[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const tournament of tournaments) {
    const key = monthKey(tournament.date);
    const group = groups.get(key) ?? {
      key,
      label: formatMonth(tournament.date),
      tournaments: [],
    };
    group.tournaments.push(tournament);
    groups.set(key, group);
  }

  return [...groups.values()];
}
