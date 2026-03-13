"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setVisible(false);
      // Tiny delay so the browser paints the skeleton (from loading.tsx) first,
      // then the real page fades in immediately after hydration
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.15s ease-out",
      }}
    >
      {children}
    </div>
  );
}
