import { AppShell } from "@/components/layout/AppShell";

/** Pilno ekrano srautai — be apatinės navigacijos. */
export default function FlowLayout({ children }: LayoutProps<"/">) {
  return <AppShell nav={false}>{children}</AppShell>;
}
