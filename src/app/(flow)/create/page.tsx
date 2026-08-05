import { CreateFlow } from "@/components/create/CreateFlow";
import { getSettings } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const settings = await getSettings();

  return (
    <CreateFlow
      defaults={{
        defaultTeams: settings.defaultTeams,
        defaultFormat: settings.defaultFormat,
        courts: settings.courts,
      }}
    />
  );
}
