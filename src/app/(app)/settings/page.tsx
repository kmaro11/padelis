import { Settings } from "lucide-react";

import { ComingNext } from "@/components/ui/ComingNext";

export default function SettingsPage() {
  return (
    <ComingNext
      title="Settings"
      icon={Settings}
      description="Defaults, switches and data management live here."
    />
  );
}
