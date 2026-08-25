import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GitFork,
  ListChecks,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Screen } from "@/components/layout/AppShell";
import { DeleteTournament } from "@/components/tournament/DeleteTournament";
import { RatedBadge } from "@/components/tournament/RatedBadge";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getTournament } from "@/db/queries";
import { formatLongDate, parseDate } from "@/lib/date";
import { nextMatch, summarize } from "@/lib/tournament-view";
import { FORMAT_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TournamentPage({ params }: PageProps<"/tournament/[id]">) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const summary = summarize(tournament);
  const next = nextMatch(tournament);

  return (
    <Screen>
      <header>
        <SectionLabel className="text-gold">
          {formatLongDate(parseDate(tournament.date))}
        </SectionLabel>
        <h1 className="mt-2 text-5xl font-bold tracking-display">
          {tournament.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-[14px] text-dim">
            {FORMAT_LABEL[tournament.format]} · {tournament.teams.length} teams
          </p>
          <RatedBadge rated={tournament.rated} />
        </div>
      </header>

      <section className="rounded-[24px] bg-fill p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-dim">Round Robin</span>
          <span className="text-base font-semibold tracking-snug">
            {summary.roundRobin.played} / {summary.roundRobin.total} matches
          </span>
        </div>
        <div className="mt-3.5">
          <ProgressBar
            value={summary.roundRobin.played}
            total={summary.roundRobin.total}
            tone="on-light"
          />
        </div>
        <p className="mt-3 text-xs text-dim">{summary.phaseNote}</p>
      </section>

      <nav className="grid grid-cols-2 gap-3">
        <ActionCard
          href={`/tournament/${tournament.id}/matches`}
          icon={ListChecks}
          title="Matches"
          caption={
            summary.toPlay > 0 ? `${summary.toPlay} to play` : "All played"
          }
          highlighted={summary.toPlay > 0}
        />
        <ActionCard
          href={`/tournament/${tournament.id}/standings`}
          icon={Trophy}
          title="Standings"
          caption={summary.bracketUnlocked ? "Final" : "Live"}
        />
        <ActionCard
          href={`/tournament/${tournament.id}/bracket`}
          icon={GitFork}
          title="Bracket"
          caption={
            !summary.hasBracket
              ? "Not used"
              : summary.bracketUnlocked
                ? "Open"
                : "Locked"
          }
          disabled={!summary.hasBracket || !summary.bracketUnlocked}
        />
        <ActionCard
          href={`/tournament/${tournament.id}/teams`}
          icon={Users}
          title="Teams"
          caption={`${tournament.teams.length} entered`}
        />
      </nav>

      {next ? (
        <ButtonLink
          href={`/tournament/${tournament.id}/matches`}
          variant="ink"
          className="mt-auto"
        >
          Enter next result
        </ButtonLink>
      ) : null}

      <div className={next ? "pb-2" : "mt-auto pb-2"}>
        <DeleteTournament
          tournamentId={tournament.id}
          name={tournament.name}
        />
      </div>
    </Screen>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  caption,
  highlighted = false,
  disabled = false,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  caption: string;
  highlighted?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          "flex size-[34px] items-center justify-center rounded-[11px]",
          highlighted ? "bg-gold text-white" : "bg-fill text-glyph",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <span>
        <span className="block text-md font-semibold tracking-snug">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-dim">{caption}</span>
      </span>
    </>
  );

  const className = cn(
    "flex h-28 flex-col justify-between rounded-card border border-hair p-[18px]",
    disabled && "opacity-40",
  );

  if (disabled) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
