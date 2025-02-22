const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioBuffer = await audioContextRef.current.decodeAudioData(
      arrayBuffer
    );

    const sampleRate = audioBuffer.sampleRate;
    const durationInSeconds = 5; // Load only the initial 5 seconds
    const numberOfSamples = sampleRate * durationInSeconds;

    const channelData = audioBuffer.getChannelData(0); // Get the first channel
    const initialChannelData = channelData.slice(0, numberOfSamples); // Get the first 5 seconds of samples

    const numberOfChunks = 500; // Number of samples to display
    const chunkSize = Math.ceil(initialChannelData.length / numberOfChunks);

    const waveformData: { min: number; max: number }[] = [];

    for (let i = 0; i < numberOfChunks; i++) {
      const chunk = initialChannelData.slice(
        i * chunkSize,
        (i + 1) * chunkSize
      );
      const min = Math.min(...chunk);
      const max = Math.max(...chunk);
      waveformData.push({ min, max });
    }

    setWaveform(waveformData);
  }
};

//this function only loads 5 sceonds of the song
