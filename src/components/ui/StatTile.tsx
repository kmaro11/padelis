export function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-tile bg-fill px-3 py-4">
      <div className="text-4xl font-bold tracking-display">{value}</div>
      <div className="mt-1.5 text-2xs text-dim">{label}</div>
    </div>
  );
}

export function StatRow({
  stats,
}: {
  stats: { value: number; label: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((stat) => (
        <StatTile key={stat.label} value={stat.value} label={stat.label} />
      ))}
    </div>
  );
}
