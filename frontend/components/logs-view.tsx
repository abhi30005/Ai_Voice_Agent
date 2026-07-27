import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Calendar, Clock, Download, Play, ChevronRight, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';

export function LogsView() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await api.get('/conversations');
        setConversations(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

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
      className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex flex-col bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#7c3aed]" />
            Conversation Logs
          </h2>
          <p className="text-[#ccc3d8]/60 mt-1 text-sm">Review past interactions and analyze agent performance.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc3d8]/40" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-[#ccc3d8]/40 focus:outline-none focus:border-[#7c3aed]/50 transition-colors"
            />
          </div>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#ccc3d8]/70 hover:bg-white/10 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="py-4 px-6 text-xs font-semibold text-[#ccc3d8]/50 uppercase tracking-wider">Date & Time</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#ccc3d8]/50 uppercase tracking-wider">Duration</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#ccc3d8]/50 uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#ccc3d8]/50 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {conversations.map((log, i) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#7c3aed]/10 text-[#a78bfa]">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[#ccc3d8]/50 text-xs">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[#ccc3d8] text-sm">
                      <Clock className="w-3 h-3 text-[#ccc3d8]/50" />
                      {/* Assuming duration is calculated or we just show a mock one for now if not in schema */}
                      {log.duration || '02:45'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Completed
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-[#ccc3d8] hover:text-white transition-colors" title="Play Recording">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 text-[#ccc3d8] hover:text-white transition-colors" title="View Transcript">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#ccc3d8]/50 text-sm">
                    No conversation logs found. Talk to the agent to create some!
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
