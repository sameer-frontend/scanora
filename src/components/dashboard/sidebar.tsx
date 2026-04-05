"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Accessibility,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  Search,
  User,
  LogOut,
  Globe,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  ScanSearch,
  FileStack,
  File,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useScan } from "@/lib/scan-context";
import type { DeviceType } from "@/lib/types";

const navItems = [
  {
    label: "New Scan",
    href: "/dashboard/scan",
    icon: ScanSearch,
  },
  {
    label: "Accessibility",
    href: "/dashboard/accessibility",
    icon: Accessibility,
  },
  {
    label: "Performance",
    href: "/dashboard/performance",
    icon: Zap,
  },
  {
    label: "SEO",
    href: "/dashboard/seo",
    icon: Search,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const deviceOptions: { type: DeviceType; label: string; icon: typeof Smartphone }[] = [
  { type: "mobile", label: "Mobile", icon: Smartphone },
  { type: "tablet", label: "Tablet", icon: Tablet },
  { type: "laptop", label: "Laptop", icon: Laptop },
  { type: "desktop", label: "Desktop", icon: Monitor },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showScanInput, setShowScanInput] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const {
    startScan,
    scannedUrl,
    scanMode,
    setScanMode,
    selectedDevices,
    setSelectedDevices,
  } = useScan();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showScanInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showScanInput]);

  function handleNewScan() {
    if (showScanInput && scanUrl.trim()) {
      startScan(scanUrl.trim());
      setScanUrl("");
      setShowScanInput(false);
    } else {
      setShowScanInput(true);
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-screen flex-col border-r border-slate-800/50 bg-[#0c1021] shrink-0"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-4 border-b border-slate-800/50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold text-white whitespace-nowrap"
            >
              WebGuard
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Site selector */}
      <div className="p-3">
        <button className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-sm hover:bg-slate-800/50 transition-colors",
          collapsed && "justify-center"
        )}>
          <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left"
              >
                <div className="text-xs text-white font-medium truncate">{scannedUrl || "No site scanned"}</div>
                <div className="text-xs text-slate-500">Pro Plan</div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "text-white bg-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                  collapsed && "justify-center px-0"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <item.icon className={cn(
                  "relative h-5 w-5 shrink-0 z-10",
                  isActive && "text-emerald-400"
                )} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* New Scan Button */}
      <div className="p-3 space-y-2">
        {/* Device Picker */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-2"
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 px-1">
                Devices
              </div>
              <div className="grid grid-cols-4 gap-1">
                {deviceOptions.map(({ type, label, icon: Icon }) => {
                  const active = selectedDevices.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedDevices([type]);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] transition-colors",
                        active
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="flex flex-col items-center gap-1">
            {deviceOptions.map(({ type, icon: Icon }) => {
              const active = selectedDevices.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedDevices([type]);
                  }}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    active ? "bg-emerald-500/15 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        )}
        {/* Scan Mode Toggle */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-2"
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 px-1">
                Crawl Mode
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setScanMode("single")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                    scanMode === "single"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
                  )}
                >
                  <File className="h-3.5 w-3.5" />
                  One Page
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode("full-site")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                    scanMode === "full-site"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
                  )}
                >
                  <FileStack className="h-3.5 w-3.5" />
                  Full Site
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <button
            type="button"
            onClick={() => setScanMode(scanMode === "single" ? "full-site" : "single")}
            className={cn(
              "flex w-full items-center justify-center rounded-lg border p-2 transition-colors",
              scanMode === "full-site"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50"
            )}
          >
            {scanMode === "full-site" ? (
              <FileStack className="h-4 w-4 text-emerald-400" />
            ) : (
              <File className="h-4 w-4 text-slate-500" />
            )}
          </button>
        )}
        <AnimatePresence>
          {showScanInput && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNewScan();
                  if (e.key === "Escape") setShowScanInput(false);
                }}
                placeholder="Enter URL..."
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors mb-2"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <Button onClick={handleNewScan} className={cn("w-full", collapsed && "px-0")}>
          <Plus className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {showScanInput && scanUrl.trim() ? "Start Scan" : "New Scan"}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* User section */}
      <div className="border-t border-slate-800/50 p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2",
          collapsed && "justify-center"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-slate-700">
            <User className="h-4 w-4 text-emerald-400" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-white truncate">John Doe</div>
                <div className="text-xs text-slate-500 truncate">john@example.com</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </motion.aside>
  );
}

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800/50 bg-[#0a0e1a]/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </button>
        <Link href="/">
          <button className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </Link>
      </div>
    </header>
  );
}
