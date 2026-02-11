import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Users, Award, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our travel and tourism company",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">About Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted partner for unforgettable travel experiences
          </p>
        </div>

        {/* Mission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              We are dedicated to making travel accessible, enjoyable, and memorable for everyone. 
              With years of experience in the tourism industry, we provide comprehensive travel 
              solutions including flights, tours, hotel bookings, and visa services. Our mission 
              is to connect people with amazing destinations while ensuring exceptional service 
              and value.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Customer First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your satisfaction is our top priority. We go above and beyond to ensure 
                every travel experience exceeds expectations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" />
                Quality Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We partner with trusted providers and maintain high standards to deliver 
                reliable and quality travel services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Global Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                From local tours to international destinations, we offer a wide range of 
                travel options to suit every need and budget.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why Choose Us */}
        <Card>
          <CardHeader>
            <CardTitle>Why Choose Us?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Expert Team</h3>
              <p className="text-sm text-muted-foreground">
                Our experienced travel consultants are here to help you plan the perfect trip.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Best Prices</h3>
              <p className="text-sm text-muted-foreground">
                We negotiate the best rates with our partners to offer you competitive pricing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">
                Our customer support team is available around the clock to assist you.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Secure Booking</h3>
              <p className="text-sm text-muted-foreground">
                Your personal and payment information is protected with industry-standard security.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

