"use client";

import { formatRelativeTime } from "@/lib/time";

export function RelativeTime({ value }: { value: string }) {
  return <>{formatRelativeTime(value)}</>;
}
