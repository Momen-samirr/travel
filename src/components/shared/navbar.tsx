"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CURRENCY_COOKIE_KEY, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currency";

const navLinks = [
  {
    href: "https://tishoury.amadeusonlinesuite.com/flights?lc=EN",
    label: "Flights",
    external: true,
  },
  { href: "/charter-packages", label: "Charter Packages" },
  { href: "/inbound-packages", label: "Inbound Packages" },
  { href: "/regular-packages", label: "Regular Packages" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, userId } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_CURRENCY;
    }
    const storedCurrency = window.localStorage.getItem(CURRENCY_COOKIE_KEY) as
      | SupportedCurrency
      | null;
    if (storedCurrency && SUPPORTED_CURRENCIES.includes(storedCurrency)) {
      return storedCurrency;
    }
    return DEFAULT_CURRENCY;
  });

  const updatePreferredCurrency = (value: SupportedCurrency) => {
    setPreferredCurrency(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENCY_COOKIE_KEY, value);
      document.cookie = `${CURRENCY_COOKIE_KEY}=${value}; path=/; max-age=31536000; samesite=lax`;
    }
  };

  useEffect(() => {
    if (!isSignedIn || !userId) {
      return;
    }

    let isMounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const fetchCurrentUser = async (attempt = 0) => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          // User sync may still be in-flight right after sign-in.
          if (response.status === 401 && attempt < 2 && isMounted) {
            retryTimeout = setTimeout(() => {
              void fetchCurrentUser(attempt + 1);
            }, 600);
            return;
          }

          if (isMounted) {
            setIsAdmin(false);
          }
          return;
        }

        const data = (await response.json()) as {
          user?: { role?: string };
        };

        const role = data.user?.role;
        if (isMounted) {
          setIsAdmin(role === "ADMIN" || role === "SUPER_ADMIN");
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [isSignedIn, userId]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md supports-backdrop-filter:bg-white/80 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-primary transition-all duration-300 ease-in-out hover:opacity-80"
          >
            <div className="relative">
              <Image
                src={"/logo.jpg"}
                alt="Tourism Co Logo"
                width={100}
                height={100}
                className="h-20 w-20"
              />
            </div>
            <span className="hidden sm:inline">Tishoury</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                !("external" in link && link.external) &&
                (pathname === link.href || pathname?.startsWith(link.href + "/"));
              return (
                <motion.div
                  key={link.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={link.href}
                    {...("external" in link && link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out relative",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Auth & Mobile Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <select
                aria-label="Preferred currency"
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={preferredCurrency}
                onChange={(e) => updatePreferredCurrency(e.target.value as SupportedCurrency)}
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <SignedIn>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/bookings">
                  <Button variant="ghost" size="sm" className="text-sm">
                    My Trips
                  </Button>
                </Link>
                {isAdmin ? (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="text-sm">
                      Admin
                    </Button>
                  </Link>
                ) : null}
              </div>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <div className="hidden sm:block">
                <SignInButton mode="modal">
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full px-6"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </SignedOut>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t overflow-hidden"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <div className="flex flex-col gap-2">
                  {navLinks.map((link, index) => {
                    const isActive =
                      !("external" in link && link.external) &&
                      (pathname === link.href ||
                        pathname?.startsWith(link.href + "/"));
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          {...("external" in link && link.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ease-in-out block",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                  <SignedOut>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: navLinks.length * 0.05 }}
                      className="px-4 pt-2"
                    >
                      <SignInButton mode="modal">
                        <Button
                          variant="default"
                          className="w-full rounded-full"
                        >
                          Sign In
                        </Button>
                      </SignInButton>
                    </motion.div>
                  </SignedOut>
                  <div className="px-4 py-3">
                    <label className="mb-1 block text-sm font-medium">Currency</label>
                    <select
                      aria-label="Preferred currency mobile"
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={preferredCurrency}
                      onChange={(e) => updatePreferredCurrency(e.target.value as SupportedCurrency)}
                    >
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SignedIn>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: navLinks.length * 0.05 }}
                    >
                      <Link
                        href="/bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ease-in-out hover:bg-muted block"
                      >
                        My Trips
                      </Link>
                      {isAdmin ? (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ease-in-out hover:bg-muted block"
                        >
                          Admin
                        </Link>
                      ) : null}
                    </motion.div>
                  </SignedIn>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
