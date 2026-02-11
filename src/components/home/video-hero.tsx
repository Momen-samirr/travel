"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import Image from "next/image";

interface VideoHeroProps {
  children: React.ReactNode;
  videoSrc?: string;
  videoWebm?: string;
  posterSrc?: string;
  overlayOpacity?: number;
  className?: string;
}

export function VideoHero({
  children,
  videoSrc = "/videos/herovideo.mp4",
  videoWebm = undefined,
  posterSrc = "/images/hero-poster.jpg",
  overlayOpacity = 0.6,
  className = "",
}: VideoHeroProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxRetries = 2;

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isMobile) {
            setShouldLoadVideo(true);
            // Start loading video
            if (videoRef.current) {
              videoRef.current.load();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const containerElement = containerRef.current;
    if (containerElement) {
      observer.observe(containerElement);
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
      if (containerElement) {
        observer.unobserve(containerElement);
      }
    };
  }, [isMobile]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    console.error("Video failed to load:", videoSrc);
    setIsVideoLoaded(false);
    
    // Retry loading if we haven't exceeded max retries
    if (retryCount < maxRetries && videoRef.current) {
      setRetryCount((prev) => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setVideoError(true);
      console.warn("Video failed to load after retries, falling back to poster image");
    }
  };

  return (
    <section
      ref={containerRef}
      className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Background Video - Desktop only */}
      {!isMobile && shouldLoadVideo && !videoError && (
        <div className="absolute inset-0 w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            className="absolute inset-0 w-full h-full object-cover"
            aria-label="Travel background video"
            style={{ willChange: "auto" }}
          >
            {videoWebm && <source src={videoWebm} type="video/webm" />}
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Poster Image - Mobile, fallback, or when video fails */}
      {(isMobile || !isVideoLoaded || videoError) && (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={posterSrc}
            alt="Travel destination"
            fill
            priority={!isMobile}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/30 z-10"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
        }}
      />

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="container mx-auto px-4 py-20 relative z-20"
      >
        {children}
      </motion.div>

      {/* Loading indicator */}
      {shouldLoadVideo && !isVideoLoaded && !isMobile && (
        <div className="absolute inset-0 flex items-center justify-center z-15">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </section>
  );
}

