"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

// Routes where the bottom navigation should not appear
const HIDDEN_NAV_ROUTES = ["/ai-chat", "/login", "/auth"];

export default function NavWrapper() {
  const pathname = usePathname();
  const hidden = HIDDEN_NAV_ROUTES.some((route) => pathname.startsWith(route));
  if (hidden) return null;
  return <BottomNav />;
}
