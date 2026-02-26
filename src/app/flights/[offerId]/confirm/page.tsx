"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, ExternalLink } from "lucide-react";

/**
 * In-app flight confirm step is no longer used. Flight search and booking
 * use AOS redirect from the main Flights page.
 */
export default function BookingConfirmPage() {
  const router = useRouter();

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-muted p-3">
              <Plane className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Flight booking on partner site</h1>
            <p className="text-sm text-muted-foreground">
              Flight search and booking are handled by our partner. Use the form on the Flights page to be redirected to search and book.
            </p>
            <Button onClick={() => router.push("/flights")} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Go to Flights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
