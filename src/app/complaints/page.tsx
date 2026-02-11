import { getCurrentUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";

export const metadata = {
  title: "Complaints",
  description: "Submit and track your complaints",
};

export default async function ComplaintsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const complaints = await prisma.complaint.findMany({
    where: { userId: user.id },
    include: {
      booking: {
        select: {
          id: true,
          bookingType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "RESOLVED":
        return "default";
      case "CLOSED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Complaints</h1>
        <Button asChild>
          <Link href="/complaints/new">
            <Plus className="h-4 w-4 mr-2" />
            Submit Complaint
          </Link>
        </Button>
      </div>

      {complaints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You have no complaints yet.</p>
            <Button asChild>
              <Link href="/complaints/new">Submit Your First Complaint</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{complaint.subject}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                    <Badge variant="outline">{complaint.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Category: </span>
                    <span className="font-medium">{complaint.category}</span>
                  </div>
                  <p className="text-gray-700">{complaint.description}</p>
                  {complaint.adminResponse && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="font-semibold mb-2">Admin Response:</div>
                      <p className="text-gray-700">{complaint.adminResponse}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Submitted: {formatDate(complaint.createdAt)}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/complaints/${complaint.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

