import { Screen } from "@/components/layout/AppShell";
import { TournamentGroups } from "@/components/tournament/TournamentGroups";
import { Fab } from "@/components/ui/Fab";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { getOverview } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { upcoming, past } = await getOverview();

  return (
    <>
      <Screen>
        <ScreenTitle>Events</ScreenTitle>
        <TournamentGroups upcoming={upcoming} past={past} />
      </Screen>

      <Fab href="/create" label="Create tournament" />
    </>
  );
}
