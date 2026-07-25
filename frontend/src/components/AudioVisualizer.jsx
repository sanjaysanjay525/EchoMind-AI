import React, { useRef, useEffect } from 'react';

const AudioVisualizer = ({ stream, isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (isRecording && stream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      if (!sourceRef.current) {
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
      }

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        animationRef.current = requestAnimationFrame(draw);

        analyserRef.current.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgba(20, 20, 20, 1)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 250)`;
          canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      };

      draw();
    } else {
      // Stop animation and clear canvas when not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.fillStyle = 'rgba(20, 20, 20, 1)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, stream]);

  return (
    <div className="audio-visualizer-container" style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={600} height={100} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default AudioVisualizer;
