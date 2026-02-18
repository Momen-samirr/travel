"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Plane, MapPin } from "lucide-react";
import Link from "next/link";
import { HomepageSearchWidget } from "@/components/home/homepage-search-widget";

export function HeroContent() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* Headline */}
      <motion.h1
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-shadow-lg"
      >
        Your Journey Starts Here
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl text-white/90 mb-12 text-shadow-md"
      >
        Discover amazing destinations and book complete travel packages all in one place.
      </motion.p>

      {/* Search Widget */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.4 }}
        className="mb-12"
      >
        <HomepageSearchWidget />
      </motion.div>

      {/* Quick CTAs */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
          <Link href="/flights">
            <Plane className="mr-2 h-5 w-5" />
            Search Flights
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-12 text-base bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20">
          <Link href="/charter-packages">
            <MapPin className="mr-2 h-5 w-5" />
            Packages
          </Link>
        </Button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, repeat: Infinity, repeatType: "reverse", duration: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </div>
  );
}

