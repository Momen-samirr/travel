import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/tours/booking-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { FileText, Clock, Check } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const visa = await prisma.visa.findUnique({
    where: { id },
  });

  if (!visa) {
    return { title: "Visa Not Found" };
  }

  return {
    title: `Apply for ${visa.country} Visa`,
    description: `Apply for ${visa.type} visa to ${visa.country}`,
  };
}

export default async function VisaApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visa = await prisma.visa.findUnique({
    where: { id },
  });

  if (!visa || !visa.isActive) {
    notFound();
  }

  const requiredDocuments = visa.requiredDocuments as string[];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Apply for Visa</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BookingForm visaId={visa.id} bookingType="VISA" />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>{visa.country} Visa</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Type</div>
                  <div className="font-semibold">{visa.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Processing Time</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{visa.processingTime}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(visa.price), visa.currency)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {requiredDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {visa.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

