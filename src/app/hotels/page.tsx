import { redirect } from "next/navigation";

export const metadata = {
  title: "Hotels",
  description: "Find the perfect accommodation for your stay",
};

export default async function HotelsPage() {
  // Redirect to search page
  redirect("/hotels/search");
}

