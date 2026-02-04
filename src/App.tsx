import { useState, useRef } from 'react';
import axios from 'axios';
import { Send, Upload, FileText, Bot, User, Loader2, AlertCircle, Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Configuration
// On Render, we need to use the relative path if serving from same domain, or env var.
// For now, keep it flexible.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    source: string;
    size: number;
    mimetype: string;
  }>;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your RAG Assistant. Upload a PDF and ask me anything about it.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [useOcr, setUseOcr] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const url = `${API_URL}/ingest-file${useOcr ? '?ocr=true' : ''}`;
      await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFile(file.name);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Successfully ingested **${file.name}**${useOcr ? ' with OCR' : ''}. I am now ready to answer questions about it.` }]);
      setIsSidebarOpen(false); // Close sidebar on mobile after upload
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/query`, { question: userMessage });
      const { answer, sources } = response.data;
      
      setMessages(prev => [...prev, { role: 'assistant', content: answer, sources }]);
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-gray-900 text-gray-100 font-sans overflow-hidden relative">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-50">
        <div className="font-bold flex items-center gap-2">
           <Bot className="text-blue-400 w-6 h-6" /> RAG Chat
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-gray-800 border-r border-gray-700 flex flex-col transition-transform duration-300 z-50 shadow-2xl md:shadow-none",
        "fixed inset-y-0 left-0 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-gray-700 hidden md:block">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-blue-400" /> RAG Chat
          </h1>
        </div>

        {/* Mobile Header inside Sidebar */}
        <div className="md:hidden p-4 h-14 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <span className="font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-blue-400"/> Menu</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-700 rounded"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* ... sidebar content ... */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Document</h2>
            {uploadedFile ? (
              <div className="bg-gray-700/50 rounded-lg p-3 flex items-start gap-3 border border-gray-600">
                <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-medium truncate" title={uploadedFile}>{uploadedFile}</p>
                  <p className="text-xs text-green-400 mt-1">Active</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> No file loaded
              </div>
            )}
          </div>

          <div className="mt-auto">
             {/* OCR Toggle */}
            <div className="flex items-center gap-2 mb-4 px-1 bg-gray-900/50 p-2 rounded-lg">
              <input 
                type="checkbox" 
                id="ocr-toggle" 
                checked={useOcr} 
                onChange={(e) => setUseOcr(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="ocr-toggle" className="text-sm text-gray-300 select-none cursor-pointer flex-1">
                Enable OCR <span className="text-xs text-gray-500 block">(Slow, for scanned PDFs)</span>
              </label>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept="application/pdf"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Ingesting...' : 'Upload PDF'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">Supported formats: PDF</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full pt-14 md:pt-0 relative overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent w-full">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-2 md:gap-4 max-w-3xl mx-auto w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1 hidden xs:flex">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={cn("max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm", 
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700"
              )}>
                <div className="prose prose-invert prose-sm whitespace-pre-wrap leading-relaxed break-words max-w-none">
                  {msg.content}
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <span key={i} className="text-xs bg-gray-900 border border-gray-700 px-2 py-1.5 rounded-md text-gray-300 flex items-center gap-1.5 max-w-full">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[150px]">{src.source}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* ... loading state ... */}
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-900 pb-[calc(env(safe-area-inset-bottom)+12px)] w-full z-10">
          <div className="max-w-3xl mx-auto relative w-full">
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-gray-800 text-gray-100 rounded-xl pl-4 pr-12 py-3.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-base appearance-none"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-500 mt-2">
              Powered by Llama 3 & Local Embeddings
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}

export default App;