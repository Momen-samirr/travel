"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, MapPin, Hotel, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function HomepageSearchWidget() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("flights");

  const handleQuickSearch = (type: string) => {
    router.push(`/${type}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="flights" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="tours" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Tours</span>
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              <span className="hidden sm:inline">Hotels</span>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {activeTab === "flights" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleQuickSearch("flights")}
                  size="lg"
                  className="flex-1 h-14 text-base rounded-xl"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Flights
                </Button>
              </div>
            )}

            {activeTab === "tours" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleQuickSearch("tours")}
                  size="lg"
                  className="flex-1 h-14 text-base rounded-xl"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Browse Tours
                </Button>
              </div>
            )}

            {activeTab === "hotels" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleQuickSearch("hotels")}
                  size="lg"
                  className="flex-1 h-14 text-base rounded-xl"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Find Hotels
                </Button>
              </div>
            )}

          </div>
        </Tabs>
      </CardContent>
      </Card>
    </motion.div>
  );
}

