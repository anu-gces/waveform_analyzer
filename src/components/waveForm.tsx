import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Group, Text, Rect } from "react-konva";
import useMeasure from "react-use-measure";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { useStore } from "@/lib/store";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { AlertCircle, Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";
// @ts-ignore
import debounce from "lodash.debounce";
import { LoadingSpinner2 } from "./loadingSpinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRoute } from "wouter";
import { toast } from "sonner";

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
  const [zoom, _setZoom] = useState(0.985);
  const [songDuration, setSongDuration] = useState(0);
  const stageRef = useRef<any>(null);
  const seekerRef = useRef<Konva.Group>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [currentMarker, setCurrentMarker] = useState<Marker | null>(null);
  const [selection, setSelection] = useState<{ initialTime: number; finalTime: number } | null>(null);
  const [isMousePressed, setIsMousePressed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [popoverMeasureRef, _popoverBounds] = useMeasure();
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const [match, params] = useRoute("/transcription/:id");
  const projectId = params!.id;
  const queryClient = useQueryClient();

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

  const { data } = useQuery({
    queryKey: ["markers", projectId],
    queryFn: () => axios.get(`http://localhost:8000/projects/${projectId}/markers`).then((res) => res.data),
  });

  const handleFileChange = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    audioRef.current.src = objectUrl;
    audioRef.current.load(); // Load the audio file

    await constructWaveform(file, audioContextRef, waveformRef, setSongDuration);

    // Revoke the object URL after the audio is loaded to free up memory
    audioRef.current.onloadeddata = () => {
      URL.revokeObjectURL(objectUrl);
    };

    console.log("Markers data:", data);

    setMarkers(data ?? []);
  };

  const createMarker = useMutation({
    mutationFn: async ({ project_id, note, timestamp }: { project_id: string; note: string; timestamp: number }) => {
      const res = await axios.post("http://localhost:8000/markers", {
        project_id: project_id,
        note: note,
        timestamp,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Marker created successfully!");
    },
  });

  const editMarker = useMutation({
    mutationFn: async ({ markerId, note, timestamp }: { markerId: string; note: string; timestamp: number }) => {
      // Send PUT request to update the marker
      const res = await axios.put(`http://localhost:8000/markers/${markerId}`, {
        note,
        timestamp,
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate queries to update markers after edit
      // queryClient.invalidateQueries({ queryKey: ["markers", projectId] });
    },
    onError: (error) => {
      console.error("Error updating marker:", error);
      // You can also show a UI alert or toast if necessary
    },
  });

  const addMarker = () => {
    if (seekerRef.current && audioRef.current) {
      // Get the seeker's current position
      const seekerPosition = seekerRef.current.x();
      const currentTime = audioRef.current.currentTime;
      setMarkers((prevMarkers) => [...prevMarkers, { marker: seekerPosition, notes: "", timestamp: currentTime }]);
      createMarker.mutate({
        project_id: projectId,
        note: "",
        timestamp: currentTime,
      });
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
    setIsLoading(true);
    try {
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
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
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
      }
      // Continuously update seeker position in the next animation frame
      requestAnimationFrame(syncSeekerWithAudio);
    };

    // Start syncing the seeker
    const animationFrame = requestAnimationFrame(syncSeekerWithAudio);

    // Cleanup: cancel the animation frame when component unmounts or dependencies change
    return () => cancelAnimationFrame(animationFrame);
  }, [zoom, songDuration, bounds.width, selection]);

  useEffect(() => {
    if (selection) {
      const handleTimeUpdate = () => {
        if (audioRef.current.currentTime >= selection.finalTime) {
          audioRef.current.currentTime = selection.initialTime;
        }
      };

      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [selection, audioRef]);

  const mouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0 || !e.evt.ctrlKey) return; // Require Ctrl + Left Click
    if (selection !== null) {
      setSelection(null);
      return;
    }
    setIsMousePressed(true);
    const stage = stageRef.current;
    const pos = stage.getRelativePointerPosition();
    const scaledWidth = bounds.width * zoom;
    let initialTime = (pos.x / scaledWidth) * songDuration;
    initialTime = Math.max(0, Math.min(initialTime, songDuration)); // Clamp initialTime

    setSelection({ initialTime: initialTime, finalTime: initialTime });
  };

  const mouseMove = useCallback(
    debounce(() => {
      if (!selection || !isMousePressed) return;
      const stage = stageRef.current;
      const pos = stage.getRelativePointerPosition();
      const scaledWidth = bounds.width * zoom;
      let finalTime = (pos.x / scaledWidth) * songDuration;
      finalTime = Math.max(0, Math.min(finalTime, songDuration)); // Clamp finalTime

      setSelection((prev) => ({ ...prev!, finalTime: finalTime }));
    }, 8),
    [selection]
  );

  const mouseUp = () => {
    setIsMousePressed(false); // Stop updating on mouse up
  };

  return (
    <div className="box-border flex flex-col border-2 border-gray-700 rounded-lg w-full h-full">
      <div ref={ref} className="relative w-full h-full overflow-x-auto">
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: bounds.width,
              height: bounds.height,
              backgroundColor: "rgba(0, 0, 0, 0.24)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LoadingSpinner2 />
          </div>
        )}
        {error && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: bounds.width,
              height: bounds.height,
              backgroundColor: "rgba(0, 0, 0, 0.24)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p className="flex items-center space-x-3 bg-gradient-to-r from-slate-100 via-pink-100 to-blue-100 shadow-lg p-4 rounded-lg text-slate-800">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <span className="font-bold">Yikes! An error occurred: {error} </span>
            </p>
          </div>
        )}
        <Stage
          width={bounds.width}
          height={bounds.height}
          ref={stageRef}
          className="bg-white rounded-lg"
          x={18}
          onMouseDown={mouseDown}
          onMouseMove={mouseMove}
          onMouseUp={mouseUp}
        >
          <Layer>
            <Group
              scaleX={zoom}
              onClick={(e) => {
                if (e.evt.ctrlKey || e.evt.shiftKey || e.evt.altKey) return; // Ignore if any modifier key is pressed
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

          <Layer>
            {selection && (
              <Rect
                x={(selection.initialTime / songDuration) * (bounds.width * zoom)}
                y={0} // Fixed Y position
                width={(() => {
                  const initialX = (selection.initialTime / songDuration) * (bounds.width * zoom);
                  const finalX = (selection.finalTime / songDuration) * (bounds.width * zoom);
                  return finalX - initialX;
                })()}
                height={bounds.height - 1} // Full height
                fill="rgba(16, 185, 129,0.3) "
                strokeWidth={2}
                stroke="rgba(16, 185, 129,1)"
              />
            )}
          </Layer>

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
                className="text-rose-600 active:scale-75 transition-transform duration-150 cursor-pointer transform"
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
                    // editMarker.mutate({
                    //   markerId: currentMarker.marker, // Use the marker's ID (you can store it as part of the marker object)
                    //   note: currentMarker.notes, // New note (text input)
                    //   timestamp: currentMarker.timestamp, // New timestamp
                    // });
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
