import React, { useEffect, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import useMeasure from "react-use-measure";
import { notesDictionary } from "./noteDictionary";
import axios from "axios";
import { useStore } from "@/lib/store";

type FFTGraphProps = {
  audioRef: React.MutableRefObject<HTMLAudioElement | null> | null;
  audioContextRef: React.MutableRefObject<AudioContext | null> | null;
};

export const FFTGraph: React.FC<FFTGraphProps> = ({ audioRef, audioContextRef }) => {
  const [ref, bounds] = useMeasure();
  const songFile = useStore((state) => state.songFile);
  const [fftData, setFFTData] = useState<number[]>([]); // Store FFT data

  const fftSize = 4096 * 2; // fft resolution not related to nyqist at all
  const C1 = 32.7;
  const C7 = 2093.0;

  useEffect(() => {
    const fetchFFT = async () => {
      if (!songFile) return;

      const formData = new FormData();
      formData.append("file", songFile);

      try {
        const response = await axios.post("http://127.0.0.1:8000/uploadFFT/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setFFTData(response.data);
        console.log("bruh", response.data);
      } catch (error) {
        console.error("Error fetching FFT data:", error);
      }
    };

    fetchFFT();
  }, [songFile]);

  useEffect(() => {
    if (audioRef && audioRef.current && audioContextRef && audioContextRef.current) {
      const audioCtx = audioContextRef.current;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      const filters = Object.values(notesDictionary).map((frequency) => {
        const bandpass = audioCtx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        bandpass.Q.value = 25; // Narrow Q to isolate each note frequency
        return bandpass;
      });

      const updateFFT = () => {
        analyser.getFloatFrequencyData(dataArray);
        setFFTData(Array.from(dataArray));
        requestAnimationFrame(updateFFT); // Continuously update FFT data
      };

      // Connect the analyser to the audio source
      const source = audioCtx.createMediaElementSource(audioRef.current);
      filters.forEach((filter) => {
        source.connect(filter);
        filter.connect(analyser);
      });

      analyser.connect(audioCtx.destination);

      updateFFT(); // Start FFT update loop
    }
  }, [audioRef, audioContextRef]);

  const mapFrequencyToX = (frequency: number) => {
    // Mapping frequencies from C1 to C7 (logarithmic scale)
    return (Math.log2(frequency / C1) / Math.log2(C7 / C1)) * (bounds.width - bounds.width / 43);
  };

  const drawFrequencyData = () => {
    const points: number[] = [];
    if (fftData.length > 0) {
      const freqResolution = (audioContextRef?.current?.sampleRate || 4186) / fftSize;

      // Define the threshold for switching to downsampled data
      const downsampleThreshold = 500; // Hz

      // Find the maximum amplitude for normalization
      const maxAmplitude = Math.max(...fftData);

      fftData.forEach((amplitude, i) => {
        const freq = i * freqResolution;

        // Downsample logic after a specified frequency (1000 Hz)
        if (freq >= C1 && freq <= C7) {
          const isAboveThreshold = freq > downsampleThreshold;

          if (isAboveThreshold && i % 4 !== 0) return; // Skip 3 out of every 4 bins

          const x = mapFrequencyToX(freq) + bounds.width / (43 * 2);

          // Normalize the amplitude to a range between 0 and 1
          const normalizedAmplitude = amplitude / maxAmplitude;

          // Apply a non-linear transformation (e.g., power of 2) to exaggerate peaks
          const transformedAmplitude = Math.pow(normalizedAmplitude, 2);

          // Re-normalize to the original amplitude range
          const exaggeratedAmplitude = transformedAmplitude * maxAmplitude;

          // Calculate the y-coordinate based on the exaggerated amplitude
          const y = bounds.height - ((exaggeratedAmplitude + 140) / 140) * bounds.height;

          if (isFinite(x) && isFinite(y)) {
            points.push(x, y);
          }
        }
      });
    }
    return points;
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
      lines.push(<Line key={`gray-${i}`} points={[x, 0, x, bounds.height]} stroke="black" strokeWidth={1} />);
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
      lines.push(<Line key={`red-${frequency}`} points={[x, 0, x, bounds.height]} stroke="black" strokeWidth={3} />);
    });

    return lines;
  };

  return (
    <div className="box-border flex flex-col border-2 border-gray-700 w-full h-full">
      <div className="w-full h-full" ref={ref}>
        {audioRef && audioRef.current ? (
          <Stage width={bounds.width} height={bounds.height} className="bg-white">
            <Layer>
              <Line
                points={drawFrequencyData()}
                stroke="black"
                strokeWidth={1}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
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
