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
      <div className="flex flex-col md:flex-row h-dvh overflow-hidden bg-[#0a0e1a]">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </ScanProvider>
  );
}
