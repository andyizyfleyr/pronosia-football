import React, { useState, useRef, useEffect } from 'react';
// CHANGEMENT: Gemini 3
import { chatWithAssistant } from '../services/geminiService';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'model', text: 'Bonjour ! Je suis Gemini, votre expert football. Je peux analyser les matchs, les formes récentes et les stats en temps réel. Posez-moi une question !' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversion de l'historique local vers le format Gemini
  const getHistory = () => {
     return messages.map(m => ({
         role: m.role,
         parts: [{ text: m.text }]
     }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // On passe l'historique moins le dernier message user qu'on envoie maintenant
      const responseText = await chatWithAssistant(
          newHistory.slice(0, -1).map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
          userMsg.text
      );
      
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: "Erreur technique. Gemini ne répond pas." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/10 rounded-full">
            <Bot size={24} className="text-indigo-500" />
        </div>
        <div>
            <h3 className="text-white font-semibold">Assistant Gemini 3</h3>
            <p className="text-xs text-slate-400">Intelligence Artificielle Live</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl px-5 py-3 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-slate-700 text-slate-200 rounded-tl-sm'}
            `}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-5 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center space-x-2 bg-slate-900 rounded-full border border-slate-600 px-4 py-2 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
            placeholder="Posez une question sur un match..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;