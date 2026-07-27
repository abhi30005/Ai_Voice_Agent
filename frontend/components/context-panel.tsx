import { CheckCircle2, Wifi } from "lucide-react";

export function ContextPanel() {
  return (
    <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
      <div className="bg-[#0b1326]/40 backdrop-blur-[40px] border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[#ccc3d8] font-semibold uppercase tracking-[0.2em] text-[10px]">Active Pipelines</h3>
          <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse shadow-[0_0_10px_#4cd7f6]"></span>
        </div>
        <div className="space-y-3">

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="font-mono text-[11px] text-[#ccc3d8]">ElevenLabs Neural</span>
            <CheckCircle2 className="w-[14px] h-[14px] text-[#4cd7f6]" />
          </div>
        </div>
      </div>


      <div className="bg-[#0b1326]/40 backdrop-blur-[40px] border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 rounded-3xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
          <Wifi className="text-[#4cd7f6] w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white uppercase tracking-widest">Network Latency</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-bold text-[#4cd7f6]">24ms</span>
            <span className="text-[10px] text-[#ccc3d8] font-mono">STABLE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
