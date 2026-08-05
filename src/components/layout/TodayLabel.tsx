"use client";

import { useSyncExternalStore } from "react";

import { formatLongDate } from "@/lib/date";
import { SectionLabel } from "../ui/SectionLabel";

const subscribe = () => () => {};
const getSnapshot = () => formatLongDate(new Date());
const getServerSnapshot = () => null;

/**
 * Resolved on the client only, so the server markup never disagrees with
 * the visitor's local date.
 */
export function TodayLabel() {
  const today = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <SectionLabel className="min-h-3">{today ?? " "}</SectionLabel>;
}
