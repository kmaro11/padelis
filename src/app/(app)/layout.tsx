import { PhoneFrame } from "@/components/layout/PhoneFrame";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
