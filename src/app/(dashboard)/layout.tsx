"use client";

import DashboardSidebar from "@/components/dashboard/sidebar";
import { ScanProvider } from "@/lib/scan-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScanProvider>
      <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </ScanProvider>
  );
}
