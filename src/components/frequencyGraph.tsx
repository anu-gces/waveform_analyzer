import React, { useEffect, useState } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import useMeasure from "react-use-measure";
import axios from "axios";
import { useStore } from "@/lib/store";
import { AlertCircle, Music } from "lucide-react";
import { LoadingSpinner } from "./loadingSpinner";

type FrequencyGraphProps = {
  audioRef: React.MutableRefObject<HTMLAudioElement | null> | null;
  audioContextRef: React.MutableRefObject<AudioContext | null> | null;
};

const C1 = 32.7; // Frequency of C1
const C7 = 2093.0; // Frequency of C7
const sampleRate = 22000;
const hopLength = 229;

export const FrequencyGraph: React.FC<FrequencyGraphProps> = ({ audioRef, audioContextRef }) => {
  const [ref, bounds] = useMeasure({ debounce: 100 });
  const songFile = useStore((state) => state.songFile);
  const [FFTData, setFFTData] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationPoints, setVisualizationPoints] = useState<number[]>([]);

  useEffect(() => {
    const fetchFFT = async () => {
      if (!songFile) return;

      const formData = new FormData();
      formData.append("file", songFile);

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post("http://127.0.0.1:8000/uploadFFT/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setFFTData([]);
        setFFTData(response.data);
        console.log("bruh", response.data);
      } catch (error) {
        console.error("Error fetching FFT data:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFFT();
  }, [songFile]);

  useEffect(() => {
    const updateVisualization = () => {
      if (audioRef && audioRef.current && FFTData.length > 0) {
        const currentTime = audioRef.current.currentTime;
        const frameIndex = Math.floor(currentTime * (sampleRate / hopLength));
        if (frameIndex < FFTData[0].length) {
          const frameData = FFTData.map((row) => row[frameIndex]);
          drawFrame(frameData);
        }
      }
      requestAnimationFrame(updateVisualization);
    };

    updateVisualization();
  }, [audioRef, FFTData, bounds.height]);

  const mapFrequencyToX = (frequency: number) => {
    // Mapping frequencies from C1 to C7 (logarithmic scale)
    return (Math.log2(frequency / C1) / Math.log2(C7 / C1)) * (bounds.width - bounds.width / 43);
  };

  const gaussianBlur = (data: number[], sigma = 1.0) => {
    const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
    // const kernelSize = Math.max(3, Math.ceil(sigma * 2) * 2 + 1);

    const kernel = new Array(kernelSize).fill(0).map((_, i) => {
      const x = i - Math.floor(kernelSize / 2);
      return Math.exp(-0.5 * (x / sigma) ** 2);
    });

    // const sum = kernel.reduce((a, b) => a + b, 0);
    return data.map((_, i, arr) => {
      let value = 0;
      let weightSum = 0;
      for (let j = 0; j < kernel.length; j++) {
        const index = i + j - Math.floor(kernelSize / 2);
        if (index >= 0 && index < arr.length) {
          value += arr[index] * kernel[j];
          weightSum += kernel[j];
        }
      }
      return value / weightSum;
    });
  };

  const drawFrame = (frameData: number[]) => {
    const smoothedData = gaussianBlur(frameData, 1.5);
    const maxAmplitude = Math.max(...smoothedData);
    // const maxAmplitude = Math.max(...frameData); // Find the maximum amplitude in the frame data

    const points = frameData.flatMap((amplitude, frequencyBinIndex) => {
      const frequency = (frequencyBinIndex * (sampleRate / 2)) / frameData.length;
      if (!isFinite(frequency) || !isFinite(amplitude)) return []; // Skip invalid data

      const xCoordinate = mapFrequencyToX(frequency) + bounds.width / (43 * 2) - 0;
      // const normalizedAmplitude = amplitude + 80; // Shift range from [-80, 0] to [0, 80]
      // const height = normalizedAmplitude * (bounds.height / 160);
      // const yCoordinate = bounds.height - height;

      const normalizedAmplitude = amplitude / maxAmplitude;
      const transformedAmplitude = Math.pow(normalizedAmplitude, 2);
      const exaggeratedAmplitude = transformedAmplitude * maxAmplitude;

      const yCoordinate = bounds.height - ((exaggeratedAmplitude + 80) / 80) * (bounds.height * 0.85);

      return [xCoordinate, yCoordinate];
    });

    const validPoints: number[] = [];
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i];
      const y = points[i + 1];
      if (isFinite(x) && isFinite(y)) {
        validPoints.push(x, y);
      }
    }

    setVisualizationPoints(validPoints);
  };

  const renderLabels = () => {
    const labels = [32.703, 65.406, 130.813, 261.626, 523.251, 1046.502, 2093.005]; // Frequencies for C1 to C7
    const startFrequency = C1;
    const endFrequency = C7;
    const totalLines = 43; // Total number of lines
    const blackKeyLines = 43;
    const offset = bounds.width / (43 * 2); // Offset by 1/(43*2) of the width

    const lines = [];

    for (let i = 0; i < totalLines; i++) {
      const x = (i / totalLines) * bounds.width + offset;
      lines.push(<Line key={`gray-${i}`} points={[x, 0, x, bounds.height]} stroke="gray" strokeWidth={1} />);
    }

    for (let i = 0; i < blackKeyLines; i++) {
      const x = (i / blackKeyLines) * bounds.width + bounds.width / (43 * 1);
      lines.push(
        <Line key={`black-${i}`} points={[x, 0, x, bounds.height]} stroke="gray" strokeWidth={1} dash={[2, 2]} />
      );
    }

    labels.forEach((frequency) => {
      const x =
        (Math.log2(frequency / startFrequency) / Math.log2(endFrequency / startFrequency)) *
          (bounds.width - bounds.width / 43) +
        offset;
      lines.push(<Line key={`red-${frequency}`} points={[x, 0, x, bounds.height]} stroke="gray" strokeWidth={3} />);
    });

    return lines;
  };

  return (
    <div className="box-border flex flex-col border-2 border-gray-700 rounded-lg w-full h-full">
      <div className="relative w-full h-full" ref={ref}>
        <Stage width={bounds.width} height={bounds.height} className="bg-white rounded-lg">
          <Layer>
            <Line
              points={visualizationPoints}
              stroke="black"
              strokeWidth={2}
              tension={0.3}
              lineCap="round"
              lineJoin="round"
            />
            {renderLabels()}
          </Layer>
        </Stage>
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
            <LoadingSpinner />
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
      </div>
    </div>
  );
};
