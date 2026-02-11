"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function UserSync() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      // Call API to ensure user is synced to database
      fetch("/api/auth/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((error) => {
        // Silently fail - user will be created on next page load
        console.error("Failed to sync user:", error);
      });
    }
  }, [isSignedIn, user]);

  return null; // This component doesn't render anything
}

