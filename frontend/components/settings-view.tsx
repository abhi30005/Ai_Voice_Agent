import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Key, Mic, Sliders, Save, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';

type Tab = 'providers' | 'agent' | 'voice';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<Tab>('providers');
  const [settings, setSettings] = useState<any>({
    providers: { openai_api_key: '', groq_api_key: '', elevenlabs_api_key: '' },
    agent: { system_prompt: '', primary_model: 'gpt-4o', temperature: 70, allow_interruption: true },
    voice: { voice_id: 'alloy', speaking_rate: 50 }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.get('/settings');
        setSettings({
          providers: data.providers || { openai_api_key: '', groq_api_key: '', elevenlabs_api_key: '' },
          agent: data.agent || { system_prompt: '', primary_model: 'gpt-4o', temperature: 70, allow_interruption: true },
          voice: data.voice || { voice_id: 'alloy', speaking_rate: 50 }
        });
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await api.post('/settings', settings);
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (section: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex gap-6"
    >
      <div className="w-64 flex flex-col gap-2">
        <SettingsTab icon={Key} label="API Providers" active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} />
        <SettingsTab icon={Sliders} label="Agent Configuration" active={activeTab === 'agent'} onClick={() => setActiveTab('agent')} />
        <SettingsTab icon={Mic} label="Voice Profiles" active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} />
      </div>

      <div className="flex-1 bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 overflow-y-auto scrollbar-hide relative">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="max-w-2xl">
            {activeTab === 'providers' && <ProvidersForm data={settings.providers} update={(k: string, v: any) => updateSection('providers', k, v)} onSave={handleSave} saving={saving} msg={saveMessage} />}
            {activeTab === 'agent' && <AgentForm data={settings.agent} update={(k: string, v: any) => updateSection('agent', k, v)} onSave={handleSave} saving={saving} msg={saveMessage} />}
            {activeTab === 'voice' && <VoiceForm data={settings.voice} update={(k: string, v: any) => updateSection('voice', k, v)} onSave={handleSave} saving={saving} msg={saveMessage} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── FORMS ──────────────────────────────────────────────────────────────────

function ProvidersForm({ data, update, onSave, saving, msg }: any) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-[#a78bfa]" /> API Providers
        </h2>
        <p className="text-[#ccc3d8]/60 mt-1">Configure your LLM and TTS provider credentials.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white block">OpenAI API Key</label>
          <input type="password" value={data.openai_api_key} onChange={(e) => update('openai_api_key', e.target.value)} placeholder="sk-..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#7c3aed]/50 transition-colors" />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white block">Groq API Key (Optional)</label>
          <input type="password" value={data.groq_api_key} onChange={(e) => update('groq_api_key', e.target.value)} placeholder="gsk_..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#7c3aed]/50 transition-colors" />
        </div>
        <div className="space-y-3 pt-6 border-t border-white/5">
          <label className="text-sm font-semibold text-white block">ElevenLabs API Key</label>
          <input type="password" value={data.elevenlabs_api_key} onChange={(e) => update('elevenlabs_api_key', e.target.value)} placeholder="sk_..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#7c3aed]/50 transition-colors" />
        </div>
        <SaveAction onSave={onSave} saving={saving} msg={msg} />
      </div>
    </>
  );
}

function AgentForm({ data, update, onSave, saving, msg }: any) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Sliders className="w-6 h-6 text-[#4cd7f6]" /> Agent Configuration
        </h2>
        <p className="text-[#ccc3d8]/60 mt-1">Tune the behavior and capabilities of your AI voice agent.</p>
      </div>
      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white block">System Prompt</label>
          <textarea rows={5} value={data.system_prompt} onChange={(e) => update('system_prompt', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4cd7f6]/50 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white block">Primary Model</label>
            <select value={data.primary_model} onChange={(e) => update('primary_model', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#4cd7f6]/50 appearance-none [&>option]:bg-[#0b1326]">
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="llama-3">Llama 3 70B (Groq)</option>
              <option value="claude-3-5">Claude 3.5 Sonnet</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white block">Temperature ({data.temperature / 100})</label>
            <input type="range" min="0" max="100" value={data.temperature} onChange={(e) => update('temperature', parseInt(e.target.value))} className="w-full accent-[#4cd7f6]" />
          </div>
        </div>
        <div className="space-y-3 pt-6 border-t border-white/5">
          <label className="text-sm font-semibold text-white block">Interruption Handling</label>
          <div className="flex items-center gap-3" onClick={() => update('allow_interruption', !data.allow_interruption)}>
            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${data.allow_interruption ? 'bg-[#4cd7f6]' : 'bg-white/10'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${data.allow_interruption ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-[#ccc3d8]">Allow user to interrupt agent speech</span>
          </div>
        </div>
        <SaveAction color="from-[#4cd7f6] to-[#0ea5e9]" shadow="shadow-[#4cd7f6]/40" onSave={onSave} saving={saving} msg={msg} />
      </div>
    </>
  );
}

function VoiceForm({ data, update, onSave, saving, msg }: any) {
  const voices = [
    { id: 'alloy', name: 'Alloy', type: 'Neutral, Balanced' },
    { id: 'echo', name: 'Echo', type: 'Warm, Male' },
    { id: 'fable', name: 'Fable', type: 'Expressive, British' },
    { id: 'onyx', name: 'Onyx', type: 'Deep, Authoritative' },
    { id: 'nova', name: 'Nova', type: 'Energetic, Female' },
    { id: 'shimmer', name: 'Shimmer', type: 'Clear, Articulate' },
  ];
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Mic className="w-6 h-6 text-emerald-400" /> Voice Profiles
        </h2>
        <p className="text-[#ccc3d8]/60 mt-1">Select and configure the text-to-speech voice for your agent.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white block mb-4">Available Voices</label>
          <div className="grid grid-cols-1 gap-3">
            {voices.map(v => (
              <div key={v.id} onClick={() => update('voice_id', v.id)} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${data.voice_id === v.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${data.voice_id === v.id ? 'border-emerald-400' : 'border-[#ccc3d8]/40'}`}>
                    {data.voice_id === v.id && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{v.name}</h4>
                    <p className="text-xs text-[#ccc3d8]/60">{v.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 pt-6 border-t border-white/5">
          <label className="text-sm font-semibold text-white block">Speaking Rate</label>
          <input type="range" min="0" max="100" value={data.speaking_rate} onChange={(e) => update('speaking_rate', parseInt(e.target.value))} className="w-full accent-emerald-400" />
        </div>
        <SaveAction color="from-emerald-400 to-emerald-600" shadow="shadow-emerald-500/40" onSave={onSave} saving={saving} msg={msg} />
      </div>
    </>
  );
}

function SaveAction({ color = "from-[#7c3aed] to-[#6d28d9]", shadow = "shadow-[#7c3aed]/40", onSave, saving, msg }: any) {
  return (
    <div className="pt-8 flex items-center justify-between">
      <span className="text-sm text-emerald-400">{msg}</span>
      <button onClick={onSave} disabled={saving} className={`px-6 py-3 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm shadow-[0_4px_20px_var(--tw-shadow-color)] hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50`} style={{ "--tw-shadow-color": "transparent" } as any}>
        {saving ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
        Save Configuration
      </button>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all text-left ${active ? 'bg-white/10 text-white font-bold border border-white/20' : 'text-[#ccc3d8]/70 hover:text-white hover:bg-white/5 border border-transparent font-medium'}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-white' : ''}`} /> {label}
    </button>
  );
}
