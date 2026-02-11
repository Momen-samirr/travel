"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Plane, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Airport {
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (airport: Airport) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function AirportAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search airport or city",
  label,
  error,
  disabled,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const blurTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize query from value prop only if value is empty or we don't have a selected airport
  useEffect(() => {
    // If value is empty, clear everything
    if (!value) {
      if (!isTyping) {
        setQuery("");
        setSelectedAirport(null);
      }
      return;
    }

    // If we have a selected airport and value matches its IATA code, preserve display
    if (selectedAirport && selectedAirport.iataCode === value) {
      // Don't update query if user is currently typing
      if (!isTyping) {
        const displayValue = selectedAirport.cityName
          ? `${selectedAirport.cityName} (${selectedAirport.iataCode})`
          : `${selectedAirport.name} (${selectedAirport.iataCode})`;
        setQuery(displayValue);
      }
      return;
    }

    // If value doesn't match selected airport, it might be from external update (e.g., swap)
    // In this case, we need to clear selection and show the IATA code or empty
    if (!isTyping) {
      setQuery(value);
      setSelectedAirport(null);
    }
  }, [value, selectedAirport, isTyping]);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length < 2) {
      setAirports([]);
      setOpen(false);
      return;
    }

    // Don't search if query matches the selected airport display
    if (selectedAirport) {
      const displayValue = selectedAirport.cityName
        ? `${selectedAirport.cityName} (${selectedAirport.iataCode})`
        : `${selectedAirport.name} (${selectedAirport.iataCode})`;
      if (query === displayValue) {
        setAirports([]);
        setOpen(false);
        return;
      }
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/amadeus/airports?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setAirports(data.locations || []);
          setOpen(true);
          setSelectedIndex(-1);
        } else {
          setAirports([]);
          setOpen(false);
        }
      } catch (error) {
        console.error("Error fetching airports:", error);
        setAirports([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, selectedAirport]);

  const handleSelect = (airport: Airport) => {
    const displayValue = airport.cityName
      ? `${airport.cityName} (${airport.iataCode})`
      : `${airport.name} (${airport.iataCode})`;
    
    setSelectedAirport(airport);
    setQuery(displayValue);
    setIsTyping(false);
    onChange(airport.iataCode);
    onSelect(airport);
    setOpen(false);
    setSelectedIndex(-1);
    
    // Focus back on input
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsTyping(true);
    
    // Clear selection if user is typing something different
    if (selectedAirport) {
      const displayValue = selectedAirport.cityName
        ? `${selectedAirport.cityName} (${selectedAirport.iataCode})`
        : `${selectedAirport.name} (${selectedAirport.iataCode})`;
      
      if (newQuery !== displayValue) {
        setSelectedAirport(null);
        onChange("");
      }
    } else {
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === "Tab") {
      setOpen(false);
      return;
    }

    if (!open || airports.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < airports.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < airports.length) {
          handleSelect(airports[selectedIndex]);
        } else if (airports.length === 1) {
          // If only one result, select it
          handleSelect(airports[0]);
        }
        break;
    }
  };

  const handleFocus = () => {
    // If we have airports from previous search, show them
    if (airports.length > 0) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click events on dropdown to fire
    blurTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setSelectedIndex(-1);
      setIsTyping(false);
    }, 200);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSelectedIndex(-1);
        setIsTyping(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleListItemMouseDown = (e: React.MouseEvent) => {
    // Prevent blur event from firing when clicking on list item
    e.preventDefault();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-10",
            error && "border-destructive"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {open && airports.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {airports.map((airport, index) => (
            <li
              key={`${airport.iataCode}-${index}`}
              onMouseDown={handleListItemMouseDown}
              onClick={() => handleSelect(airport)}
              className={cn(
                "px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                index === selectedIndex && "bg-gray-100"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {airport.cityName || airport.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {airport.name !== airport.cityName && airport.cityName && `${airport.name}, `}
                    {airport.countryName}
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary">
                  {airport.iataCode}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
