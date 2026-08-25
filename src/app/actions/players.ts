"use server";

import { revalidatePath } from "next/cache";

import { createPlayer, deletePlayer, renamePlayer } from "@/db/queries";
import type { Player } from "@/lib/types";

export async function createPlayerAction(name: string): Promise<Player> {
  const player = await createPlayer(name);
  revalidatePath("/players");
  return player;
}

export async function renamePlayerAction(
  id: string,
  name: string,
): Promise<void> {
  await renamePlayer(id, name);
  revalidatePath("/players");
}

export async function deletePlayerAction(id: string): Promise<void> {
  await deletePlayer(id);
  revalidatePath("/players");
}
