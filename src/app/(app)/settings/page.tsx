import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { getSettings } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsScreen initial={settings} />;
}
