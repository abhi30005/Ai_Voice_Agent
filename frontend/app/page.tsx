'use client';

import { TopNav } from '@/components/top-nav';
import { Sidebar } from '@/components/sidebar';
import { ContextPanel } from '@/components/context-panel';
import { VoiceHub } from '@/components/voice-hub';
import { LiveStream } from '@/components/live-stream';
import { useVoiceSocket } from '@/hooks/use-voice-socket';

export default function Home() {
  const voiceSocket = useVoiceSocket();

  return (
    <div
      className="min-h-screen text-[#dae2fd] font-sans selection:bg-[#7c3aed]/30"
      style={{
        backgroundColor: '#0b1326',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(76, 215, 246, 0.1) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(6, 14, 32, 1) 0px, transparent 100%)
        `
      }}
    >
      <TopNav />
      <Sidebar />

      {/* Main Content Area */}
      <main className="lg:pl-[336px] px-6 lg:pr-8 pt-28 pb-8 min-h-screen flex">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1600px] mx-auto">
          <ContextPanel />
          <VoiceHub voiceSocket={voiceSocket} />
          <LiveStream messages={voiceSocket.messages} isConnected={voiceSocket.isConnected} onSendMessage={voiceSocket.sendTextMessage} />
        </div>
      </main>
    </div>
  );
}
