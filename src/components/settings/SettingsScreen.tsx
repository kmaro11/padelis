"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteAllDataAction,
  updateSettingsAction,
} from "@/app/actions/tournaments";
import { Screen } from "@/components/layout/AppShell";
import { ScreenTitle } from "@/components/ui/SectionLabel";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/components/ui/cn";
import type { Settings } from "@/db/queries";
import { FORMAT_LABEL, type TournamentFormat } from "@/lib/types";
import {
  SettingsButtonRow,
  SettingsGroup,
  SettingsLinkRow,
  SettingsRow,
} from "./SettingsRows";

const FORMATS: TournamentFormat[] = ["round-robin", "placement", "final-four"];
const TEAM_COUNTS = [4, 6, 8, 10, 12, 14, 16];
const COURT_COUNTS = [1, 2, 3, 4, 5, 6];

export function SettingsScreen({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [sheet, setSheet] = useState<"format" | "teams" | "courts" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  /** Optimistinis atnaujinimas — jungiklis neturi laukti tinklo. */
  const patch = (change: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...change }));
    startTransition(async () => {
      await updateSettingsAction(change);
    });
  };

  return (
    <>
      <Screen tone="grouped">
        <ScreenTitle>Settings</ScreenTitle>

        <SettingsGroup>
          <SettingsButtonRow
            label="Default format"
            value={FORMAT_LABEL[settings.defaultFormat]}
            onClick={() => setSheet("format")}
          />
          <SettingsButtonRow
            label="Default teams"
            value={`${settings.defaultTeams}`}
            onClick={() => setSheet("teams")}
          />
          <SettingsButtonRow
            label="Courts"
            value={`${settings.courts}`}
            onClick={() => setSheet("courts")}
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow label="Haptics">
            <Switch
              label="Haptics"
              checked={settings.haptics}
              onChange={(value) => patch({ haptics: value })}
            />
          </SettingsRow>
          <SettingsRow label="Keep screen awake">
            <Switch
              label="Keep screen awake"
              checked={settings.keepAwake}
              onChange={(value) => patch({ keepAwake: value })}
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup>
          <SettingsLinkRow label="Export results (CSV)" href="/api/export" />
          <SettingsButtonRow
            label="Delete all data"
            destructive
            onClick={() => setConfirming(true)}
          />
        </SettingsGroup>

        <p className="mt-auto pb-4 text-center text-xs text-dim">
          Padel · version 1.0 · single organizer
        </p>
      </Screen>

      {sheet === "format" ? (
        <OptionSheet
          title="Default format"
          options={FORMATS.map((format) => ({
            value: format,
            label: FORMAT_LABEL[format],
          }))}
          selected={settings.defaultFormat}
          onSelect={(value) => {
            patch({ defaultFormat: value });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === "teams" ? (
        <OptionSheet
          title="Default teams"
          options={TEAM_COUNTS.map((count) => ({
            value: count,
            label: `${count} teams`,
          }))}
          selected={settings.defaultTeams}
          onSelect={(value) => {
            patch({ defaultTeams: value });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === "courts" ? (
        <OptionSheet
          title="Courts"
          options={COURT_COUNTS.map((count) => ({
            value: count,
            label: count === 1 ? "1 court" : `${count} courts`,
          }))}
          selected={settings.courts}
          onSelect={(value) => {
            patch({ courts: value });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {confirming ? (
        <ConfirmSheet
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            startTransition(async () => {
              await deleteAllDataAction();
              router.refresh();
            });
          }}
        />
      ) : null}
    </>
  );
}

function Sheet({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative rounded-t-sheet bg-white p-5 pb-8">
        {children}
      </div>
    </div>
  );
}

function OptionSheet<T extends string | number>({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <p className="mb-4 text-center text-md font-semibold tracking-snug">
        {title}
      </p>
      <div className="flex max-h-[320px] flex-col overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "flex items-center justify-between border-b border-hair py-3.5 text-left text-base last:border-b-0",
              option.value === selected
                ? "font-semibold text-gold"
                : "text-ink",
            )}
          >
            {option.label}
            {option.value === selected ? <span>✓</span> : null}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function ConfirmSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet onClose={onCancel}>
      <p className="text-center text-md font-semibold tracking-snug">
        Delete all data?
      </p>
      <p className="mx-auto mt-2 max-w-[280px] text-center text-xs-plus leading-relaxed text-dim text-pretty">
        Every tournament, team and result is removed. This cannot be undone.
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-[54px] items-center justify-center rounded-tile bg-red-700 text-lg font-semibold text-white active:bg-red-800"
        >
          Delete everything
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-[54px] items-center justify-center rounded-tile bg-fill text-lg font-semibold text-ink"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
