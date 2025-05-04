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
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
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

export const Controls: React.FC<ControlsProps> = ({ handleSongUpload, audioRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [slowdown, setSlowdown] = useState(1);
  const [volume, setVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  const songFile = useStore((state) => state.songFile);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSlowdownChange = (value: number[]) => {
    setSlowdown(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX strokeWidth={2} />;
    if (volume <= 33) return <Volume strokeWidth={2} />;
    if (volume <= 66) return <Volume1 strokeWidth={2} />;
    return <Volume2 strokeWidth={2} />;
  };

  const handlePausePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLoop = () => {
    audioRef.current.loop = !audioRef.current.loop;
    setIsLooping(audioRef.current.loop);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = slowdown;
    }
  }, [slowdown, songFile]);

  useEffect(() => {
    const audioElement = audioRef.current;

    const updateTimes = () => {
      setCurrentTime(audioElement.currentTime);
      setDuration(audioElement.duration || 0);
    };

    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener("timeupdate", updateTimes);
    audioElement.addEventListener("loadedmetadata", updateTimes);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", updateTimes);
      audioElement.removeEventListener("loadedmetadata", updateTimes);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [audioRef]);

  return (
    <motion.div layout className="flex justify-between items-center w-full h-full">
      {/* Upload and Song Info */}
      <motion.div layout className="flex w-1/3 h-full">
        <motion.div layout className="relative flex justify-center items-center aspect-square overflow-hidden shrink-0">
          <label
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
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
            className="relative flex justify-center items-center shadow rounded-md aspect-square overflow-hidden cursor-pointer shrink-0"
          >
            <Upload className="z-20 bg-black bg-opacity-50 opacity-0 hover:opacity-100 p-2 size-full text-white transition-opacity" />

            <motion.div layout className="absolute inset-0 flex justify-center items-center bg-sky-300 w-full h-full">
              <motion.div layout className="flex justify-center items-center bg-white rounded-full w-8 h-8">
                <Disc3
                  className={cn("absolute text-sky-300 size-6 transition-all duration-1000", {
                    "animate-spin": isPlaying,
                  })}
                />
              </motion.div>
            </motion.div>

            <Skeleton className="-z-10 absolute inset-0" />
            <input type="file" accept="audio/*" onChange={handleSongUpload} className="hidden" />
          </label>
        </motion.div>
        <motion.div layout className="flex flex-col justify-center ml-1">
          <p className="font-heading text-primary text-sm line-clamp-1">{songFile?.name || "No Song Loaded"}</p>
          <p className="text-muted-foreground text-xs line-clamp-1">
            {" "}
            {songFile ? songFile.name.split(".").pop()?.toUpperCase() + " FILE" : "NO FILE"}
          </p>
        </motion.div>
      </motion.div>

      {/* Playback Controls */}
      <motion.div layout className="place-items-center gap-0 grid grid-cols-7 w-1/3">
        <motion.div layout />
        <motion.div layout>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button layout aria-label="Loop" onClick={toggleLoop} className="text-muted-foreground">
                  <Repeat strokeWidth={2} className={`size-7 ${isLooping ? "text-emerald-500" : ""}`} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Loop</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
        <motion.div layout>
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
        <motion.div layout>
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
        <motion.div layout>
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
          <Popover>
            <PopoverTrigger className="flex justify-center items-center m-0 p-0 border-2 border-black rounded-2xl w-16 overflow-hidden text-muted-foreground text-ellipsis whitespace-nowrap">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="font-[600] text-2xl">{slowdown}x</span>
                  </TooltipTrigger>
                  <TooltipContent>Slow Down</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
        </motion.div>
      </motion.div>

      {/* Duration and Volume */}
      <motion.div layout className="flex justify-end gap-4 p-2 pr-4 w-1/3">
        <motion.p layout className="text-muted-foreground text-sm">
          {formatDuration(currentTime)} / {duration ? formatDuration(duration) : "00:00"}
        </motion.p>
        <Popover>
          <PopoverTrigger asChild>
            <motion.button layout aria-label="Volume" className="flex disabled:text-muted-foreground">
              {getVolumeIcon()}
              <motion.span layout className="w-8 font-medium text-sm">
                {volume}%
              </motion.span>
            </motion.button>
          </PopoverTrigger>
          <PopoverContent className="flex gap-2">
            {getVolumeIcon()}
            <Slider
              defaultValue={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-32 sm:w-48 md:w-64 lg:w-80 xl:w-64"
            />
          </PopoverContent>
        </Popover>
      </motion.div>
    </motion.div>
  );
};
