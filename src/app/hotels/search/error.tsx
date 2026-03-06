"use client";

import { Button } from "@/components/ui/button";

export default function HotelSearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Failed to load hotel search</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We could not load the latest hotel results. Please retry.
      </p>
      <Button onClick={reset}>Retry search</Button>
    </div>
  );
}
