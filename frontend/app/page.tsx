'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from '@/components/landing-page';
import { TopNav } from '@/components/top-nav';
import { Sidebar } from '@/components/sidebar';
import { ContextPanel } from '@/components/context-panel';
import { VoiceHub } from '@/components/voice-hub';
import { LiveStream } from '@/components/live-stream';
import { useVoiceSocket } from '@/hooks/use-voice-socket';
import { PlaceholderView } from '@/components/placeholder-view';
import { LogsView } from '@/components/logs-view';
import { KnowledgeBaseView } from '@/components/knowledge-base-view';
import { AnalyticsView } from '@/components/analytics-view';
import { SettingsView } from '@/components/settings-view';
import { api } from '@/lib/api';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const voiceSocket = useVoiceSocket();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const checkAuth = async () => {
    const token = localStorage.getItem('vocalis_token');
    const storedEmail = localStorage.getItem('vocalis_user_email');
    
    if (token && storedEmail) {
      try {
        // Verify token is valid by calling /me
        const user = await api.get('/auth/me');
        setUserEmail(user.email);
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
    }
    setIsCheckingAuth(false);
  };

  useEffect(() => {
    checkAuth();
    
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const handleEnter = () => {
    // onEnter is called after successful login in AuthModal
    checkAuth();
  };

  const handleLogout = () => {
    voiceSocket.disconnect();
    localStorage.removeItem('vocalis_token');
    localStorage.removeItem('vocalis_user_email');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  // Prevent flash of wrong state during SSR/hydration
  if (isCheckingAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0b1326' }}
      >
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="landing"
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          <LandingPage onEnter={handleEnter} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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
          <TopNav onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView} userEmail={userEmail} />
          <Sidebar onLogout={handleLogout} onNewSession={() => {
            voiceSocket.clearSession();
            setActiveView('dashboard');
          }} activeView={activeView} setActiveView={setActiveView} userEmail={userEmail} />

          {/* Main Content Area */}
          <main className="lg:pl-[336px] px-6 lg:pr-8 pt-28 pb-8 min-h-screen flex">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1600px] mx-auto">
              {activeView === 'dashboard' ? (
                <>
                  <ContextPanel />
                  <VoiceHub voiceSocket={voiceSocket} />
                  <LiveStream messages={voiceSocket.messages} isConnected={voiceSocket.isConnected} onSendMessage={voiceSocket.sendTextMessage} />
                </>
              ) : activeView === 'analytics' ? (
                <AnalyticsView />
              ) : activeView === 'settings' ? (
                <SettingsView />
              ) : activeView === 'logs' ? (
                <LogsView />
              ) : activeView === 'knowledge-base' ? (
                <KnowledgeBaseView />
              ) : null}
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
