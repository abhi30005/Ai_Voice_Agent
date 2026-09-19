import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Upload, FileText, Trash2, Search, Plus } from 'lucide-react';
import { api } from '@/lib/api';

export function KnowledgeBaseView() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      const data = await api.get('/documents');
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    const hasPending = documents.some(doc => !doc.indexed);
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchDocs();
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('vocalis_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      await fetch(`${baseUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      await fetchDocs();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (loading) {
    return (
      <div className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 lg:col-span-12 h-[calc(100vh-140px)] flex flex-col bg-[#0b1326]/40 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-6 h-6 text-[#a78bfa]" />
            Knowledge Base
          </h2>
          <p className="text-[#ccc3d8]/60 mt-1 text-sm">Upload documents to give your agent custom context (RAG).</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc3d8]/40" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-[#ccc3d8]/40 focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
            />
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white text-sm font-bold shadow-lg shadow-[#7c3aed]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Plus className="w-4 h-4" />}
            Upload File
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-[#ccc3d8]/30" />
            </div>
            <h3 className="text-white font-bold mb-2">No documents yet</h3>
            <p className="text-[#ccc3d8]/60 text-sm max-w-sm mb-6">Upload PDFs, text files, or markdown to teach your agent new information.</p>
            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors">
              Browse Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.06] hover:border-[#a78bfa]/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#4cd7f6]/10 text-[#a78bfa]">
                      <FileText className="w-6 h-6" />
                    </div>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-white font-semibold text-sm truncate mb-1" title={doc.filename}>{doc.filename}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[#ccc3d8]/50 text-xs">{new Date(doc.created_at).toLocaleDateString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.indexed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {doc.indexed ? 'INDEXED' : 'PENDING'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
