import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";

import { Screen } from "@/components/layout/PhoneFrame";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { getOverview } from "@/db/queries";

export const dynamic = "force-dynamic";

/** Tab'as be konkretaus turnyro — vedam į vykstantį arba artimiausią. */
export default async function TournamentTabPage() {
  const { highlighted } = await getOverview();

  if (highlighted) {
    redirect(`/tournament/${highlighted.id}`);
  }

  return (
    <Screen>
      <ScreenTitle>Tournament</ScreenTitle>
      <EmptyState
        icon={Trophy}
        title="Nothing running"
        description="Create a tournament and it will show up here while it is being played."
      />
      <div className="pb-[22px]">
        <ButtonLink href="/create">Create Tournament</ButtonLink>
      </div>
    </Screen>
  );
}
