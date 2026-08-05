import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { TournamentProvider } from "@/lib/tournament-store";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <TournamentProvider>
      <PhoneFrame>{children}</PhoneFrame>
    </TournamentProvider>
  );
}
