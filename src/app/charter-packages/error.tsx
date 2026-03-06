"use client";

import { Button } from "@/components/ui/button";

export default function CharterPackagesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Failed to load charter packages</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We hit a problem loading charter package data. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
