import React, { useEffect, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import useMeasure from "react-use-measure";
import axios from "axios";
import { useStore } from "@/lib/store";

type TestFFTProps = {
  audioRef: React.MutableRefObject<HTMLAudioElement | null> | null;
  audioContextRef: React.MutableRefObject<AudioContext | null> | null;
};

const C1 = 32.7; // Frequency of C1
const C7 = 2093.0; // Frequency of C7

export const TestFFT: React.FC<TestFFTProps> = ({ audioRef, audioContextRef }) => {
  const [ref, bounds] = useMeasure({ debounce: 100 });
  const songFile = useStore((state) => state.songFile);
  const [cqtData, setCqtData] = useState<number[][]>([]);
  const [rectangles, setRectangles] = useState<number[]>([]);

  useEffect(() => {
    const fetchFFT = async () => {
      if (!songFile) return;

      const formData = new FormData();
      formData.append("file", songFile);

      try {
        const response = await axios.post("http://127.0.0.1:8000/uploadFFT/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCqtData([]);
        setCqtData(response.data);
        console.log("bruh", response.data);
      } catch (error) {
        console.error("Error fetching FFT data:", error);
      }
    };

    fetchFFT();
  }, [songFile]);

  useEffect(() => {
    const updateVisualization = () => {
      if (audioRef && audioRef.current && cqtData.length > 0) {
        const currentTime = audioRef.current.currentTime;
        const frameIndex = Math.floor(currentTime * (4500 / 128));
        if (frameIndex < cqtData[0].length) {
          const frameData = cqtData.map((row) => row[frameIndex]);
          drawFrame(frameData);
        }
      }
      requestAnimationFrame(updateVisualization);
    };

    updateVisualization();
  }, [audioRef, cqtData, bounds.height]);

  const mapFrequencyToX = (frequency: number) => {
    // Mapping frequencies from C1 to C7 (logarithmic scale)
    return (Math.log2(frequency / C1) / Math.log2(C7 / C1)) * (bounds.width - bounds.width / 43);
  };

  const drawFrame = (frameData: number[]) => {
    const maxAmplitude = Math.max(...frameData); // Find the maximum amplitude in the frame data

    const points = frameData.flatMap((amplitude, frequencyBinIndex) => {
      const frequency = (frequencyBinIndex * (4500 / 2)) / frameData.length;
      if (!isFinite(frequency) || !isFinite(amplitude)) return []; // Skip invalid data

      const xCoordinate = mapFrequencyToX(frequency) + bounds.width / (43 * 2);
      // const normalizedAmplitude = amplitude + 80; // Shift range from [-80, 0] to [0, 80]
      // const height = normalizedAmplitude * (bounds.height / 160);
      // const yCoordinate = bounds.height - height;

      const normalizedAmplitude = amplitude / maxAmplitude;
      const transformedAmplitude = Math.pow(normalizedAmplitude, 2);
      const exaggeratedAmplitude = transformedAmplitude * maxAmplitude;
      const yCoordinate = bounds.height - ((exaggeratedAmplitude + 80) / 80) * bounds.height;

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

    setRectangles(validPoints);
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
      <div className="w-full h-full" ref={ref}>
        {audioRef && audioRef.current ? (
          <Stage width={bounds.width} height={bounds.height} className="bg-white rounded-lg">
            <Layer>
              <Line points={rectangles} stroke="black" strokeWidth={2} tension={0.3} lineCap="round" lineJoin="round" />
              {renderLabels()}
            </Layer>
          </Stage>
        ) : (
          <p>Please upload an audio file to see the FFT.</p>
        )}
      </div>
    </div>
  );
};
