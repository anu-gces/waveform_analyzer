import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Minus, Plus, Volume, Volume1, Volume1Icon, Volume2, VolumeX } from "lucide-react";
import { notesDictionary } from "./noteDictionary";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

const generateNotes = (maxOctave: number) => {
  const notes = [];
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  let octave = 1; // Start from C1
  let i = 0;

  while (octave <= maxOctave) {
    const note = noteNames[i % 12];
    if (note === "C" && i !== 0) {
      octave++;
      if (octave > maxOctave) break;
    }
    notes.push(`${note}${octave}`);
    i++;
  }

  notes.push(`C${maxOctave + 1}`);

  return notes;
};

const notes = generateNotes(6); // this generates C0 to C6+1 so an extra C note which is C7
const isBlackKey = (note: string) => note.includes("#");

export const PianoRoll = () => {
  const [visibleKeys, setVisibleKeys] = useState(2.3263);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [volume, setVolume] = useState(100);
  const zoomingDivRef = useRef<HTMLDivElement | null>(null);
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const gainNode = audioContext.createGain();

  // Set the initial gain value based on the volume
  gainNode.gain.setValueAtTime(volume / 100, audioContext.currentTime);
  gainNode.connect(audioContext.destination);

  const whiteKeyWidth = visibleKeys;
  const blackKeyWidth = whiteKeyWidth / 2;
  const blackKeyMargin = blackKeyWidth / 2;

  const playNote = (note: string) => {
    const frequency = notesDictionary[note];
    if (!frequency) return;

    const oscillator = audioContext.createOscillator();
    oscillator.type = "square"; // Set oscillator type (could also use "square", "triangle", etc.)
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode); // Connect the oscillator to the gain node

    oscillator.start();
    const fadeOutDuration = 0.3; // Duration of the fade-out in seconds
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5 - fadeOutDuration);
    oscillator.stop(audioContext.currentTime + 0.2); // Set note duration
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
      if (element && element.dataset && element.dataset.note) {
        const note = element.dataset.note;
        setCurrentNote(note); // Store the current note
        playNote(note);
      }
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (currentNote) {
      const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
      if (element && element.dataset && element.dataset.note) {
        const note = element.dataset.note;
        if (note !== currentNote) {
          playNote(note); // Play the new note
          setCurrentNote(note); // Update the current note
        }
      }
    }
  };

  const handleMouseUp = () => {
    setCurrentNote(null); // Reset current note on mouse up
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [currentNote]);

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      setVisibleKeys((prevVisibleKeys) => {
        const newVisibleKeys = prevVisibleKeys + delta;
        return Math.max(2.3263, Math.min(10, newVisibleKeys)); // Limit the zoom between 2 and 10
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    gainNode.gain.setValueAtTime(newVolume / 100, audioContext.currentTime); // Update gain based on new volume
  };

  return (
    <div className="relative z-0 bg-black bg-opacity-80 pt-8 rounded-md w-full h-full">
      <div className="top-2 right-2 absolute flex justify-between gap-1">
        {volume === 0 ? (
          <VolumeX stroke="gray" />
        ) : volume > 0 && volume <= 33 ? (
          <Volume stroke="gray" />
        ) : volume > 33 && volume <= 66 ? (
          <Volume1 stroke="gray" />
        ) : (
          <Volume2 stroke="gray" />
        )}
        <Slider
          defaultValue={[80]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="w-32 sm:w-48 md:w-64 lg:w-80 xl:w-64"
          trackColor="bg-black/20"
          rangeColor="bg-black/65"
        />
        <Button
          onClick={() => setVisibleKeys(visibleKeys - 2)}
          disabled={visibleKeys <= 3}
          size="icon"
          className="bg-black/65 hover:bg-black/20 rounded-full w-6 h-6 text-white"
        >
          <Minus className="size-3" />
        </Button>
        <Button
          size="icon"
          onClick={() => setVisibleKeys(visibleKeys + 2)}
          disabled={visibleKeys >= 10}
          className="bg-black/65 hover:bg-black/20 rounded-full w-6 h-6 text-white"
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div
        className={cn("flex flex-row pt-2 pb-2 w-full overflow-x-auto h-full")}
        onMouseDown={handleMouseDown}
        ref={zoomingDivRef}
        onMouseEnter={() => {
          if (zoomingDivRef.current) {
            zoomingDivRef.current.addEventListener("wheel", handleWheel, {
              passive: false,
            });
          }
        }}
        onMouseLeave={() => {
          if (zoomingDivRef.current) {
            zoomingDivRef.current.removeEventListener("wheel", handleWheel);
          }
        }}
      >
        {notes.map((note) => (
          <button
            key={note}
            className={cn(
              "select-none active:scale-[98%] transition-all border-2 rounded-b-md flex justify-center items-end border-black",
              {
                "text-white bg-black h-2/3 z-10 hover:bg-green-400": isBlackKey(note),
                "bg-gray-200": !isBlackKey(note),
                "font-bold": note.startsWith("C"),
                "hover:bg-green-300": true,
              }
            )}
            style={{
              minWidth: `${isBlackKey(note) ? blackKeyWidth : whiteKeyWidth}%`,
              ...(isBlackKey(note) && {
                marginLeft: `-${blackKeyMargin}%`,
                marginRight: `-${blackKeyMargin}%`,
              }),
            }}
            data-note={note}
          >
            <span className="text-xs sm:text-xs md:text-xs xl:text-lg lg:text-xs" data-note={note}>
              {note.startsWith("C") && !note.includes("#") ? note : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
