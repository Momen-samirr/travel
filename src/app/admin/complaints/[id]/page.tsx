import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ComplaintResponseForm } from "@/components/admin/complaint-response-form";

export default async function AdminComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      booking: {
        select: {
          id: true,
          bookingType: true,
        },
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  const attachments = complaint.attachments as string[] | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{complaint.subject}</h1>
        <div className="flex gap-2">
          <Badge>{complaint.status}</Badge>
          <Badge variant="outline">{complaint.priority}</Badge>
          <Badge variant="secondary">{complaint.category}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Submitted by</div>
                <div className="font-semibold">
                  {complaint.user.name || complaint.user.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Date</div>
                <div>{formatDate(complaint.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <p className="whitespace-pre-line">{complaint.description}</p>
              </div>
              {attachments && attachments.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Attachments</div>
                  <div className="space-y-2">
                    {attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline block"
                      >
                        Attachment {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {complaint.adminResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{complaint.adminResponse}</p>
                {complaint.resolvedAt && (
                  <div className="text-sm text-gray-600 mt-4">
                    Resolved on: {formatDate(complaint.resolvedAt)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <ComplaintResponseForm complaint={complaint} />
        </div>
      </div>
    </div>
  );
}

