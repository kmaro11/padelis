import { CalendarPlus } from "lucide-react";

import { ComingNext } from "@/components/ui/ComingNext";

export default function CreatePage() {
  return (
    <ComingNext
      title="New tournament"
      icon={CalendarPlus}
      description="The four-step create flow lives here: date, teams, names, format."
    />
  );
}
