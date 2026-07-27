import { motion } from 'motion/react';
import { Construction } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="col-span-1 lg:col-span-12 flex flex-col items-center justify-center min-h-[60vh] bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-10"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-[#7c3aed]/20 to-[#4cd7f6]/10 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-lg shadow-[#7c3aed]/10">
        <Construction className="w-10 h-10 text-[#a78bfa]" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-3">{title}</h2>
      <p className="text-[#ccc3d8]/60 max-w-md text-center">{description}</p>
      
      <div className="mt-8 flex gap-3">
        <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#a78bfa] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </motion.div>
  );
}
