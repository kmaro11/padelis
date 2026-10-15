import Link from "next/link";
import { notFound } from "next/navigation";
import { Handshake, Skull, Swords, Trophy, type LucideIcon } from "lucide-react";

import { Screen } from "@/components/layout/AppShell";
import { BackLink } from "@/components/tournament/BackLink";
import { RatedBadge } from "@/components/tournament/RatedBadge";
import { cn } from "@/components/ui/cn";
import { DateBadge } from "@/components/ui/DateBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatRow } from "@/components/ui/StatTile";
import { getPlayerProfile, listRatings } from "@/db/queries";
import { dateBadgeMonthParts } from "@/lib/date";
import {
  bestPartners,
  favouriteOpponents,
  headToHead,
  MIN_MATCHES_FOR_HIGHLIGHT,
  toughestOpponents,
  winRate,
  type PersonRecord,
} from "@/lib/player-stats";
import { MIN_TOURNAMENTS_PUBLIC } from "@/lib/rating";
import { computeFinalPlacings, isPlayed, winnerId } from "@/lib/standings";
import { initials, playerNames } from "@/lib/tournament-view";
import type { Tournament } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
  searchParams,
}: PageProps<"/players/[id]">) {
  const { id } = await params;
  const { from } = await searchParams;
  const [profile, ratings] = await Promise.all([
    getPlayerProfile(id),
    listRatings(),
  ]);
  if (!profile) notFound();

  const { player } = profile;
  const rating = ratings.find((row) => row.player.id === id);
  // ta pati tvarka kaip Reitingų lentelėje — listRatings jau surikiuota
  const rank = rating?.ranked
    ? ratings.filter((row) => row.ranked).indexOf(rating) + 1
    : null;

  const history = profile.tournaments.map((tournament) =>
    summarizeFor(tournament, player.id, player.name),
  );
  const wins = history.reduce((total, item) => total + item.wins, 0);
  const losses = history.reduce((total, item) => total + item.losses, 0);
  const titles = history.filter((item) => item.position === 1).length;
  const podiums = history.filter(
    (item) => item.position !== null && item.position <= 3,
  ).length;

  const nameById = new Map(
    ratings.map((row) => [row.player.id, row.player.name]),
  );
  const { partners, opponents } = headToHead(
    profile.tournaments,
    player.id,
    nameById,
  );
  const highlights = [
    { icon: Handshake, label: "Geriausi partneriai", records: bestPartners(partners) },
    { icon: Swords, label: "Dažniausiai įveikia", records: favouriteOpponents(opponents) },
    { icon: Skull, label: "Sunkiausi varžovai", records: toughestOpponents(opponents) },
  ].filter((item) => item.records.length > 0);

  const fromRatings = from === "ratings";
  const back = fromRatings ? "ratings" : "players";

  return (
    <Screen>
      <BackLink href={fromRatings ? "/ratings" : "/players"}>
        {fromRatings ? "Reitingai" : "Players"}
      </BackLink>

      <header className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-fill text-xl font-semibold text-dim">
          {initials(player.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[30px] font-bold leading-[1.1] tracking-display">
            {player.name}
          </h1>
          <p className="mt-1.5 text-sm text-dim">
            {rating && rating.tournamentsPlayed > 0 ? (
              <>
                Reitingas{" "}
                <span className="font-semibold text-ink">{rating.rating}</span>
                {rank
                  ? ` · ${rank} vieta`
                  : ` · lentelėje nuo ${MIN_TOURNAMENTS_PUBLIC} turnyrų`}
              </>
            ) : (
              "Reitinguojamų turnyrų dar nežaidė"
            )}
          </p>
        </div>
      </header>

      <StatRow
        stats={[
          { value: history.length, label: "Turnyrai" },
          { value: wins, label: "Pergalės" },
          { value: losses, label: "Pralaimėjimai" },
        ]}
      />
      <StatRow
        stats={[
          { value: titles, label: "1 vietos" },
          { value: podiums, label: "Podiumai" },
          {
            value: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
            label: "Pergalių %",
          },
        ]}
      />

      {highlights.length > 0 ? (
        <section className="flex flex-col gap-2">
          {highlights.map((item) => (
            <Highlight key={item.label} {...item} back={back} />
          ))}
        </section>
      ) : partners.length + opponents.length > 0 ? (
        <p className="text-xs text-dim text-pretty">
          Partneriai ir varžovai išryškinami nuo {MIN_MATCHES_FOR_HIGHLIGHT}{" "}
          mačų kartu ar prieš.
        </p>
      ) : null}

      {partners.length > 0 ? (
        <PeopleList title="Partneriai" records={partners} back={back} />
      ) : null}

      {opponents.length > 0 ? (
        <PeopleList
          title="Varžovai"
          records={opponents.slice(0, 10)}
          back={back}
        />
      ) : null}

      {history.length > 0 ? (
        <section>
          <SectionLabel className="mb-1">Turnyrai</SectionLabel>
          <div className="flex flex-col">
            {history.map((item) => {
              const entry = profile.entries.get(item.tournament.id);
              return (
                <TournamentRow
                  key={item.tournament.id}
                  item={item}
                  change={entry ? entry.ratingEnd - entry.ratingStart : null}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </Screen>
  );
}

function Highlight({
  icon: Icon,
  label,
  records,
  back,
}: {
  icon: LucideIcon;
  label: string;
  records: PersonRecord[];
  back: string;
}) {
  return (
    <div className="rounded-tile bg-fill px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[10px] bg-white text-gold">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <span className="text-2xs font-semibold uppercase tracking-badge text-dim">
          {label}
        </span>
      </div>

      <div className="mt-2 flex flex-col">
        {records.map((record, index) => {
          const content = (
            <>
              <span className="w-4 shrink-0 text-sm font-bold text-gold">
                {index + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate tracking-snug",
                  index === 0 ? "text-base font-semibold" : "text-sm font-medium",
                )}
              >
                {record.name}
              </span>
              <WinLoss record={record} />
            </>
          );
          const className = cn(
            "flex items-center gap-2.5 py-1.5",
            index > 0 && "border-t border-hair",
          );

          return record.playerId ? (
            <Link
              key={record.key}
              href={`/players/${record.playerId}?from=${back}`}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <div key={record.key} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PeopleList({
  title,
  records,
  back,
}: {
  title: string;
  records: PersonRecord[];
  back: string;
}) {
  return (
    <section>
      <SectionLabel className="mb-1">{title}</SectionLabel>
      <div className="flex flex-col">
        {records.map((record) => {
          const content = (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill text-xs font-semibold text-dim">
                {initials(record.name)}
              </span>
              <span className="min-w-0 flex-1 truncate text-base font-medium">
                {record.name}
              </span>
              <WinLoss record={record} />
            </>
          );
          const className =
            "flex items-center gap-3 border-b border-hair py-2.5";

          return record.playerId ? (
            <Link
              key={record.key}
              href={`/players/${record.playerId}?from=${back}`}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <div key={record.key} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** "5–2 · 71%" */
function WinLoss({ record }: { record: PersonRecord }) {
  const rate = Math.round(winRate(record) * 100);

  return (
    <span className="flex shrink-0 flex-col items-end">
      <span className="text-sm font-semibold tabular-nums">
        {record.wins}–{record.losses}
      </span>
      <span
        className={cn(
          "mt-0.5 text-2xs tabular-nums",
          rate >= 50 ? "text-emerald-600" : "text-red-600",
        )}
      >
        {rate}%
      </span>
    </span>
  );
}

interface TournamentSummary {
  tournament: Tournament;
  partner: string | null;
  wins: number;
  losses: number;
  /** null — turnyras dar vyksta */
  position: number | null;
}

function summarizeFor(
  tournament: Tournament,
  playerId: string,
  playerName: string,
): TournamentSummary {
  const team = tournament.teams.find(
    (item) => item.player1Id === playerId || item.player2Id === playerId,
  );
  if (!team) {
    return { tournament, partner: null, wins: 0, losses: 0, position: null };
  }

  // pora saugoma kaip "Jonas / Petras" — partneris yra tas, kuris ne jis
  const partner =
    playerNames(team.name).find((name) => name !== playerName) ?? null;

  let wins = 0;
  let losses = 0;
  for (const match of tournament.matches) {
    if (!isPlayed(match)) continue;
    if (match.homeTeamId !== team.id && match.awayTeamId !== team.id) continue;
    if (winnerId(match) === team.id) wins += 1;
    else losses += 1;
  }

  const placing =
    tournament.status === "completed"
      ? computeFinalPlacings(tournament.teams, tournament.matches).placings.find(
          (item) => item.team.id === team.id,
        )
      : undefined;

  return {
    tournament,
    partner,
    wins,
    losses,
    position: placing?.position ?? null,
  };
}

function TournamentRow({
  item,
  change,
}: {
  item: TournamentSummary;
  change: number | null;
}) {
  const { tournament, partner, wins, losses, position } = item;
  const { day, caption } = dateBadgeMonthParts(tournament.date);

  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="flex items-center gap-3.5 border-b border-hair py-[13px]"
    >
      <DateBadge day={day} caption={caption} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-base font-medium">
            {tournament.name}
          </span>
          <RatedBadge rated={tournament.rated} />
        </p>
        <p className="mt-0.5 truncate text-xs text-dim">
          {partner ? `su ${partner} · ` : ""}
          {wins}–{losses}
        </p>
      </div>
      <span className="flex shrink-0 flex-col items-end">
        {position !== null ? (
          <span
            className={cn(
              "flex items-center gap-1 text-base font-semibold",
              position <= 3 ? "text-gold" : "text-ink",
            )}
          >
            {position === 1 ? <Trophy className="size-3.5" /> : null}
            {position} vieta
          </span>
        ) : (
          <span className="text-xs text-dim">Vyksta</span>
        )}
        {change !== null && change !== 0 ? (
          <span
            className={cn(
              "mt-0.5 text-xs tabular-nums",
              change > 0 ? "text-emerald-600" : "text-red-600",
            )}
          >
            {change > 0 ? "+" : "−"}
            {Math.abs(change)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
