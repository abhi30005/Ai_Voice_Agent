import { Brain, LayoutGrid } from "lucide-react";

export function TopNav({ 
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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 lg:px-12 h-20 bg-[#0b1326]/40 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
      <button
        id="logo-home-btn"
        onClick={onLogout}
        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        title="Back to Home"
      >
        <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
          <Brain className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-extrabold text-white tracking-tighter">
          VOCALIS<span className="text-[#d2bbff]">.AI</span>
        </span>
      </button>
      <div className="hidden lg:flex items-center gap-10">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView?.(item.id)}
            className={`text-sm tracking-widest uppercase transition-all pb-1 border-b-2 ${
              activeView === item.id 
                ? 'text-[#d2bbff] font-bold border-[#d2bbff]' 
                : 'text-[#ccc3d8] hover:text-white font-medium border-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <div className="w-8 h-8 rounded-full border-2 border-[#0b1326] bg-[#222a3d] flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="User" src="https://ui-avatars.com/api/?name=User&background=222a3d&color=fff" />
        </div>
        <button className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-[#ccc3d8]">
          <LayoutGrid className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
