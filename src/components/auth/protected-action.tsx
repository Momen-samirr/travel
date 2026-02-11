"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";

interface ProtectedActionProps {
  children: ReactNode;
  action: () => void | Promise<void>;
  message?: string;
  requireAuth?: boolean;
}

export function ProtectedAction({
  children,
  action,
  message,
  requireAuth = true,
}: ProtectedActionProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleClick = async () => {
    if (!isLoaded) {
      return;
    }

    if (requireAuth && !isSignedIn) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${currentPath}${window.location.search}`;
      
      toast({
        title: "Sign In Required",
        description: message || "Please sign in to perform this action.",
        variant: "default",
      });

      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    try {
      await action();
    } catch (error: any) {
      console.error("Action error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}

