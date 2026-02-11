"use client";

import { Shield, Users, TrendingUp } from "lucide-react";
import { FadeInSection } from "@/components/motion/fade-in-section";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";

export function WhyChooseUs() {
  return (
    <FadeInSection>
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FadeInSection delay={0.1}>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
                <p className="text-lg text-muted-foreground">
                  We make travel planning simple, affordable, and unforgettable
                </p>
              </div>
            </FadeInSection>

            <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Secure Booking</h3>
                  <p className="text-muted-foreground">
                    Your payments are protected with industry-leading security measures
                  </p>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
                  <p className="text-muted-foreground">
                    We compare prices across multiple providers to get you the best deals
                  </p>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                  <p className="text-muted-foreground">
                    Our travel experts are available around the clock to assist you
                  </p>
                </motion.div>
              </StaggerItem>
            </StaggerList>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}

