'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Mic, Sparkles, Zap, Shield, Globe, ArrowRight, X, Mail, Lock, CheckCircle, AudioLines, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import landingBg from '@/assets/landing-bg.png';

/* ─── PARTICLE FIELD ─── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

/* ─── FEATURE CARD ─── */
function FeatureCard({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-[#7c3aed]/30 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-[0_8px_40px_rgba(124,58,237,0.15)]"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c3aed]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Corner glow on hover */}
      <div className="absolute -top-1 -right-1 w-20 h-20 bg-[#7c3aed]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#4cd7f6]/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-300">
          <Icon className="w-6 h-6 text-[#a78bfa] group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-[#ccc3d8]/70 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ─── AUTH MODAL ─── */
type AuthStep = 'auth' | 'otp' | 'success';

function AuthModal({ onComplete, onClose }: { onComplete: () => void; onClose: () => void }) {
  const [step, setStep] = useState<AuthStep>('auth');
  
  const [email, setEmail] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const checkRes = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      if (checkRes.exists) {
        // Email exists, login immediately without OTP
        const res = await api.post('/auth/login/json', { email });
        localStorage.setItem('vocalis_token', res.access_token);
        localStorage.setItem('vocalis_user_email', email);
        window.dispatchEvent(new Event('auth-change'));
        setStep('success');
        setTimeout(() => onComplete(), 1500);
      } else {
        // Email doesn't exist, show OTP step (demo)
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setDemoOtpCode(randomOtp);
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    if (otpValue !== demoOtpCode) {
      setError('Incorrect verification code. Please try again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Demo OTP accepted, auto-create user & login
      const res = await api.post('/auth/login/json', { email });
      localStorage.setItem('vocalis_token', res.access_token);
      localStorage.setItem('vocalis_user_email', email);
      window.dispatchEvent(new Event('auth-change'));
      setStep('success');
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#0d1629]/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(124,58,237,0.15)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7c3aed]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#4cd7f6]/10 rounded-full blur-3xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl hover:bg-white/5 transition-colors text-[#ccc3d8]/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 p-8">
            <AnimatePresence mode="wait">
              {step === 'auth' && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4cd7f6] flex items-center justify-center shadow-lg shadow-[#7c3aed]/30">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vocalis</h2>
                    <p className="text-[#ccc3d8]/60 text-sm">Enter your email to get started</p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ccc3d8]/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-[#ccc3d8]/30 focus:outline-none focus:border-[#7c3aed]/50 transition-all text-sm"
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[#ff6b6b] text-xs pl-1"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white font-bold text-sm hover:shadow-[0_8px_30px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>Continue <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-[#ccc3d8]/30 text-xs mt-6">
                    By continuing, you agree to our Terms of Service & Privacy Policy.
                  </p>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button onClick={() => setStep('auth')} className="mb-6 flex items-center gap-2 text-sm text-[#ccc3d8]/60 hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" /> Back
                  </button>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0b1326] border border-white/[0.08] flex items-center justify-center shadow-lg shadow-black/20">
                      <Lock className="w-8 h-8 text-[#4cd7f6]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                    <p className="text-[#ccc3d8]/60 text-sm">We've sent a 6-digit demo verification code to<br/><span className="text-white font-medium">{email}</span></p>
                    <div className="mt-4 px-3 py-1.5 inline-block rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      Demo Mode: Your verification code is <span className="font-bold text-white ml-1 text-sm">{demoOtpCode}</span>
                    </div>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="flex justify-between gap-2">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpInputs.current[i] = el; }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center text-xl font-bold text-white focus:outline-none focus:border-[#4cd7f6]/50 transition-all"
                        />
                      ))}
                    </div>

                    {error && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[#ff6b6b] text-xs text-center">
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4cd7f6] to-[#0ea5e9] text-white font-bold text-sm hover:shadow-[0_8px_30px_rgba(76,215,246,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>Verify & Enter <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="text-center py-8"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1, damping: 15 }}>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
                  <p className="text-[#ccc3d8]/60 text-sm">Launching Vocalis AI dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── MAIN LANDING PAGE ─── */
export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [showAuth, setShowAuth] = useState(false);

  const features = [
    { icon: Mic, title: 'Real-Time Voice', description: 'Speak naturally and get instant responses. Sub-second latency with WebSocket streaming.' },
    { icon: Sparkles, title: 'AI-Powered Agent', description: 'LangGraph-powered reasoning with tool calling, RAG, and persistent conversation memory.' },
    { icon: Zap, title: 'Lightning Fast', description: 'Optimized pipeline — Silero VAD, faster-whisper STT, and ElevenLabs neural TTS.' },
    { icon: Shield, title: 'Secure & Private', description: 'JWT authentication, encrypted connections, and your data stays yours.' },
    { icon: Globe, title: 'Multi-Provider', description: 'OpenAI, Groq, or fully local with Ollama. Choose what works for you.' },
    { icon: AudioLines, title: 'Natural Speech', description: 'Premium neural voices that sound indistinguishable from real human speech.' },
  ];

  return (
    <>
      {/* ─── Background Image ─── */}
      <div className="fixed inset-0 z-0">
        <Image
          src={landingBg}
          alt=""
          fill
          priority
          className="object-cover opacity-30"
          style={{ objectPosition: 'center 30%' }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#0b1326]/70" />
        {/* Bottom fade to solid bg */}
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-[#0b1326] to-transparent" />
      </div>

      {/* ─── Animated Aurora Blobs ─── */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#7c3aed]/15 to-[#4cd7f6]/10 blur-[100px] animate-aurora" />
        <div className="absolute top-[40%] -right-[300px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#4cd7f6]/10 to-[#7c3aed]/15 blur-[120px] animate-aurora-2" />
        <div className="absolute -bottom-[200px] left-[30%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#7c3aed]/10 to-transparent blur-[100px] animate-aurora delay-2000" />
      </div>

      <ParticleField />
      <div className="relative z-10 min-h-screen text-white overflow-x-hidden">
        {/* ─── NAV ─── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 w-full z-50 px-6 lg:px-12 h-20 flex items-center justify-between bg-[#0b1326]/50 backdrop-blur-2xl border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/25">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter">
              VOCALIS<span className="text-[#a78bfa]">.AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#ccc3d8]/60 hover:text-white text-sm font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-[#ccc3d8]/60 hover:text-white text-sm font-medium transition-colors">How it Works</a>
            {/* <button
              onClick={() => setShowAuth(true)}
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold hover:bg-white/[0.1] transition-all"
            >
              Sign In
            </button> */}
          </div>
        </motion.nav>

        {/* ─── HERO ─── */}
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
          {/* Hero glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c3aed]/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Floating decorative orbs */}
          <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-full bg-[#7c3aed]/40 animate-float delay-300" />
          <div className="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-[#4cd7f6]/50 animate-float-reverse delay-700" />
          <div className="absolute top-[60%] left-[15%] w-4 h-4 rounded-full bg-[#a78bfa]/20 animate-float-slow delay-1000" />
          <div className="absolute top-[70%] right-[20%] w-2.5 h-2.5 rounded-full bg-[#4cd7f6]/30 animate-float delay-500" />
          <div className="absolute top-[40%] left-[5%] w-1.5 h-1.5 rounded-full bg-white/20 animate-float-reverse delay-200" />
          <div className="absolute top-[35%] right-[6%] w-2 h-2 rounded-full bg-[#7c3aed]/30 animate-float-slow delay-1500" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4cd7f6]" />
              </span>
              <span className="text-xs font-semibold text-[#a78bfa] tracking-wider uppercase">Now in Public Beta</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              Your Voice.{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#4cd7f6] bg-clip-text text-transparent animate-gradient-shift bg-[length:300%_300%]">
                Our Intelligence.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-[#ccc3d8]/60 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Meet Vocalis — a real-time AI voice agent that listens, thinks, and speaks back.
              Powered by cutting-edge LLMs, speech recognition, and neural text-to-speech.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                id="hero-get-started-btn"
                onClick={() => setShowAuth(true)}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white font-bold text-base tracking-wide shadow-[0_8px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center gap-3 animate-glow-pulse overflow-hidden"
              >
                {/* Shimmer sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                <span className="relative z-10 flex items-center gap-3">
                  Get Started
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <a
                href="#features"
                className="px-8 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[#ccc3d8] font-semibold text-base hover:bg-white/[0.06] hover:text-white transition-all"
              >
                Learn More
              </a>
            </motion.div>

            {/* Floating orb preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-16 flex justify-center"
            >
              <div className="relative">
                {/* Outermost subtle ring */}
                <div className="absolute border border-[#7c3aed]/5 rounded-full w-[260px] h-[260px] -m-[60px] animate-spin-slow" />
                {/* Outer ring */}
                <div className="absolute border border-[#7c3aed]/10 rounded-full w-[220px] h-[220px] -m-10 animate-spin-slow-reverse" />
                {/* Ripple rings */}
                <div className="absolute border border-[#7c3aed]/15 rounded-full w-[160px] h-[160px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ripple" />
                <div className="absolute border border-[#4cd7f6]/10 rounded-full w-[160px] h-[160px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ripple delay-1000" />
                <div className="absolute border border-[#a78bfa]/10 rounded-full w-[160px] h-[160px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ripple delay-2000" />
                {/* Morphing glow blob behind orb */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-[180px] h-[180px] -m-5 rounded-full bg-gradient-to-br from-[#7c3aed]/30 to-[#4cd7f6]/20 blur-2xl animate-morph"
                />
                {/* Main Orb */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(76, 215, 246, 0.1)',
                      '0 0 70px rgba(124, 58, 237, 0.5), 0 0 120px rgba(76, 215, 246, 0.2)',
                      '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(76, 215, 246, 0.1)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 w-[140px] h-[140px] rounded-full bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4cd7f6] flex items-center justify-center animate-gradient-shift"
                >
                  <AudioLines className="text-white/50 w-14 h-14" />
                </motion.div>
                {/* Dashed ring */}
                <div className="absolute inset-0 border-2 border-white/5 border-dashed rounded-full w-[200px] h-[200px] -m-[30px] animate-spin-slow-reverse" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" className="relative px-6 py-24 lg:py-32">
          {/* Section glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#7c3aed]/30 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[120px] bg-[#7c3aed]/5 blur-[80px] rounded-full" />
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-xs font-bold text-[#a78bfa] uppercase tracking-[0.3em] mb-4 block">Features</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Everything you need for{' '}
                <span className="bg-gradient-to-r from-[#a78bfa] to-[#4cd7f6] bg-clip-text text-transparent">voice AI</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, i) => (
                <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="relative px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-xs font-bold text-[#4cd7f6] uppercase tracking-[0.3em] mb-4 block">How it Works</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                From voice to{' '}
                <span className="bg-gradient-to-r from-[#4cd7f6] to-[#a78bfa] bg-clip-text text-transparent">intelligence</span>
              </h2>
            </motion.div>

            <div className="space-y-8">
              {[
                { step: '01', title: 'You Speak', desc: 'Your voice is captured and streamed in real-time via WebSocket. Silero VAD detects speech boundaries automatically.', color: '#7c3aed' },
                { step: '02', title: 'We Listen', desc: 'faster-whisper transcribes your audio locally with enterprise-grade accuracy at incredible speed.', color: '#4cd7f6' },
                { step: '03', title: 'AI Thinks', desc: 'A LangGraph agent processes your request with tool calling, document retrieval (RAG), and contextual memory.', color: '#a78bfa' },
                { step: '04', title: 'Agent Speaks', desc: 'Neural TTS (ElevenLabs) synthesizes a natural voice response and streams it back to your browser in real-time.', color: '#4cd7f6' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-6 group"
                >
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold border border-white/[0.06] group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-[#ccc3d8]/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA FOOTER ─── */}
        <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
          {/* Animated background morph blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#7c3aed]/10 to-[#4cd7f6]/10 blur-[100px] animate-morph" />
          {/* Decorative line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-[#4cd7f6]/20 to-transparent" />
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
                Ready to talk to the{' '}
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#4cd7f6] bg-clip-text text-transparent">future</span>?
              </h2>
              <p className="text-[#ccc3d8]/60 text-lg mb-10">Join the beta and experience AI voice interaction like never before.</p>
              <button
                id="footer-get-started-btn"
                onClick={() => setShowAuth(true)}
                className="group px-10 py-5 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white font-bold text-lg tracking-wide shadow-[0_8px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] hover:-translate-y-1 active:scale-[0.98] transition-all inline-flex items-center gap-3"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-white/[0.04] px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#7c3aed]" />
              <span className="text-sm font-bold text-[#ccc3d8]/40">VOCALIS.AI</span>
            </div>
            <p className="text-[#ccc3d8]/25 text-xs">© 2026 Vocalis AI. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onComplete={() => {
              setShowAuth(false);
              onEnter();
            }}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
