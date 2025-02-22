import {
  Disc3,
  FastForward,
  MoveUpRight,
  Pause,
  Play,
  Rabbit,
  Repeat,
  Rewind,
  SnailIcon,
  Upload,
  Volume2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
import { parseBlob } from "music-metadata";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";
import { motion } from "framer-motion";

type ControlsProps = {
  handleSongUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
};

export const Controls: React.FC<ControlsProps> = ({ handleSongUpload, audioRef, audioContextRef }) => {
  const [metadata, setMetadata] = useState<any>(null);
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slowdown, setSlowdown] = useState(1); // Initial slowdown factor
  const [currentDuration, setCurrentDuration] = useState("00:00");
  const songFile = useStore((state) => state.songFile); // Access songFile from Zustand store

  const formatDuration = (durationInSeconds: number) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSlowdownChange = (value: number[]) => {
    setSlowdown(value[0]);
    // Add your logic to handle the slowdown effect here
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = slowdown;
    }
  }, [slowdown, songFile]);

  useEffect(() => {
    const extractMetadata = async () => {
      if (songFile) {
        try {
          const metadata = await parseBlob(songFile);
          setMetadata(metadata);

          // Extract album art
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            const base64String = `data:${picture.format};base64,${Buffer.from(picture.data).toString("base64")}`;
            setAlbumArt(base64String);
          }
        } catch (error) {
          console.error("Error reading metadata:", error);
        }
      }
    };

    extractMetadata();
  }, [songFile]);

  const handlePausePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === "KeyP") {
        event.preventDefault(); // Prevent default spacebar scrolling behavior
        handlePausePlay();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    audioRef.current.addEventListener("ended", handleEnded);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      audioRef.current.removeEventListener("ended", handleEnded);
    };
  }, [isPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const updateCurrentTime = () => {
        setCurrentDuration(formatDuration(audioElement.currentTime));
      };

      const interval = setInterval(updateCurrentTime, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <motion.div layout className="flex justify-between items-center w-full h-full">
      <motion.div layout className="flex w-1/3 h-full">
        <motion.div layout className="relative flex justify-center items-center overflow-hidden aspect-square shrink-0">
          <label
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              setIsPlaying(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleSongUpload({
                  target: { files: e.dataTransfer.files },
                } as React.ChangeEvent<HTMLInputElement>);
                e.dataTransfer.clearData();
              }
            }}
            className="relative flex justify-center items-center shadow rounded-md cursor-pointer overflow-hidden aspect-square shrink-0"
          >
            <Upload className="z-20 bg-black bg-opacity-50 opacity-0 hover:opacity-100 p-2 text-white transition-opacity size-full" />
            {albumArt ? (
              <img src={albumArt} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <motion.div layout className="absolute inset-0 flex justify-center items-center bg-sky-300 w-full h-full">
                <motion.div layout className="flex justify-center items-center bg-white rounded-full w-8 h-8">
                  <Disc3
                    className={cn("absolute text-sky-300 size-6 transition-all duration-1000", {
                      "animate-spin": isPlaying,
                    })}
                  />
                </motion.div>
              </motion.div>
            )}

            <Skeleton className="-z-10 absolute inset-0" />

            <input type="file" accept="audio/*, video/*" onChange={handleSongUpload} className="hidden" />
          </label>
        </motion.div>
        <motion.div layout className="flex flex-col justify-center">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(metadata?.common.title || "Unknown Title")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group drop-shadow line-clamp-1 font-heading text-primary text-sm"
          >
            {metadata?.common.title || songFile?.name || "Unknown Title"}
            <MoveUpRight className="group-hover:visible inline-flex mb-1 ml-1 invisible size-3" />
          </a>
          <p className="line-clamp-1 text-muted-foreground text-xs">{metadata?.common.artist || "Unknown Artist"}</p>
        </motion.div>
      </motion.div>

      <motion.div layout className="place-items-center gap-0 grid grid-cols-7 w-1/3">
        <motion.div layout className="col-start-1 col-end-2"></motion.div>

        <motion.div layout className="col-start-2 col-end-3">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button layout aria-label="Loop" className="text-muted-foreground">
                  <Repeat strokeWidth={2} className="size-7" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Loop</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
        <motion.div layout className="col-start-3 col-end-4">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button layout aria-label="Rewind">
                  <Rewind className="size-10" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Rewind</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
        <motion.div layout className="col-start-4 col-end-5">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button layout aria-label="Play" onClick={handlePausePlay}>
                  {isPlaying ? <Pause className="size-10" /> : <Play className="size-10" />}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Play</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
        <motion.div layout className="col-start-5 col-end-6">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button layout aria-label="FastForward">
                  <FastForward className="size-10" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Fast Forward</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
        <motion.div layout className="flex gap-2 col-start-6 col-end-7">
          <TooltipProvider>
            <Popover>
              <PopoverTrigger className="flex justify-center items-center border-2 m-0 p-0 border-black rounded-2xl w-16 text-ellipsis text-muted-foreground whitespace-nowrap overflow-hidden">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="font-[600] text-2xl">{slowdown}x</span>
                  </TooltipTrigger>
                  <TooltipContent>Slow Down</TooltipContent>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent className="flex gap-2">
                <SnailIcon />
                <Slider
                  defaultValue={[slowdown]}
                  min={0.2}
                  max={2}
                  step={0.05}
                  onValueChange={handleSlowdownChange}
                  className="w-32 sm:w-48 md:w-64 lg:w-80 xl:w-64"
                />
                <Rabbit />
              </PopoverContent>
            </Popover>
          </TooltipProvider>
        </motion.div>
      </motion.div>

      <motion.div layout className="flex justify-end gap-4 p-2 pr-4 w-1/3">
        <motion.p layout className="text-muted-foreground text-sm">
          {currentDuration} /{" "}
          {metadata && metadata.format && metadata.format.duration ? formatDuration(metadata.format.duration) : "00:00"}
        </motion.p>

        <motion.button layout aria-label="Mute" className="flex disabled:text-muted-foreground">
          <Volume2 strokeWidth={2} />
          <motion.span layout className="w-8 font-medium text-sm">
            75%
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
