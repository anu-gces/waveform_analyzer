import React, { useEffect, useRef } from "react";

import { Controls } from "../components/controls";
import { PianoRoll } from "../components/pianoRoll";
import { WaveForm } from "../components/waveForm";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { useStore } from "../lib/store";
import { FrequencyGraph } from "./frequencyGraph";
import { useSearch } from "wouter";

const Transcription = () => {
  const setSongFile = useStore((state) => state.setSongFile);

  const searchString = useSearch();

  const audioRef = useRef(new Audio());
  const audioContextRef = useRef<AudioContext | null>(
    new (window.AudioContext || (window as any).webkitAudioContext)()
  );

  const handleSongUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setSongFile(selectedFile);
    }
  };

  useEffect(() => {
    console.log("projectID", searchString);
  }, [searchString]);

  return (
    <div className="z-10 relative flex flex-col m-0 p-0 w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={40} minSize={20} className="max-w-full">
          <WaveForm audioRef={audioRef} audioContextRef={audioContextRef} />
        </ResizablePanel>
        {/* <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <FFTGraph audioRef={audioRef} audioContextRef={audioContextRef} />
        </ResizablePanel> */}
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <FrequencyGraph audioRef={audioRef} audioContextRef={audioContextRef} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <PianoRoll />
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className="border-box w-full h-[3.8rem]">
        <Controls audioRef={audioRef} audioContextRef={audioContextRef} handleSongUpload={handleSongUpload} />
      </div>
    </div>
  );
};

export default Transcription;
