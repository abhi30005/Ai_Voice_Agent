'use client';

import { Mic, MicOff, AudioLines, Wifi, WifiOff, Volume2, VolumeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { useVoiceSocket } from '@/hooks/use-voice-socket';

export function VoiceHub({ voiceSocket }: { voiceSocket: ReturnType<typeof useVoiceSocket> }) {
  const { isRecording, isPlaying, isConnected, ttsEnabled, toggleRecording, toggleTts, connect } = voiceSocket;

  return (
    <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative min-h-[500px]">
      <div className="flex flex-col items-center z-10 w-full">
        {/* Animated Dynamic Orb */}
        <div className="relative w-[280px] h-[280px] flex items-center justify-center mb-12">
          {/* Outer rotating ring */}
          {isRecording && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute border border-[#4cd7f6]/10 rounded-full w-[220px] h-[220px]"
            />
          )}

          {/* Pulsing ring */}
          {(isRecording || isPlaying) && (
            <motion.div
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute border border-[#7c3aed]/30 rounded-full w-[160px] h-[160px]"
            />
          )}

          {/* Main Orb */}
          <motion.div
            animate={!isRecording ? { scale: 1, boxShadow: "none" } : {
              scale: isPlaying ? [1, 1.15, 1] : [1, 1.05, 1],
              boxShadow: [
                "0 0 40px rgba(124, 58, 237, 0.4)",
                "0 0 70px rgba(124, 58, 237, 0.7)",
                "0 0 40px rgba(124, 58, 237, 0.4)"
              ]
            }}
            transition={{ duration: isPlaying ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
            className={`w-[140px] h-[140px] rounded-full flex items-center justify-center z-10 ${
              !isRecording
                ? 'bg-gradient-to-br from-gray-700 to-gray-900 grayscale opacity-50'
                : 'bg-gradient-to-br from-[#7c3aed] to-[#4cd7f6]'
            }`}
          >
            <AudioLines className="text-white opacity-40 w-12 h-12" />
          </motion.div>

          {/* Simulated Particle Ring */}
          {isRecording && (
             <motion.div
               animate={{ rotate: -360 }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-2 border-white/5 border-dashed rounded-full"
             />
          )}
        </div>

        {/* Status Typography */}
        <div className="text-center space-y-4">
          <motion.h1
            animate={!isRecording ? {} : { opacity: [1, 0.8, 1], scale: [1, 0.98, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`font-extrabold text-5xl uppercase tracking-tighter ${
              !isRecording ? 'text-[#ffb4ab]' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]'
            }`}
          >
            {!isRecording ? 'Muted' : isPlaying ? 'Speaking...' : 'Listening...'}
          </motion.h1>
          <p className="text-[#ccc3d8] text-lg max-w-md mx-auto opacity-70 font-medium">
            {!isRecording
              ? 'Microphone is currently disabled. Tap to resume.'
              : 'Neural processing active. Vocalis is interpreting your request in real-time.'}
          </p>
        </div>

        {/* Connection Status Badge */}
        <div className="mt-8 flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4cd7f6]/10 border border-[#4cd7f6]/20">
              <Wifi className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span className="text-[10px] font-bold text-[#4cd7f6] uppercase tracking-[0.3em]">Connected</span>
            </div>
          ) : (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <WifiOff className="w-3.5 h-3.5 text-[#ccc3d8]" />
              <span className="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-[0.3em]">Tap to Connect</span>
            </button>
          )}
        </div>

        {/* Control Buttons */}
        <div className="mt-8 flex items-center gap-6">
          {/* TTS Toggle */}
          <div className="relative flex flex-col items-center">
            <button
              id="tts-toggle-btn"
              onClick={toggleTts}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 group border ${
                ttsEnabled
                  ? 'bg-[#4cd7f6]/15 border-[#4cd7f6]/30 shadow-[0_2px_12px_rgba(76,215,246,0.2)] hover:shadow-[0_4px_20px_rgba(76,215,246,0.4)] hover:-translate-y-0.5'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {ttsEnabled ? (
                <Volume2 className="w-6 h-6 text-[#4cd7f6] group-hover:scale-110 transition-transform" />
              ) : (
                <VolumeOff className="w-6 h-6 text-[#ccc3d8]/60 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <span className={`mt-2 text-[9px] font-bold uppercase tracking-[0.3em] ${
              ttsEnabled ? 'text-[#4cd7f6]/60' : 'text-[#ccc3d8]/40'
            }`}>
              {ttsEnabled ? 'Voice On' : 'Voice Off'}
            </span>
          </div>

          {/* Mic Control */}
          <div className="relative flex flex-col items-center">
            <button
              id="mic-toggle-btn"
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all active:scale-95 group ${
                !isRecording
                  ? 'bg-[#93000a] shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.6)]'
                  : 'bg-[#7c3aed] shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-1'
              }`}
            >
              {!isRecording ? (
                <MicOff className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              )}
            </button>
            <span className="mt-2 text-[10px] font-bold text-[#4cd7f6] uppercase tracking-[0.4em] opacity-60">
              {!isRecording ? 'Tap to Unmute' : 'Tap to Mute'}
            </span>
          </div>

          {/* Spacer for symmetry */}
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
}
