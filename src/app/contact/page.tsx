import { branchService } from "@/services/branches/branchService";
import { ContactPageContent } from "@/components/contact/contact-page-content";
import { StructuredData } from "@/components/shared/structured-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const branches = await branchService.getAllBranches();

  return (
    <>
      <StructuredData type="branches" data={branches} />
      <ContactPageContent branches={branches} />
    </>
  );
}

