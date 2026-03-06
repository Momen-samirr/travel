"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function UserSync() {
  const { isSignedIn, user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (isSignedIn && userId) {
      const syncKey = `synced-user:${userId}`;
      if (typeof window !== "undefined" && sessionStorage.getItem(syncKey)) {
        return;
      }

      const controller = new AbortController();
      // Keep auth sync writes explicit in this effect only.
      fetch("/api/auth/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Sync failed with status ${response.status}`);
          }

          if (typeof window !== "undefined") {
            sessionStorage.setItem(syncKey, "1");
          }
        })
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") return;
          // Silently fail - user will be created on next page load
          console.error("Failed to sync user:", error);
        });

      return () => {
        controller.abort();
      };
    }
  }, [isSignedIn, userId]);

  return null; // This component doesn't render anything
}

