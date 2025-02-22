import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Group, Text, Rect } from "react-konva";
import useMeasure from "react-use-measure";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { useStore } from "@/lib/store";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";

type WaveFormProps = {
  audioRef: React.MutableRefObject<HTMLAudioElement>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
};

type Marker = {
  marker: number;
  notes: string;
  timestamp: number;
};

export const WaveForm = ({ audioRef, audioContextRef }: WaveFormProps) => {
  const remoteButtonRef = useRef<HTMLButtonElement>(null);
  const [ref, bounds] = useMeasure({ debounce: 100 });
  const waveformRef = useRef<{ min: number; max: number }[]>([]);
  const [zoom, setZoom] = useState(0.985);
  const [songDuration, setSongDuration] = useState(0);
  const stageRef = useRef<any>(null);
  const seekerRef = useRef<Konva.Group>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [currentMarker, setCurrentMarker] = useState<Marker | null>(null);

  const [popoverMeasureRef, popoverBounds] = useMeasure();
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const songFile = useStore((state) => state.songFile); // Access songFile from Zustand store

  const handleMarkerClick = (marker: Marker) => {
    setCurrentMarker(marker);

    if (remoteButtonRef.current) {
      const markerPosition = marker.marker; // Position in waveform
      setPopoverPosition({
        x: markerPosition,
        y: bounds.height / 2, // Adjust as needed for your layout
      });

      remoteButtonRef.current.click();
      setOpen(true);
    }
  };

  const handleFileChange = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    audioRef.current.src = objectUrl;
    audioRef.current.load(); // Load the audio file

    await constructWaveform(file, audioContextRef, waveformRef, setSongDuration);

    // Revoke the object URL after the audio is loaded to free up memory
    audioRef.current.onloadeddata = () => {
      URL.revokeObjectURL(objectUrl);
    };

    setMarkers([]);
  };

  const addMarker = () => {
    if (seekerRef.current && audioRef.current) {
      // Get the seeker's current position
      const seekerPosition = seekerRef.current.x();
      const currentTime = audioRef.current.currentTime;
      setMarkers((prevMarkers) => [...prevMarkers, { marker: seekerPosition, notes: "", timestamp: currentTime }]);
    }
  };

  const removeMarker = (marker: Marker) => {
    const updatedMarkers = markers.filter((m) => m.marker !== marker.marker);
    setMarkers(updatedMarkers);
    setOpen(false);
    setCurrentMarker(null);
  };

  useEffect(() => {
    // Add an event listener for the "M" key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        addMarker();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [audioRef, songDuration, zoom, bounds.width]);

  useEffect(() => {
    if (songFile) {
      handleFileChange(songFile);
    }
  }, [songFile]);

  const constructWaveform = async (
    file: File,
    audioContextRef: React.MutableRefObject<AudioContext | null>,
    waveformRef: React.MutableRefObject<{ min: number; max: number }[]>,
    setSongDuration: (duration: number) => void
  ) => {
    const arrayBuffer = await file.arrayBuffer();
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // Get the first channel (only process mono audio)
    const numberOfChunks = 300; // Number of samples to display
    const chunkSize = Math.ceil(channelData.length / numberOfChunks);

    const waveformData: { min: number; max: number }[] = [];

    for (let i = 0; i < numberOfChunks; i++) {
      const chunk = channelData.slice(i * chunkSize, (i + 1) * chunkSize);
      const min = Math.min(...chunk);
      const max = Math.max(...chunk);
      waveformData.push({ min, max });
    }

    waveformRef.current = waveformData;
    setSongDuration(audioBuffer.duration); // Set the song duration in seconds
  };

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    // Ensure the x position is not greater than 0
    const constrainedX = Math.min(pos.x, 18);

    return {
      x: constrainedX,
      y: 0, // Restrict y-axis movement
    };
  };

  const renderGrid = (duration: number) => {
    if (duration <= 0) return []; // Return an empty array if no song is uploaded

    const interval = 1; // Interval in seconds
    let intervalEmphasis;

    if (duration < 30) {
      intervalEmphasis = 5; // Emphasis every 5 seconds for short songs
    } else if (duration < 120) {
      intervalEmphasis = 10; // Emphasis every 10 seconds for medium-length songs
    } else {
      intervalEmphasis = 30; // Emphasis every 30 seconds for long songs
    }

    const gridLines = [];
    for (let i = 0; i <= duration * 1; i += interval) {
      const x = (i / duration) * bounds.width;
      const minutes = Math.floor(i / 60);
      const seconds = i % 60;
      const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      const lineLength = i % 5 === 0 ? 25 : 10;

      gridLines.push(
        <React.Fragment key={`grid-fragment-${i}`}>
          {/* Top segment of the grid line */}
          <Line
            key={`grid-top-${i}`}
            points={[x, 0, x, lineLength]}
            stroke="rgba(0, 0, 0, 0.2)" // Light gray with transparency
            strokeWidth={1.5} // Slightly thicker
          />
          {/* Bottom segment of the grid line */}
          <Line
            key={`grid-bottom-${i}`}
            points={[x, bounds.height - lineLength, x, bounds.height]}
            stroke="rgba(0, 0, 0, 0.2)" // Light gray with transparency
            strokeWidth={1.5} // Slightly thicker
          />
          {/* Text label below the line */}
          {i % intervalEmphasis === 0 && (
            <Text
              key={`label-${i}`}
              x={x}
              y={bounds.height - 40}
              text={label}
              fontSize={12} // Slightly larger font size
              fill="#555" // Dark gray color
              scaleX={1 / zoom}
              offsetX={label.length * 3}
            />
          )}
        </React.Fragment>
      );
    }
    return gridLines;
  };
  const handleZoom = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = zoom;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const limitedScale = Math.max(0.5, Math.min(4, newScale));

    // Directly set the scale of the stage
    stage.scale({ x: limitedScale, y: 1 });

    // Update the zoom state
    setZoom(limitedScale);

    // Batch draw to apply the changes instantly
    stage.batchDraw();
  };

  useEffect(() => {
    // Function to continuously sync the seeker with the audio playback
    const syncSeekerWithAudio = () => {
      if (audioRef.current && seekerRef.current && bounds.width) {
        const currentTime = audioRef.current.currentTime;

        // Calculate the seeker's position relative to the current zoom level
        const scaledWidth = bounds.width * zoom;
        let newPosition = (currentTime / songDuration) * scaledWidth;

        if (isNaN(newPosition) || !isFinite(newPosition)) {
          newPosition = 0; // or some default value
        }

        // Update the seeker's position on the canvas
        seekerRef.current.x(newPosition);
        seekerRef.current.to({
          x: newPosition,
          duration: 0.3, // Duration of the transition
          easing: Konva.Easings.EaseInOut, // Easing function for smooth transition
        });

        // seekerRef.current.getLayer()?.batchDraw(); // Redraw the layer for smooth updates
      }
      // Continuously update seeker position in the next animation frame
      requestAnimationFrame(syncSeekerWithAudio);
    };

    // Start syncing the seeker
    const animationFrame = requestAnimationFrame(syncSeekerWithAudio);

    // Cleanup: cancel the animation frame when component unmounts or dependencies change
    return () => cancelAnimationFrame(animationFrame);
  }, [zoom, songDuration, bounds.width]); // Dependencies

  //this handles dragEnd autoscroll
  useEffect(() => {
    let autoScrollInterval: NodeJS.Timeout;

    const stage = stageRef.current;
    const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
      const duration = 1000 / 60;
      autoScrollInterval = setInterval(() => {
        const pos = stage.getPointerPosition();
        const offset = 10;
        const isNearRight = pos.x > stage.width() - offset;

        if (isNearRight) {
          stage.x(stage.x() - 3 * zoom);
          e.target.x(e.target.x() + 3 * zoom);
        }
      }, duration);
    };

    const handleDragEnd = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };

    stage.on("dragstart", handleDragStart);
    stage.on("dragend", handleDragEnd);

    return () => {
      stage.off("dragstart", handleDragStart);
      stage.off("dragend", handleDragEnd);
    };
  }, []);

  return (
    <div className="box-border flex flex-col border-2 border-gray-700 rounded-lg w-full h-full">
      <div ref={ref} className="w-full h-full overflow-x-auto">
        <Stage
          width={bounds.width}
          height={bounds.height}
          ref={stageRef}
          className="bg-white rounded-lg"
          x={18}
          dragBoundFunc={dragBoundFunc}
          draggable
        >
          <Layer>
            <Group
              scaleX={zoom}
              onWheel={handleZoom}
              onClick={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  const pointerPosition = stage.getRelativePointerPosition();
                  if (pointerPosition) {
                    console.log("zoom level", zoom);
                    console.log("pointerPosition", pointerPosition);
                    const clickX = pointerPosition.x;
                    const scaledWidth = bounds.width * zoom;
                    const newTime = (clickX / scaledWidth) * songDuration;
                    if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                    }
                  }
                }
              }}
            >
              <Rect x={0} y={0} width={bounds.width} height={bounds.height} fill="transparent" />
              {renderGrid(songDuration)}

              {waveformRef.current.map((value, index) => {
                const x = index * (bounds.width / waveformRef.current.length);

                return (
                  <React.Fragment key={`waveform-fragment-${index}`}>
                    <Line
                      key={`top-${index}`}
                      points={[
                        x,
                        bounds.height / 2 - (value.max * (bounds.height - 100)) / 2, //HERE 100 IS PADDING VALUE
                        x,
                        bounds.height / 2 - (value.min * (bounds.height - 100)) / 2,
                      ]}
                      stroke="#7dd3fc"
                      strokeWidth={2}
                      lineCap="round"
                      lineJoin="miter"
                      tension={1}
                    />
                  </React.Fragment>
                );
              })}
            </Group>
          </Layer>
          {/* Marker layer*/}

          <Layer>
            {/* This group is for seeker / scrubber / timeline cursor */}
            <Group
              ref={seekerRef}
              scaleX={1 / zoom}
              draggable
              onDragMove={(e) => {
                // Calculate the new time based on seeker's x position
                const scaledWidth = bounds.width * zoom; // Adjust for zoom
                const maxX = scaledWidth; // Maximum x position based on song's duration, accounting for stage's x position
                const newPositionX = Math.max(0, Math.min(e.target.x(), maxX)); // Restrict x-axis movement to the song's end

                // Restrict y-axis movement to 0
                const newPositionY = 0;

                // Update the seeker's position
                e.target.x(newPositionX);
                e.target.y(newPositionY);

                // Calculate new time based on the restricted x position
                const newTime = (newPositionX / scaledWidth) * songDuration;

                // Update the audio currentTime
                audioRef.current.currentTime = newTime;
              }}
            >
              <Rect
                x={-6.25 * 3}
                y={0}
                width={12.5 * 3}
                height={15}
                fill="transparent"
                onDblClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                  }
                }}
              />
              <Line
                points={[0, 25, 0, bounds.height]} // Adjust the x position as needed
                stroke="#e11d48"
                strokeWidth={1}
              />

              <Line
                points={[
                  6.25,
                  1, // Point B
                  6.25,
                  18.75, // Point C
                  0,
                  25, // Point D
                  -6.25,
                  18.75, // Point E
                  -6.25,
                  1, // Back to Point A to close the shape
                ]}
                fill="rgba(225, 29, 72, 0.5)"
                stroke="rgba(225, 29, 72, 1)"
                strokeWidth={1}
                closed
                style
                tension={0.2} // Adjust tension to round the corners
                onMouseEnter={(e) => {
                  const container = e.target.getStage()!.container();
                  container.style.cursor = "grab";
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()!.container();
                  container.style.cursor = "default";
                }}
                onMouseDown={(e) => {
                  const container = e.target.getStage()!.container();
                  container.style.cursor = "grabbing";
                }}
                onMouseUp={(e) => {
                  const container = e.target.getStage()!.container();
                  container.style.cursor = "grab";
                }}
                onDblClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                  }
                }}
              />
            </Group>
          </Layer>
          <Layer>
            {markers.map((marker, index) => (
              <Group
                scaleX={1 / zoom}
                key={`marker-${index}`}
                onClick={(e) => {
                  if (e.evt.button === 0) {
                    // Check if the left mouse button was clicked
                    console.log(`marker-${index}`);
                    handleMarkerClick(marker);
                  }
                }}
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  removeMarker(marker);
                }}
                x={(marker.timestamp / audioRef.current.duration) * bounds.width * zoom}
              >
                <Line
                  points={[
                    +6.25,
                    1, // Point B
                    +6.25,
                    18.75, // Point C
                    0,
                    25, // Point D
                    -6.25,
                    18.75, // Point E
                    -6.25,
                    1, // Back to Point A to close the shape
                  ]}
                  fill="rgba(225, 165, 0, 0.5)"
                  stroke="rgba(225, 165, 0, 1)"
                  strokeWidth={1}
                  closed
                  style
                  tension={0.2} // Adjust tension to round the corners
                />
                <Rect
                  x={marker.marker - 5} // Adjust the x position to center the rectangle
                  y={0}
                  width={10} // Adjust the width as needed
                  height={bounds.height}
                  // fill={"blue"}
                  // opacity={0.2}
                />
                <Line key={`marker-${index}`} points={[0, 25, 0, bounds.height]} stroke="orange" strokeWidth={1} />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button ref={remoteButtonRef} className="hidden">
            Open Popover
          </button>
        </PopoverTrigger>
        <PopoverContent
          ref={popoverMeasureRef}
          className="absolute bg-white"
          style={{ left: popoverPosition.x, top: popoverPosition.y }}
        >
          <>
            <div className="flex gap-2">
              <Textarea
                className="flex-none border-black w-[90%]"
                value={currentMarker?.notes || ""}
                onKeyDown={(e) => e.stopPropagation()} // Stop propagation of keydown events
                onChange={(e) => {
                  if (currentMarker) {
                    setCurrentMarker({
                      ...currentMarker,
                      notes: e.target.value,
                    });
                  }
                }}
              />
              <Trash2Icon
                onClick={() => {
                  if (currentMarker) {
                    removeMarker(currentMarker);
                  }
                }}
                className="text-rose-600 transform transition-transform duration-150 cursor-pointer active:scale-75"
              />
            </div>

            <div className="flex justify-start mt-2">
              <span className="text-gray-600">
                {currentMarker
                  ? (() => {
                      const timestamp = currentMarker.timestamp;
                      const hours = Math.floor(timestamp / 3600);
                      const minutes = Math.floor((timestamp % 3600) / 60);
                      const seconds = Math.floor(timestamp % 60);
                      const pad = (num: number) => String(num).padStart(2, "0");
                      return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
                    })()
                  : "No timestamp available"}
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                onClick={() => {
                  setOpen(false);
                  setCurrentMarker(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentMarker) {
                    const index = markers.findIndex((m) => m.marker === currentMarker.marker);
                    if (index !== -1) {
                      const updatedMarkers = [...markers];
                      updatedMarkers[index] = currentMarker;
                      setMarkers(updatedMarkers);
                    }
                    setOpen(false);
                    setCurrentMarker(null);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </>
        </PopoverContent>
      </Popover>
    </div>
  );
};
