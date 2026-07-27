'use client';

import { AlignLeft, Bot, Send, User } from "lucide-react";
import type { ChatMessage } from '@/hooks/use-voice-socket';
import { useEffect, useRef, useState } from "react";

export function LiveStream({ 
  messages, 
  isConnected, 
  onSendMessage 
}: { 
  messages?: ChatMessage[], 
  isConnected?: boolean,
  onSendMessage?: (text: string) => void 
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (textInput.trim() && onSendMessage) {
      onSendMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="col-span-12 lg:col-span-3 bg-[#0b1326]/40 backdrop-blur-[40px] border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-140px)]">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <AlignLeft className="w-4 h-4 text-[#4cd7f6]" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Live Stream</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#4cd7f6] animate-pulse' : 'bg-white/20'}`}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide flex flex-col">
        {(!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs text-center space-y-2">
            <Bot className="w-8 h-8 opacity-20 mb-2" />
            <p>Awaiting voice input...</p>
            <p className="text-[10px] opacity-50">Or type a message below</p>
          </div>
        )}

        {messages?.map((msg) => (
          <div key={msg.id} className={`space-y-3 flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
            <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                msg.role === 'user' 
                  ? 'bg-[#4cd7f6]/20 border-[#4cd7f6]/30' 
                  : 'bg-[#7c3aed]/20 border-[#7c3aed]/30'
              }`}>
                {msg.role === 'user' 
                  ? <User className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  : <Bot className="w-3.5 h-3.5 text-[#d2bbff]" />
                }
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#ccc3d8] uppercase">
                {msg.role === 'user' ? 'You' : 'Vocalis Core'}
              </span>
            </div>
            
            {msg.isThinking ? (
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1.5 items-center w-max">
                <div className="w-1.5 h-1.5 bg-[#d2bbff] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#d2bbff] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-[#d2bbff] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border shadow-sm max-w-[90%] ${
                msg.role === 'user'
                  ? 'bg-[#4cd7f6]/10 rounded-tr-none border-[#4cd7f6]/20 text-right'
                  : 'bg-white/5 rounded-tl-none border-white/5'
              }`}>
                <p className="text-[15px] text-[#dae2fd] leading-relaxed">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-black/20 border-t border-white/5 mt-auto">
        <div className="relative group">
          <input
            id="text-message-input"
            type="text"
            placeholder={isConnected ? "Type a message..." : "Connect to start chatting..."}
            disabled={!isConnected}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7c3aed]/50 focus:ring-1 focus:ring-[#7c3aed]/30 transition-all ${
              !isConnected ? 'cursor-not-allowed opacity-50' : ''
            }`}
          />
          {isConnected && (
            <button
              onClick={handleSend}
              disabled={!textInput.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-[#4cd7f6]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
