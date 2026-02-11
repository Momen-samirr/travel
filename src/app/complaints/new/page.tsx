"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Lock, LogIn } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";

const complaintSchema = z.object({
  bookingId: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
});

type ComplaintInput = z.infer<typeof complaintSchema>;

export default function NewComplaintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to submit a complaint.",
        variant: "default",
      });
    }
  }, [isLoaded, isSignedIn, toast]);

  const form = useForm<ComplaintInput>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      subject: "",
      description: "",
      category: "",
    },
  });

  const onSubmit = async (data: ComplaintInput) => {
    // Check authentication before submitting
    if (!isLoaded) {
      toast({
        title: "Please wait",
        description: "Checking authentication...",
        variant: "default",
      });
      return;
    }

    if (!isSignedIn) {
      const currentPath = window.location.pathname;
      toast({
        title: "Sign In Required",
        description: "Please sign in to submit a complaint.",
        variant: "default",
      });
      router.push(`/sign-in?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit complaint");
      }

      toast({
        title: "Complaint submitted!",
        description: "We'll review your complaint and get back to you soon.",
        variant: "success",
      });
      router.push("/complaints");
      router.refresh();
    } catch (error: any) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Failed to submit complaint",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Submit a Complaint</h1>

      <AuthGuard
        message="Please sign in to submit a complaint and track its status."
        fallback={
          <Card className="border-2 border-dashed">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Sign In Required</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please sign in to submit a complaint and track its status.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal" fallbackRedirectUrl={window.location.pathname}>
                <Button className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Submit Complaint
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        }
      >
        <Card>
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BOOKING">Booking Issue</SelectItem>
                        <SelectItem value="PAYMENT">Payment Issue</SelectItem>
                        <SelectItem value="SERVICE">Service Quality</SelectItem>
                        <SelectItem value="REFUND">Refund Request</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of your complaint" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={8}
                        placeholder="Please provide detailed information about your complaint..."
                      />
                    </FormControl>
                    <FormDescription>
                      Include as much detail as possible to help us resolve your issue quickly.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Submitting..." : "Submit Complaint"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </AuthGuard>
    </div>
  );
}

