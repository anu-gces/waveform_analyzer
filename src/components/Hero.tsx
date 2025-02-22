import { easeInOut, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Link, useLocation } from "wouter";
import { KeyboardMusicIcon, Music, Music2, Music3, Music4, Piano, PianoIcon, Volume2, VolumeX } from "lucide-react";
import catsong from "../assets/cats in the cold.mp3";

const HeroWave = () => {
  const dots = Array.from({ length: 100 }, (_, index) => index); // 100 dots
  const [heights, setHeights] = useState<number[]>(new Array(dots.length).fill(2));
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioAllowed, setAudioAllowed] = useState(false);

  // Simulate audio frequency changes by updating the height of random dots
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update the height of multiple dots at once
      const newHeights = [...heights];
      for (let i = 0; i < 5; i++) {
        // Randomly modify 5 dots per interval
        const randomIndex = Math.floor(Math.random() * dots.length);
        newHeights[randomIndex] = Math.random() * 100 + 2; // Random height between 2 and 50
      }
      setHeights(newHeights);
    }, 100); // Update every 100ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, [heights]);

  const handleToggleAudio = () => {
    setAudioAllowed(!audioAllowed);
    if (audioRef.current) {
      if (!audioAllowed) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reset to start
      }
    }
  };

  return (
    <div className="flex justify-center items-center gap-1 w-full h-64 self-center">
      <Button
        variant={"ghost"}
        onClick={handleToggleAudio}
        className="top-0 right-0 absolute p-0 rounded-full w-12 h-12"
      >
        {audioAllowed ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>
      <audio ref={audioRef} src={catsong} loop />

      <div className="bg-slate-700 rounded-full w-[8px] h-0.5"></div>
      <div className="bg-slate-700 rounded-full w-[8px] h-0.5"></div>
      <div className="bg-slate-700 rounded-full w-[8px] h-0.5"></div>

      {dots.map((dot, index) => (
        <motion.div
          key={dot}
          className="bg-slate-700 rounded-full h-2 aspect-square"
          animate={{
            height: heights[index], // Dynamic height based on the state
          }}
          transition={{
            duration: 0.1, // Quick animation for fluidity
            ease: "easeOut",
          }}
          style={{ width: "8px" }} // Keep the width small for the dots
        />
      ))}

      <div className="bg-slate-700 rounded-full w-[8px] h-0.5"></div>
      <div className="bg-slate-700 rounded-full w-[8px] h-0.5"></div>
      <div className="bg-slate-700 rounded-full w-[8px] h-0.5"></div>
    </div>
  );
};

const FloatyIconsGenerator = () => {
  const musicIcons = [
    <Music className="text-slate-700" />,
    <Music2 className="text-slate-700" />,
    <Music3 className="text-slate-700" />,
    <Music4 className="text-slate-700" />,
  ];
  return Array.from({ length: 15 }, (_, index) => {
    const randomIcon = musicIcons[Math.floor(Math.random() * musicIcons.length)]; // Pick a random icon
    const randomSize = Math.random() * (1.5 - 0.8) + 0.8; // Randomize size between 0.8 and 1.5
    const randomSpeed = Math.random() * (4 - 2) + 2; // Randomize duration between 2s and 4s
    const randomX = Math.random() * 100; // Random horizontal position
    const randomY = Math.random() * 100; // Random vertical position
    const randomDelay = Math.random() * 2; // Random delay for each icon

    return (
      <motion.div
        key={index}
        className="absolute"
        initial={{
          opacity: 0, // Start invisible
          y: 50, // Start slightly lower
          scale: 0.8, // Start smaller
        }}
        animate={{
          opacity: [0, 1, 0], // Fade in and out
          y: [50, -50, -100], // Move upwards
          scale: [0.8, randomSize, 1], // Randomize size changes
        }}
        transition={{
          duration: randomSpeed, // Randomize speed
          repeat: Infinity, // Infinite loop for continuous flow
          repeatType: "loop", // Loop repeat for continuous effect
          ease: "easeInOut", // Smooth easing
          delay: randomDelay, // Random delay
        }}
        style={{
          left: `${randomX}%`, // Random horizontal position
          top: `${randomY}%`, // Random vertical position
        }}
      >
        {randomIcon} {/* Display a random music icon */}
      </motion.div>
    );
  });
};

const Hero = () => {
  return (
    <motion.div layout className="flex flex-col justify-center items-center gap-4 w-full h-full text-center">
      <div className="relative">
        <motion.h1 layout className="relative z-10 drop-shadow-lg mb-4 font-bold text-5xl text-slate-800">
          PitchForge
          <KeyboardMusicIcon
            className="absolute w-32 h-8 text-gray-500"
            style={{ bottom: "-22px", left: "56%", transform: "translateX(-50%)" }}
          />
        </motion.h1>
        <Music className="top-0 left-0 z-0 absolute w-6 h-6 text-gray-500" />
        <Music2 className="top-0 right-0 z-0 absolute w-6 h-6 text-gray-500" />
        <Music3 className="bottom-0 left-0 z-0 absolute w-6 h-6 text-gray-500" />
        <Music4 className="right-0 bottom-0 z-0 absolute w-6 h-6 text-gray-500" />
        <motion.div
          className="top-1/2 left-1/4 z-0 absolute w-6 h-6 text-gray-500 transform -translate-y-1/2"
          animate={{ scale: [1, 1.05, 1.1, 1.05, 1] }}
          transition={{ type: easeInOut, repeat: Infinity, duration: 2 }}
        >
          <Music />
        </motion.div>
        <Music2 className="top-1/2 right-1/4 z-0 absolute w-6 h-6 text-gray-500 transform -translate-y-1/2" />
      </div>
      <motion.p layout className="mb-4 text-2xl text-gray-700 italic">
        Transform your music into written notes effortlessly with pitchForge—your go-to app for intuitive transcription
        and musical analysis.
      </motion.p>
      <motion.p layout className="mb-8 text-gray-600 text-lg">
        Whether you’re transcribing your favorite riffs or learning new tunes, PitchForge makes it easier than ever.
      </motion.p>

      {/* Button with Icon Animation on Hover */}
      <motion.div layout className="relative">
        <HeroWave />
        <PianoButton />
        <FloatyIconsGenerator />
      </motion.div>
    </motion.div>
  );
};

const PianoButton = () => {
  const [hovered, setHovered] = useState(false); // Track hover state

  return (
    <Link href="/auth/signup">
      <div
        className="relative flex justify-center items-center gap-0 m-0 p-0"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="flex-shrink bg-green-500 opacity-0 w-full h-10 cursor-default"
          onMouseEnter={() => setHovered(false)}
          onMouseLeave={() => setHovered(true)}
        ></div>
        {/* Left Span */}
        <motion.span
          className="flex flex-grow justify-end items-center bg-slate-800 pr-0.5 rounded-tl-lg rounded-bl-lg w-28 h-10 text-gray-100"
          animate={{ x: hovered ? "-100%" : "0px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          Sign
        </motion.span>
        {/* Center Piano */}
        <motion.div
          className={`absolute flex items-center justify-center h-10 w-[7.1rem] bg-slate-300 rounded z-[-1]`}
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* White Keys */}
          <div className="relative flex w-full h-full">
            {[...Array(7)].map((_, i) => (
              <div key={`white-${i}`} className="border-gray-300 bg-white border-r w-[1.142rem] h-full"></div>
            ))}
            {/* Black Keys */}
            {[1, 2, 4, 5, 6].map((pos) => (
              <div
                key={`black-${pos}`}
                className="top-0 left-1/2 absolute bg-black rounded-bl-[2px] rounded-br-[2px] w-[calc(1.142rem/2)] h-5 transform -translate-x-1/2"
                style={{ left: `${pos * 14.28}%` }}
              ></div>
            ))}
          </div>
        </motion.div>
        {/* Right Span */}
        <motion.span
          className="z-[20] flex flex-grow justify-start items-center bg-slate-800 pl-1.5 rounded-tr-lg rounded-br-lg w-28 h-10 text-gray-100"
          animate={{ x: hovered ? "100%" : "0px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          Up
        </motion.span>
        <div
          className="z-[10] flex-shrink bg-green-500 opacity-0 w-full h-10 cursor-default"
          onMouseEnter={() => setHovered(false)}
          onMouseLeave={() => setHovered(true)}
        ></div>
      </div>
    </Link>
  );
};

export default Hero;
