import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
}

// Add TypeScript support for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  
  // Web Speech API reference
  const recognitionRef = useRef<any>(null);
  const shouldRecordRef = useRef<boolean>(false);

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

    const token = typeof window !== 'undefined' ? localStorage.getItem('vocalis_token') : '';
    const wsUrl = `ws://localhost:8000/api/voice/ws${token ? `?token=${token}` : ''}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to Voice Agent');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'transcript':
            // With Web Speech API, we already display the text locally. We can ignore backend transcripts
            // unless they are corrections, but let's just ignore to prevent duplicates.
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
            // Explicitly clear thinking indicator
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

  const sendTextMessage = (text: string, skipUiUpdate = false) => {
    if (!text.trim()) return;
    
    // Initialize playback context on user interaction
    getPlaybackContext();
    if (playbackContextRef.current?.state === 'suspended') {
      playbackContextRef.current.resume().catch(console.warn);
    }
    
    const send = () => {
      socketRef.current?.send(JSON.stringify({ type: 'text_message', text }));
      if (!skipUiUpdate) {
        setMessages(prev => [...prev.filter(m => m.id !== 'interim'), {
          id: Date.now().toString(),
          role: 'user',
          content: text
        }]);
      }
    };

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connect();
      // Queue the message to send after connection
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          send();
        }
      }, 600);
      return;
    }
    
    send();
  };

  const startRecording = async () => {
    try {
      // Ensure WebSocket is connected first
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        connect();
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error("Web Speech API is not supported in this browser.");
        alert("Your browser does not support the Web Speech API. Please use Chrome or Edge.");
        return;
      }

      const recognition = new SpeechRecognition();
      shouldRecordRef.current = true;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          // Send final text to backend and clear interim
          sendTextMessage(finalTranscript.trim());
        } else if (interimTranscript) {
          // Update UI with interim transcript
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== 'interim');
            return [...filtered, {
              id: 'interim',
              role: 'user',
              content: interimTranscript,
            }];
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed' || event.error === 'network') {
          setIsRecording(false);
          shouldRecordRef.current = false;
          if (event.error === 'network') {
             console.warn("Browser speech recognition failed due to a network error. Ensure you are connected to the internet and not blocking Google's speech services.");
          }
        }
      };

      recognition.onend = () => {
        // If it stopped naturally but we didn't toggle it off, restart it
        if (shouldRecordRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            setIsRecording(false);
            shouldRecordRef.current = false;
          }
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error('Error starting speech recognition:', err);
    }
  };

  const stopRecording = () => {
    shouldRecordRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Initialize/resume playback context immediately on user interaction
      getPlaybackContext();
      if (playbackContextRef.current?.state === 'suspended') {
        playbackContextRef.current.resume().catch(console.warn);
      }
      
      if (!isConnected) connect();
      startRecording();
    }
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

  const clearSession = () => {
    setMessages([]);
    // Force a full reconnect so the websocket picks up the latest authentication token
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  };

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
    stopAudio,
    clearSession
  };
}
