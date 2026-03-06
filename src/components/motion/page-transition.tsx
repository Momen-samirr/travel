"use client";

import { motion, useAnimationControls } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { pageTransition } from "@/lib/motion";
import { prefersReducedMotion } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const controls = useAnimationControls();
  const reducedMotion = prefersReducedMotion();
  const disableTransitionForRoute =
    pathname.startsWith("/charter-packages") ||
    pathname.startsWith("/packages") ||
    pathname.startsWith("/hotels/search");

  useEffect(() => {
    if (reducedMotion || disableTransitionForRoute) {
      return;
    }

    // Animate the shell without remounting the whole route tree.
    controls.set("initial");
    void controls.start("animate");
  }, [pathname, disableTransitionForRoute, controls, reducedMotion]);

  // Skip animations if user prefers reduced motion
  if (reducedMotion || disableTransitionForRoute) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={false}
      animate={controls}
      variants={pageTransition}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

