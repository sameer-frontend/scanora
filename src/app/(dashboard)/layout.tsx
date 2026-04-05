"use client";

import DashboardSidebar, { DashboardHeader } from "@/components/dashboard/sidebar";
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
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ScanProvider>
  );
}
