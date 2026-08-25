import { CreateFlow } from "@/components/create/CreateFlow";
import { getSettings, listPlayers } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const [settings, players] = await Promise.all([
    getSettings(),
    listPlayers(),
  ]);

  return (
    <CreateFlow
      players={players}
      defaults={{
        defaultTeams: settings.defaultTeams,
        defaultFormat: settings.defaultFormat,
        courts: settings.courts,
      }}
    />
  );
}
