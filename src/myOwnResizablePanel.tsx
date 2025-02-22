import { useState, useEffect, useRef, useCallback } from "react";
import { Controls } from "./components/controls";
import { PianoRoll } from "./components/pianoRoll";

import "./index.css";

import { cn } from "./lib/utils";
import TimelineGrid from "./components/waveForm";

const RealWaveform = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResize = useCallback(() => {
    if (audioBufferRef.current) {
      drawWaveform(audioBufferRef.current); // Redraw waveform on resize
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      handleResize(); // Trigger the redraw on canvas resize
    });

    resizeObserver.observe(canvas);

    return () => {
      if (canvas) resizeObserver.unobserve(canvas); // Cleanup observer on unmount
    };
  }, [handleResize]);

  // Function to handle audio file input and draw waveform
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      setLoading(true);
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        audioBufferRef.current = await audioContext.decodeAudioData(
          arrayBuffer
        );

        drawWaveform(audioBufferRef.current);
      } catch (error) {
        console.error("Error processing audio file:", error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to draw waveform on canvas
  const drawWaveform = (audioBuffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    // Adjust for device pixel ratio (high-DPI screens)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvasCtx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear previous drawing
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillStyle = "#cbd5e1";
    canvasCtx.fillRect(0, 0, width, height); // Fill the entire canvas

    // Get audio data from the buffer
    const rawData = audioBuffer.getChannelData(0); // Get data from the first channel
    const step = Math.ceil(rawData.length / (width * 1)); // Step size for each pixel
    const amp = height / 2; // Amplify based on height

    // Set up canvas styling for the waveform
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "orange";
    canvasCtx.beginPath();

    // Draw the waveform
    for (let i = 0.5; i < width; i++) {
      const start = i * step;
      const end = (i + 1) * step;
      const slice = rawData.slice(start, end);

      const min = Math.min(...slice);
      const max = Math.max(...slice);

      // Scale to fit the canvas
      canvasCtx.moveTo(i, (1 + min) * amp);
      canvasCtx.lineTo(i, (1 + max) * amp);
    }

    canvasCtx.stroke();

    // Draw the horizontal line in the middle (this is the 'X' thing)
    canvasCtx.strokeStyle = "white"; // Color of the middle line
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, height / 2); // Start from the left edge
    canvasCtx.lineTo(width, height / 2); // Draw to the right edge
    canvasCtx.stroke();
  };

  return (
    <div className="flex flex-col w-full max-w-full h-full overflow-x-scroll">
      <input type="file" accept="audio/*" onChange={handleFileInput} />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        width={window.innerWidth * 2} // Double the width for higher resolution
        height={window.innerHeight * 2} // Double the height for higher resolution
      ></canvas>
    </div>
  );
};

// export default function App() {
//   return (
//     <>
//       <TimelineGrid />
//     </>
//   );
// }

export default function App() {
  const resizableRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [waveformHeight, setWaveformHeight] = useState("50%");
  const [pianoRollHeight, setPianoRollHeight] = useState("50%");

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const containerHeight =
      resizableRef.current?.parentElement?.offsetHeight || 0;
    const newWaveformHeight =
      ((e.clientY / containerHeight) * 100).toFixed(2) + "%";
    const newPianoRollHeight =
      (100 - parseFloat(newWaveformHeight)).toFixed(2) + "%";
    setWaveformHeight(newWaveformHeight);
    setPianoRollHeight(newPianoRollHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="relative flex flex-col w-screen h-screen">
      <div className="flex flex-col flex-grow w-full overflow-hidden">
        <div
          className="w-full"
          style={{ height: waveformHeight, maxHeight: "90%" }}
        >
          <RealWaveform />
        </div>

        <div
          ref={resizableRef}
          className={cn(
            "border-t-4 border-purple-500 w-full cursor-row-resize transition-all duration-200",
            {
              "opacity-100": isResizing,
              "opacity-0 hover:opacity-100 focus:opacity-100 active:opacity-100":
                !isResizing,
            }
          )}
          onMouseDown={handleMouseDown}
        ></div>

        <div
          className="flex-1 w-full"
          style={{ height: pianoRollHeight, minHeight: "10%" }}
        >
          <PianoRoll />
        </div>
      </div>

      <div className="flex-shrink-0 w-full h-20">
        <Controls />
      </div>
    </div>
  );
}
