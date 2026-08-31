import { notFound } from "next/navigation";

import { Screen } from "@/components/layout/AppShell";
import { BackLink } from "@/components/tournament/BackLink";
import { PaymentList } from "@/components/tournament/PaymentList";
import { getTournament, listPayers } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  params,
}: PageProps<"/tournament/[id]/payments">) {
  const { id } = await params;
  const [tournament, payers] = await Promise.all([
    getTournament(id),
    listPayers(id),
  ]);
  if (!tournament) notFound();

  return (
    <Screen>
      <BackLink href={`/tournament/${id}`}>Tournament</BackLink>

      <header>
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-display">
          Payments
        </h1>
        <p className="mt-[7px] text-sm text-dim">
          Tap a name when the money is in
        </p>
      </header>

      <PaymentList tournamentId={tournament.id} payers={payers} />
    </Screen>
  );
}
