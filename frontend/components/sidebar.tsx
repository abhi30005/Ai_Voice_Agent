import { Activity, BookOpen, BrainCircuit, History, LogOut, Network, Plus } from "lucide-react";

export function Sidebar({ 
  onLogout,
  activeView = 'dashboard',
  setActiveView,
  userEmail
}: { 
  onLogout?: () => void;
  activeView?: string;
  setActiveView?: (view: string) => void;
  userEmail?: string | null;
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'logs', label: 'Logs', icon: History },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  ];

  return (
    <aside className="fixed left-6 top-24 bottom-6 flex flex-col p-6 bg-[#0b1326]/40 backdrop-blur-[40px] border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl w-72 z-40 hidden lg:flex">
      <div className="mb-10">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d2bbff] to-[#4cd7f6] flex items-center justify-center shadow-lg">
              <BrainCircuit className="text-[#3f008e] w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0b1326] rounded-full"></div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Vocalis Core</p>
            <p className="text-[10px] text-[#4cd7f6] font-semibold uppercase tracking-widest">v4.2 Stable</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView?.(item.id)}
              className={`w-full flex items-center gap-4 rounded-xl px-5 py-3.5 transition-all group ${
                isActive 
                  ? 'bg-white/10 text-white border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
                  : 'text-[#ccc3d8] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4">
        <button className="w-full py-4 bg-[#7c3aed] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-[2px] transition-all group">
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span className="text-sm uppercase tracking-widest">New Session</span>
        </button>
        <button
          id="disconnect-btn"
          onClick={onLogout}
          className="w-full py-3 flex items-center gap-3 px-5 text-[#ccc3d8] hover:text-[#ff6b6b] transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
