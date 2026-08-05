"use server";

import { revalidatePath } from "next/cache";

import {
  deleteAllData,
  deleteTournament,
  insertTournament,
  saveMatchScore,
  type CreateTournamentInput,
} from "@/db/queries";
import type { MatchScore } from "@/lib/types";

export async function createTournamentAction(input: CreateTournamentInput) {
  const id = await insertTournament(input);
  revalidatePath("/");
  revalidatePath("/events");
  return id;
}

export async function saveScoreAction(
  tournamentId: string,
  matchId: string,
  score: MatchScore,
) {
  await saveMatchScore(tournamentId, matchId, score);
  revalidatePath("/");
  revalidatePath(`/tournament/${tournamentId}`);
}

export async function deleteTournamentAction(id: string) {
  await deleteTournament(id);
  revalidatePath("/");
  revalidatePath("/events");
}

export async function deleteAllDataAction() {
  await deleteAllData();
  revalidatePath("/");
  revalidatePath("/events");
}
