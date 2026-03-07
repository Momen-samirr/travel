import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about bookings, payments, cancellations, and travel support.",
};

const faqs = [
  {
    question: "How do I book a trip?",
    answer:
      "Browse flights, tours, hotels, or packages, choose the option that fits your plan, and complete your booking from the checkout flow.",
  },
  {
    question: "Can I cancel or modify my booking?",
    answer:
      "Yes, but policies depend on the product and supplier. You can review your booking details in My Trips and contact support for changes.",
  },
  {
    question: "When do I receive my booking confirmation?",
    answer:
      "You usually receive confirmation immediately after successful payment. If a supplier verification step is required, it may take longer.",
  },
  {
    question: "What payment methods are available?",
    answer:
      "We support online payments and bank transfer options where available. Payment options shown at checkout may vary by booking type.",
  },
  {
    question: "Do you offer support after booking?",
    answer:
      "Yes. Our team can help with booking issues, updates, and trip-related assistance. Use the Contact or Complaints page when needed.",
  },
  {
    question: "How can I track my bookings?",
    answer:
      "Sign in to your account and open My Trips to view your booking status, details, and relevant updates.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-linear-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/90">
              Quick answers to the most common questions about our services.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border bg-card p-5 open:shadow-sm transition-all"
            >
              <summary className="cursor-pointer list-none font-semibold text-lg flex items-center justify-between gap-4">
                {item.question}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
