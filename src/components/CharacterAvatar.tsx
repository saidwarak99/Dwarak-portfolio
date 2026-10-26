"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

interface CharacterAvatarProps {
  pose?: "hero" | "standing" | "laptop" | "bust";
  imageUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}

const poseImageMap: Record<string, { src: string; width: number; height: number; alt: string }> = {
  hero: {
    src: "/images/character/sai-hero.png",
    width: 350,
    height: 670,
    alt: "Sai Dwarak cartoon illustration — red T-shirt hero pose",
  },
  standing: {
    src: "/images/character/sai-standing.png",
    width: 375,
    height: 1240,
    alt: "Sai Dwarak cartoon illustration — full standing with backpack",
  },
  laptop: {
    src: "/images/character/sai-laptop.png",
    width: 235,
    height: 305,
    alt: "Sai Dwarak cartoon illustration — sitting with laptop",
  },
  bust: {
    src: "/images/character/sai-bust.png",
    width: 160,
    height: 205,
    alt: "Sai Dwarak cartoon illustration — portrait bust",
  },
};

export function CharacterAvatar({
  pose = "hero",
  imageUrl,
  className = "",
  size = "md",
  priority = false,
}: CharacterAvatarProps) {
  const prefersReducedMotion = useReducedMotion();

  const selectedPose = poseImageMap[pose] || poseImageMap.hero;
  const imageSrc = imageUrl || selectedPose.src;

  // Responsive dimension classes
  const sizeClasses = {
    sm: "w-16 sm:w-20 md:w-24 max-h-[120px] sm:max-h-[140px]",
    md: "w-28 sm:w-40 md:w-56 max-h-[170px] sm:max-h-[230px] md:max-h-[290px]",
    lg: "w-36 sm:w-48 md:w-64 max-h-[250px] sm:max-h-[330px] md:max-h-[380px]",
    xl: "w-48 sm:w-60 md:w-72 max-h-[330px] sm:max-h-[410px] md:max-h-[480px]",
  };

  return (
    <motion.div
      animate={
        prefersReducedMotion
          ? {}
          : {
              y: [0, -6, 0],
            }
      }
      transition={{
        duration: 3.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label={selectedPose.alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={selectedPose.alt}
        className="w-full h-auto object-contain filter drop-shadow-sm select-none pointer-events-none"
        loading={priority ? "eager" : "lazy"}
      />
    </motion.div>
  );
}
