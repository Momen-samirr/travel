"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, MapPin, Package, ArrowRight } from "lucide-react";
import { FadeInSection } from "@/components/motion/fade-in-section";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";

export function ServicesOverview() {
  return (
    <FadeInSection>
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInSection delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything You Need for Your Trip</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From flights to complete travel packages - we've got you covered for your next adventure
              </p>
            </div>
          </FadeInSection>

          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerItem>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="card-hover border-2 hover:border-primary/50 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Plane className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Flights</h3>
                    <p className="text-muted-foreground mb-6">
                      Book flights to anywhere in the world with the best prices and flexible options
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/flights">
                        Search Flights
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="card-hover border-2 hover:border-primary/50 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Charter Packages</h3>
                    <p className="text-muted-foreground mb-6">
                      Complete travel bundles with flights, hotels, and more for your perfect getaway
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/charter-packages">
                        View Charter Packages
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="card-hover border-2 hover:border-primary/50 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Inbound Packages</h3>
                    <p className="text-muted-foreground mb-6">
                      Local tourism packages without international flights - explore your destination
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/inbound-packages">
                        View Inbound Packages
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="card-hover border-2 hover:border-primary/50 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Regular Packages</h3>
                    <p className="text-muted-foreground mb-6">
                      Explore our regular travel packages designed for every type of traveler
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/regular-packages">
                        View Regular Packages
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>

          </StaggerList>
        </div>
      </section>
    </FadeInSection>
  );
}

