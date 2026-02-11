"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";
import { fadeInUp, getAnimationVariants } from "@/lib/motion";

interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: FadeInSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: 60,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getAnimationVariants(variants)}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

