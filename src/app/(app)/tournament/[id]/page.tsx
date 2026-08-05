import { Trophy } from "lucide-react";

import { ComingNext } from "@/components/ui/ComingNext";

export default function TournamentDetailPage() {
  return (
    <ComingNext
      title="Tournament"
      icon={Trophy}
      description="Matches, standings, bracket and teams live here."
    />
  );
}
