import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
}

/**
 * Downsamples audio from the browser's native sample rate to 16kHz.
 * This is critical because browsers often use 44.1kHz or 48kHz,
 * but our backend STT expects 16kHz audio.
 */
function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  if (inputSampleRate < outputSampleRate) {
    throw new Error('Input sample rate must be greater than output sample rate');
  }
  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / Math.max(1, count);
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export function useVoiceSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<{
    source: MediaStreamAudioSourceNode;
    processor: ScriptProcessorNode;
    stream: MediaStream;
    context: AudioContext;
  } | null>(null);
  
  // Separate playback context — never share with recording
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  const getPlaybackContext = () => {
    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return playbackContextRef.current;
  };

  const playAudioChunk = async (base64Audio: string) => {
    try {
      const audioCtx = getPlaybackContext();
      
      if (!base64Audio) {
        console.warn('Received empty audio data');
        return;
      }
      
      // Resume context if suspended (browser autoplay policy)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      // Convert base64 to ArrayBuffer
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      if (bytes.length === 0) {
        console.warn('Decoded audio bytes length is 0');
        return;
      }

      // Create a clean, detached ArrayBuffer copy for decodeAudioData
      const cleanBuffer = bytes.buffer.slice(0);
      
      // Decode audio data (handles MP3, WAV, etc.)
      const audioBuffer = await audioCtx.decodeAudioData(cleanBuffer);
      audioQueueRef.current.push(audioBuffer);
      scheduleNextChunk();
    } catch (err) {
      console.error('Error decoding audio chunk', err);
    }
  };

  const scheduleNextChunk = () => {
    const audioCtx = playbackContextRef.current;
    if (!audioCtx || audioCtx.state === 'closed') return;

    while (audioQueueRef.current.length > 0) {
      const buffer = audioQueueRef.current.shift()!;
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      
      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }
      
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
      
      source.onended = () => {
        if (audioQueueRef.current.length === 0 && audioCtx.currentTime >= nextPlayTimeRef.current) {
          setIsPlaying(false);
        }
      };
    }
  };

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket('ws://localhost:8000/api/voice/ws');
    
    ws.onopen = () => {
      console.log('Connected to Voice Agent');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'transcript':
            setMessages(prev => [...prev.filter(m => !m.isThinking), {
              id: Date.now().toString(),
              role: 'user',
              content: data.text
            }]);
            break;
          case 'thinking':
            setMessages(prev => {
               if (prev.some(m => m.isThinking)) return prev;
               return [...prev, {
                id: 'thinking',
                role: 'assistant',
                content: '',
                isThinking: true
              }];
            });
            break;
          case 'response_text':
            setMessages(prev => [...prev.filter(m => !m.isThinking), {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.text
            }]);
            break;
          case 'audio_chunk':
            if (ttsEnabledRef.current) {
              playAudioChunk(data.data);
            }
            break;
          case 'speaking_started':
            setIsPlaying(true);
            break;
          case 'speaking_finished':
            // Will be set false by audio source.onended
            break;
          case 'thinking_done':
            // Explicitly clear thinking indicator (e.g., when STT found no speech)
            setMessages(prev => [...prev.filter(m => !m.isThinking)]);
            break;
          case 'error':
            console.error('Server error:', data.message);
            setMessages(prev => [...prev.filter(m => !m.isThinking)]);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Voice Agent');
      setIsConnected(false);
      socketRef.current = null;
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    socketRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    try {
      // Ensure WebSocket is connected first
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        connect();
        // Wait a moment for connection
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Request 16kHz (browser may ignore this)
        } 
      });
      
      // Create a SEPARATE AudioContext for recording
      // Use browser's default sample rate — we'll resample to 16kHz manually
      const recordingContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = recordingContext.createMediaStreamSource(stream);
      const processor = recordingContext.createScriptProcessor(4096, 1, 1);
      
      const actualSampleRate = recordingContext.sampleRate;
      console.log(`Recording at browser sample rate: ${actualSampleRate}Hz, will downsample to 16000Hz`);
      
      source.connect(processor);
      processor.connect(recordingContext.destination);
      
      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Downsample from browser's native rate to 16kHz
          const downsampled = downsampleBuffer(inputData, actualSampleRate, 16000);
          
          // Convert Float32 to Int16 PCM
          const int16Data = new Int16Array(downsampled.length);
          for (let i = 0; i < downsampled.length; i++) {
            const s = Math.max(-1, Math.min(1, downsampled[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Convert to base64
          const bytes = new Uint8Array(int16Data.buffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
          }
          const base64data = btoa(binary);
          
          socketRef.current.send(JSON.stringify({
            type: 'audio_chunk',
            data: base64data
          }));
        }
      };

      recordingRef.current = { source, processor, stream, context: recordingContext };
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (recordingRef.current) {
      const { source, processor, stream, context } = recordingRef.current;
      source.disconnect();
      processor.disconnect();
      stream.getTracks().forEach(track => track.stop());
      context.close().catch(() => {});
      recordingRef.current = null;
      setIsRecording(false);
      
      // Tell backend to process whatever audio is buffered
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'stop_recording' }));
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (!isConnected) connect();
      startRecording();
    }
  };
  
  const sendTextMessage = (text: string) => {
    if (!text.trim()) return;
    
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connect();
      // Queue the message to send after connection
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'text_message', text }));
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            content: text
          }]);
        }
      }, 600);
      return;
    }
    
    socketRef.current.send(JSON.stringify({ type: 'text_message', text }));
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: text
    }]);
  };
  
  const stopAudio = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stop_audio' }));
    }
    // Clear playback queue but DON'T close the context — just stop current sources
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    setIsPlaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      disconnect();
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
        playbackContextRef.current.close().catch(() => {});
      }
    };
  }, [disconnect]);

  // Keep a ref for ttsEnabled so the WebSocket handler can read it without stale closure
  const ttsEnabledRef = useRef(ttsEnabled);
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  const toggleTts = () => {
    const newValue = !ttsEnabled;
    setTtsEnabled(newValue);
    
    // Tell the backend so it can skip TTS API calls entirely
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'set_tts', enabled: newValue }));
    }
    
    // If turning off while audio is playing, stop playback
    if (!newValue && isPlaying) {
      stopAudio();
    }
  };

  return {
    isConnected,
    isRecording,
    isPlaying,
    ttsEnabled,
    messages,
    connect,
    disconnect,
    toggleRecording,
    toggleTts,
    sendTextMessage,
    stopAudio
  };
}
