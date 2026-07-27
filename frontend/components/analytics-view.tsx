import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, TrendingUp, Users, Clock, Server } from 'lucide-react';
import { api } from '@/lib/api';

export function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/analytics');
        setData(res);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-[#4cd7f6]/30 border-t-[#4cd7f6] rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex items-center justify-center text-[#ccc3d8]/60">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 lg:col-span-12 space-y-6 pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#4cd7f6]" />
            Performance Analytics
          </h2>
          <p className="text-[#ccc3d8]/60 mt-1 text-sm">Real-time metrics for your AI voice agent pipeline.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Pipeline Healthy
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="E2E Latency" value={`${data.overview.avg_latency_ms}ms`} trend={data.overview.latency_trend} icon={Zap} color="text-[#4cd7f6]" />
        <StatCard title="Tokens Generated" value={(data.overview.total_tokens / 1000000).toFixed(1) + 'M'} trend={data.overview.tokens_trend} icon={TrendingUp} color="text-[#a78bfa]" />
        <StatCard title="API Hit Time" value={`${data.overview.api_hit_time_ms}ms`} trend={data.overview.api_trend} icon={Clock} color="text-amber-400" invertTrend />
        <StatCard title="Active Sessions" value={data.overview.active_sessions.toString()} trend={data.overview.sessions_trend} icon={Users} color="text-emerald-400" />
      </div>

      {/* CHARTS AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Chart */}
        <div className="col-span-1 lg:col-span-2 bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 h-80 flex flex-col">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4cd7f6]" />
            Latency Distribution (ms)
          </h3>
          <div className="flex-1 flex items-end justify-between gap-2">
            {data.latency_chart_data.map((val: number, i: number) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="w-full bg-gradient-to-t from-[#4cd7f6]/10 to-[#4cd7f6] rounded-t-sm"
              />
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="col-span-1 bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#a78bfa]" />
            Provider Latency Breakdown
          </h3>
          <div className="space-y-6">
            {data.providers.map((p: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#ccc3d8]">{p.name}</span>
                  <span className="text-white font-mono">{p.avg_latency}ms</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.avg_latency / 400) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className={`h-full ${p.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, invertTrend = false }: any) {
  const isPositive = trend > 0;
  const showGreen = invertTrend ? !isPositive : isPositive;
  
  return (
    <div className="bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color.replace('text-', 'from-')}/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${showGreen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isPositive ? '+' : ''}{trend}%
          </div>
        </div>
        <div>
          <h3 className="text-[#ccc3d8]/60 text-sm font-medium mb-1">{title}</h3>
          <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}
