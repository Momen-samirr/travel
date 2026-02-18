"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BranchCard } from "./branch-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  phone: string;
  phoneAlt: string | null;
  email: string;
  emailAlt: string | null;
  workingHours: Record<string, string>;
  isActive: boolean;
  displayOrder: number;
}

interface BranchTabsProps {
  branches: Branch[];
  loading?: boolean;
}

export function BranchTabs({ branches, loading }: BranchTabsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No branches available at this time.</p>
      </div>
    );
  }

  // If only one branch, don't show tabs
  if (branches.length === 1) {
    return <BranchCard branch={branches[0]} />;
  }

  return (
    <Tabs defaultValue={branches[0]?.slug} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {branches.map((branch) => (
          <TabsTrigger key={branch.id} value={branch.slug}>
            {branch.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {branches.map((branch) => (
        <TabsContent key={branch.id} value={branch.slug}>
          <BranchCard branch={branch} />
        </TabsContent>
      ))}
    </Tabs>
  );
}


