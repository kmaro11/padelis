"use client";

import { Diamond } from "lucide-react";

import { Screen } from "@/components/layout/PhoneFrame";
import { TodayLabel } from "@/components/layout/TodayLabel";
import { LiveTournamentCard } from "@/components/tournament/LiveTournamentCard";
import { RecentTournamentRow } from "@/components/tournament/RecentTournamentRow";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenTitle, SubheadTitle } from "@/components/ui/SectionLabel";
import { StatRow } from "@/components/ui/StatTile";
import { useTournaments } from "@/lib/tournament-store";

export default function HomePage() {
  const { tournaments, upcoming, past, live, stats } = useTournaments();
  const highlighted = live ?? upcoming[0] ?? null;

  if (tournaments.length === 0) {
    return (
      <Screen>
        <ScreenTitle>Home</ScreenTitle>
        <EmptyState
          icon={Diamond}
          title="No tournaments yet"
          description="Pick a date, add your teams, choose a format. About thirty seconds."
        />
        <div className="pb-[22px]">
          <ButtonLink href="/create">Create your first tournament</ButtonLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <header>
        <TodayLabel />
        <div className="mt-2">
          <ScreenTitle>Home</ScreenTitle>
        </div>
      </header>

      {highlighted ? <LiveTournamentCard tournament={highlighted} /> : null}

      <ButtonLink href="/create">Create Tournament</ButtonLink>

      <StatRow
        stats={[
          { value: stats.tournaments, label: "Tournaments" },
          { value: stats.matches, label: "Matches" },
          { value: stats.teams, label: "Teams" },
        ]}
      />

      {past.length > 0 ? (
        <section className="pb-6">
          <SubheadTitle>Recent</SubheadTitle>
          <div className="flex flex-col">
            {past.slice(0, 3).map((tournament) => (
              <RecentTournamentRow
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </div>
        </section>
      ) : null}
    </Screen>
  );
}
