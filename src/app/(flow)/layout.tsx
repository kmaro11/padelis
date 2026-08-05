import { PhoneFrame } from "@/components/layout/PhoneFrame";

/** Pilno ekrano srautai — be apatinės navigacijos. */
export default function FlowLayout({ children }: LayoutProps<"/">) {
  return <PhoneFrame nav={false}>{children}</PhoneFrame>;
}
