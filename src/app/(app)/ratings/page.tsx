import { Medal } from "lucide-react";

import { Screen } from "@/components/layout/AppShell";
import { RatingsTable } from "@/components/players/RatingsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { listRatings } from "@/db/queries";
import { BASE_RATING } from "@/lib/rating";

export const dynamic = "force-dynamic";

export default async function RatingsPage() {
  const rows = await listRatings();
  const played = rows.filter((row) => row.tournamentsPlayed > 0).length;

  return (
    <Screen>
      <header>
        <ScreenTitle>Reitingai</ScreenTitle>
        <p className="mt-[7px] text-sm text-dim">
          {played > 0
            ? `${played} žaidėjai · startinis reitingas ${BASE_RATING}`
            : `Startinis reitingas ${BASE_RATING}`}
        </p>
      </header>

      {played === 0 ? (
        <EmptyState
          icon={Medal}
          title="Reitingų dar nėra"
          description="Reitingai atsiranda užbaigus pirmą turnyrą, pažymėtą kaip reitinguojamą."
        />
      ) : (
        <RatingsTable rows={rows} />
      )}
    </Screen>
  );
}
