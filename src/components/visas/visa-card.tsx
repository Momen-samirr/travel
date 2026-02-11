"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";

interface VisaCardProps {
  visa: {
    id: string;
    country: string;
    type: string;
    description: string | null;
    processingTime: string;
    price: any;
    currency: string;
    requiredDocuments: any;
  };
}

export function VisaCard({ visa }: VisaCardProps) {
  const requiredDocuments = visa.requiredDocuments as string[];

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="card-hover h-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{visa.country}</CardTitle>
                <CardDescription className="mt-1">{visa.type} Visa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
              {visa.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Processing: {visa.processingTime}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="text-2xl font-bold text-primary mb-4">
                {formatCurrency(Number(visa.price), visa.currency)}
              </div>
              {requiredDocuments.length > 0 && (
                <div className="text-sm mb-4">
                  <div className="font-semibold mb-2 text-foreground">Required Documents:</div>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {requiredDocuments.slice(0, 3).map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                    {requiredDocuments.length > 3 && (
                      <li className="text-primary font-medium">
                        +{requiredDocuments.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <Button asChild className="w-full rounded-full">
                <Link href={`/visa/${visa.id}/apply`}>Apply Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

