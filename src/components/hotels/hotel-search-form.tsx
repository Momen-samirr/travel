"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Search, Loader2 } from "lucide-react";
import { AirportAutocomplete } from "@/components/flights/airport-autocomplete";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function HotelSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [cityCode, setCityCode] = useState(searchParams.get("cityCode") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    searchParams.get("checkInDate") ? new Date(searchParams.get("checkInDate")!) : undefined
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    searchParams.get("checkOutDate") ? new Date(searchParams.get("checkOutDate")!) : undefined
  );
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "2"));
  const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));
  const [rooms, setRooms] = useState(parseInt(searchParams.get("rooms") || "1"));
  const [loading, setLoading] = useState(false);

  // Set default dates if not provided
  useEffect(() => {
    if (!checkInDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(tomorrow);
    }
    if (!checkOutDate) {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      setCheckOutDate(dayAfter);
    }
  }, []);

  const handleSearch = () => {
    if (!city && !cityCode) {
      return;
    }

    if (!checkInDate || !checkOutDate) {
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      return;
    }

    setLoading(true);

    const params = new URLSearchParams();
    if (cityCode) params.set("cityCode", cityCode);
    if (city) params.set("city", city);
    if (checkInDate) params.set("checkInDate", format(checkInDate, "yyyy-MM-dd"));
    if (checkOutDate) params.set("checkOutDate", format(checkOutDate, "yyyy-MM-dd"));
    params.set("adults", adults.toString());
    if (children > 0) params.set("children", children.toString());
    if (rooms > 1) params.set("rooms", rooms.toString());

    router.push(`/hotels/search?${params.toString()}`);
    setLoading(false);
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Destination */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="destination">Destination</Label>
            <AirportAutocomplete
              value={cityCode}
              onChange={setCityCode}
              onSelect={(airport) => {
                setCityCode(airport.iataCode);
                setCity(airport.cityName || airport.name);
              }}
              placeholder="Where are you going?"
              disabled={loading}
            />
          </div>

          {/* Check-in Date */}
          <div className="space-y-2">
            <Label>Check-in</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkInDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {checkInDate ? format(checkInDate, "MMM dd") : <span>Check-in</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={checkInDate}
                  onSelect={setCheckInDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div className="space-y-2">
            <Label>Check-out</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkOutDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {checkOutDate ? format(checkOutDate, "MMM dd") : <span>Check-out</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={checkOutDate}
                  onSelect={setCheckOutDate}
                  initialFocus
                  disabled={(date) => date < (checkInDate || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests & Rooms */}
          <div className="space-y-2">
            <Label>Guests & Rooms</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={loading}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {adults} {adults === 1 ? "adult" : "adults"}
                  {children > 0 && `, ${children} ${children === 1 ? "child" : "children"}`}
                  {rooms > 1 && `, ${rooms} ${rooms === 1 ? "room" : "rooms"}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Adults</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAdults(adults + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Children</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setChildren(children + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rooms</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{rooms}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRooms(rooms + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-6">
          <Button
            onClick={handleSearch}
            disabled={loading || !cityCode || !checkInDate || !checkOutDate}
            className="w-full md:w-auto min-w-[200px]"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Hotels
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

