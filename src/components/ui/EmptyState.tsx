import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex size-[78px] items-center justify-center rounded-card-lg bg-fill">
        <Icon className="size-8 text-faint" strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-semibold tracking-heading">{title}</p>
      <p className="max-w-[250px] text-base-plus text-dim text-pretty">
        {description}
      </p>
    </div>
  );
}
