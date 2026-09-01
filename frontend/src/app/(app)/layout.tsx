import { AppLayout } from "@/components/AppLayout";

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
