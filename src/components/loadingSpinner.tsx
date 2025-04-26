import { Music } from "lucide-react";

import React from "react";
import { motion } from "framer-motion";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <Music className="w-10 h-10 text-slate-800 animate-bounce" />
    </div>
  );
};

export const LoadingSpinner2 = () => {
  const bars = Array(10).fill(0); // Create an array of 10 divs
  return (
    <div className="z-10 flex justify-center items-center gap-2 h-full">
      {bars.map((_, index) => (
        <motion.div
          key={index}
          className="bg-slate-800 rounded-md"
          style={{
            width: "6px",
            height: "40px",
          }}
          animate={{
            scaleY: [1, 1.5, 1], // Add scaling for wave effect
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "loop",
            delay: index * 0.1, // Stagger the animation for wave effect
            ease: "easeInOut", // Smooth easing for the wave motion
          }}
        />
      ))}
    </div>
  );
};
