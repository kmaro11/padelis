import { notFound } from "next/navigation";

import { Screen } from "@/components/layout/PhoneFrame";
import { BackLink } from "@/components/tournament/BackLink";
import { MatchList } from "@/components/tournament/MatchList";
import { getSettings, getTournament } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  params,
}: PageProps<"/tournament/[id]/matches">) {
  const { id } = await params;
  const [tournament, settings] = await Promise.all([
    getTournament(id),
    getSettings(),
  ]);
  if (!tournament) notFound();

  return (
    <Screen>
      <BackLink href={`/tournament/${id}`}>Tournament</BackLink>
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-display">
        Matches
      </h1>
      <MatchList
        tournament={tournament}
        confirmBeforeSave={settings.confirmBeforeSave}
      />
    </Screen>
  );
}
