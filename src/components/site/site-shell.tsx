"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { ToastViewport } from "@/components/site/toast-viewport";

export function SiteShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = pathname === "/login" || pathname === "/signup";

  return (
    <>
      <ToastViewport />
      {!hideChrome ? header : null}
      <div className="flex-1">{children}</div>
      {!hideChrome ? <SiteFooter /> : null}
    </>
  );
}
