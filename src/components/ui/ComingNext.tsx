import type { LucideIcon } from "lucide-react";

import { Screen } from "../layout/PhoneFrame";
import { EmptyState } from "./EmptyState";
import { ScreenTitle } from "./SectionLabel";

/** Placeholder for screens that are not built yet. */
export function ComingNext({
  title,
  icon,
  description,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
}) {
  return (
    <Screen>
      <ScreenTitle>{title}</ScreenTitle>
      <EmptyState icon={icon} title="Coming next" description={description} />
      
    </Screen>
  );
}
