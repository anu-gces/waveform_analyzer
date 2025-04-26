import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const labels = ["Home", "Login", "Transcription", "About", "Settings"]; // <-- Added "Settings"

const HomeNav = () => {
  const [isHoveredGlobal, setIsHoveredGlobal] = useState(false);
  const [isHoveredLocalIndex, setIsHoveredLocalIndex] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const getHeight = (index: number) => {
    if (index % 24 === 0) {
      return isHoveredGlobal ? "10rem" : "2.5rem";
    }
    if (isHoveredLocalIndex === null) {
      return index % 24 === 0 ? "2.5rem" : "1.25rem";
    }

    const distance = Math.abs(index - isHoveredLocalIndex);
    const maxDistance = 11;
    const baseSize = 1.25;
    const peakSize = 6.5;
    const fallOff = 0.5;

    if (distance <= maxDistance) {
      const size = peakSize - fallOff * Math.pow(distance, 2);
      return `${Math.max(size, baseSize)}rem`;
    }

    return index % 24 === 0 ? "2.5rem" : `${baseSize}rem`;
  };

  return (
    <motion.div
      layout
      className="z-[1000] flex flex-row justify-between px-2 w-full h-16 overflow-x-clip"
      onHoverStart={() => setIsHoveredGlobal(true)}
      onHoverEnd={() => setIsHoveredGlobal(false)}
    >
      {Array.from(
        { length: 120 },
        (
          _,
          index // <-- Updated from 96 to 120
        ) => (
          <motion.a
            key={index}
            onClick={() => {
              const destination = labels[Math.floor(index / 24)];
              if (destination === "Login") {
                navigate("/auth/login");
              } else {
                navigate(`/${destination.toLowerCase()}`); // make sure routes like "/settings" work
              }
            }}
            className={cn(
              "relative z-20 bg-slate-800 rounded-bl-full rounded-br-full w-1.5 group transition-colors duration-150",
              index % 24 === 0 && "hover:bg-slate-500 hover:cursor-pointer"
            )}
            initial={{ height: index % 24 === 0 ? "2.5rem" : "1.25rem" }}
            animate={{ height: getHeight(index) }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              mass: 2,
            }}
            onHoverStart={() => setIsHoveredLocalIndex(index)}
            onHoverEnd={() => setIsHoveredLocalIndex(null)}
          >
            <div className="z-30 absolute inset-0 bg-blue-500 opacity-0 w-[50px] h-auto min-h-16"></div>
            {index % 24 === 0 && isHoveredGlobal && (
              <motion.span
                className="bottom-4 left-2 z-40 absolute font-bold text-slate-800 group-hover:text-slate-500 transition-colors duration-150 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 1000, damping: 5 }}
              >
                {labels[Math.floor(index / 24)]}
              </motion.span>
            )}
          </motion.a>
        )
      )}
    </motion.div>
  );
};

export default HomeNav;
