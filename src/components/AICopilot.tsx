import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { User } from '../types';

export const AICopilot = ({ user }: { user: User }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'ai' }[]>([{
    id: 'ai-initial',
    text: `Hello ${user?.name?.split(' ')?.[0] || 'Student'}! I'm your AI TVET Tutor. How can I help you master **${user?.trade || 'your skills'}** today?`,
    sender: 'ai'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { id: `user-${Date.now()}`, text: input, sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(userMessage.text);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, text: response.reply, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: `ai-err-${Date.now()}`, text: "Sorry, I'm having trouble connecting right now. Let's try again in a moment.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[150] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mb-4 w-[360px] md:w-[420px] h-[600px] max-h-[80vh] flex flex-col bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[2.5rem] border border-zinc-200/50 dark:border-white/10 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-sm">AI Tutor</h3>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={cn(
                      "flex gap-4",
                      msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1",
                      msg.sender === 'user' ? "bg-zinc-100 dark:bg-zinc-800" : "bg-indigo-500"
                    )}>
                      {msg.sender === 'user' ? <UserIcon className="w-4 h-4 text-zinc-500" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={cn(
                      "px-5 py-4 rounded-3xl max-w-[80%]",
                      msg.sender === 'user' 
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-black rounded-tr-sm" 
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-200 dark:border-zinc-800"
                    )}>
                      {msg.sender === 'ai' ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none text-xs">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-5 py-4 rounded-3xl bg-zinc-100 dark:bg-zinc-900 rounded-tl-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about TVET topics..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-xl flex items-center justify-center transition-all disabled:text-zinc-500"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all relative group overflow-hidden",
            isOpen ? "bg-zinc-900 dark:bg-zinc-800 shadow-zinc-900/20" : "bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-indigo-500/30"
          )}
        >
          {!isOpen && (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.4)_360deg)] group-hover:scale-110 transition-transform" 
            />
          )}
          <div className="absolute inset-[2px] rounded-[2rem] bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 z-0" />
          {isOpen && <div className="absolute inset-[2px] rounded-[2rem] bg-zinc-900 dark:bg-zinc-800 z-0" />}
          
          <div className="relative z-10">
            {isOpen ? <X className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
          </div>
          
          {/* Notification Dot */}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-zinc-900 rounded-full animate-bounce z-20" />
          )}
        </motion.button>
      </div>
    </>
  );
};
