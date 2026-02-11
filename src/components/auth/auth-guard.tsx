"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
  showSignInButton?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  message,
  showSignInButton = true,
}: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || searchParams.get("returnUrl") || undefined;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Sign In Required</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {message || "Please sign in to access this content."}
              </p>
            </div>
          </div>
        </CardHeader>
        {showSignInButton && (
          <CardContent>
            <SignInButton mode="modal" fallbackRedirectUrl={redirectUrl}>
              <Button className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Button>
            </SignInButton>
          </CardContent>
        )}
      </Card>
    );
  }

  return <>{children}</>;
}

