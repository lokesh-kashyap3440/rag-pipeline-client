import { useState, useRef } from 'react';
import axios from 'axios';
import { Send, Upload, FileText, Bot, User, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Configuration
const API_URL = 'http://localhost:3000/api';

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
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-blue-400" /> RAG Chat
          </h1>
        </div>
        
        <div className="p-4 flex-1">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Document</h2>
            {uploadedFile ? (
              <div className="bg-gray-700/50 rounded-lg p-3 flex items-start gap-3 border border-gray-600">
                <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{uploadedFile}</p>
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
            <div className="flex items-center gap-2 mb-3 px-1">
              <input 
                type="checkbox" 
                id="ocr-toggle" 
                checked={useOcr} 
                onChange={(e) => setUseOcr(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="ocr-toggle" className="text-sm text-gray-300 select-none cursor-pointer">
                Enable OCR (Slower)
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
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Ingesting...' : 'Upload PDF'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">Supported formats: PDF</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-4 max-w-3xl mx-auto", msg.role === 'user' ? "justify-end" : "justify-start")}>
              
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={cn("max-w-[80%] rounded-2xl p-4", 
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700"
              )}>
                <div className="prose prose-invert prose-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <span key={i} className="text-xs bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {src.source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-3xl mx-auto">
               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-bl-none p-4 border border-gray-700 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your document..."
                className="w-full bg-gray-800 text-gray-100 rounded-xl pl-4 pr-12 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-xs text-gray-600 mt-2">
              Powered by Llama 3 & Local Embeddings
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;