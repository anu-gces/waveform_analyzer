import React, { useEffect, useRef } from "react";

import { Controls } from "../components/controls";
import { PianoRoll } from "../components/pianoRoll";
import { WaveForm } from "../components/waveForm";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { useStore } from "../lib/store";
import { FrequencyGraph } from "./frequencyGraph";
import defaultSong from "../assets/cats in the cold.mp3";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Transcription = () => {
  const setSongFile = useStore((state) => state.setSongFile);
  const { projectId } = useParams();

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

  const {
    data: project,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      console.log(`Fetching project with ID: ${projectId}`); // Log the project ID before sending the request

      const res = await fetch(`http://localhost:8000/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  useEffect(() => {
    if (!isSuccess || !project) return;

    const loadSong = async () => {
      try {
        const res = await fetch(`http://localhost:8000${project.song_url}`);
        const blob = await res.blob();
        const parts = project.song_url.split("_");
        const originalName = parts.slice(1).join("_"); // remove UUID prefix
        const file = new File([blob], originalName, { type: "audio/mp3" });
        setSongFile(file);
        audioRef.current.src = URL.createObjectURL(file);
      } catch {
        toast.error("Failed to load song file.");
      }
    };

    loadSong();
  }, [isSuccess, project, setSongFile]);

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
