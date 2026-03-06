"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Failed to load admin page</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Something went wrong while loading this section. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
