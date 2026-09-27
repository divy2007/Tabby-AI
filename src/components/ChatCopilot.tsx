import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Copy,
  FileDown,
  Layers,
  ArrowUp,
  RotateCcw,
  Divide,
  Smartphone,
} from 'lucide-react';
import { ChatMessage, ReceiptData, Participant } from '../types';

interface ChatCopilotProps {
  messages: ChatMessage[];
  receipt: ReceiptData;
  participants: Participant[];
  onSendMessage: (text: string) => void;
  onRequestAllUPI: () => void;
  onCopyGroupChat: () => void;
  onDownloadReport: () => void;
  onTriggerToast: (msg: string) => void;
  onResetBill: () => void;
  isLoading?: boolean;
}

export const ChatCopilot: React.FC<ChatCopilotProps> = ({
  messages,
  receipt,
  participants,
  onSendMessage,
  onRequestAllUPI,
  onCopyGroupChat,
  onDownloadReport,
  onTriggerToast,
  onResetBill,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        onTriggerToast('🎙️ Tabby Voice active: speak your bill split command (e.g. "Aarav had the biryani")...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        onTriggerToast(`Heard: "${transcript}"`);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      if (!isListening) {
        setIsListening(true);
        onTriggerToast('🎙️ Voice dictation active (Say: "Pooja had the paneer tikka")');
        setTimeout(() => {
          setInputText('Pooja had the paneer tikka');
          setIsListening(false);
        }, 2000);
      } else {
        setIsListening(false);
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleChipClick = (promptText: string) => {
    onSendMessage(promptText);
  };

  const suggestionChips = [
    'Split bill equally among all of us',
    '+ Add Kabir to dinner',
    'We were 5 people tonight',
    'Pooja and Sneha shared paneer tikka',
    'Dhruv and Aarav had butter chicken',
    'Split garlic naans and dal across everyone',
    'Pooja also had a sweet lassi ₹120',
    'Reset assignments',
  ];

  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Copilot Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col flex-grow min-h-[460px]">
        {/* Assistant Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006948]/10 text-[#006948] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Tabby Indian Bill Copilot
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Bill #{receipt.billNumber} • {receipt.items.length} items • {participants.length} friends & family
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#00714d] bg-[#6cf8bb]/20 px-2.5 py-0.5 rounded-full border border-[#6cf8bb]/40">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>Online & Synced (₹)</span>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="py-4 flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'items-start gap-2 max-w-[92%]'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0 mt-0.5 border border-[#006948]/15">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#213145] text-white rounded-tr-xs shadow-xs font-medium'
                      : 'bg-[#eff4ff] text-[#0b1c30] rounded-tl-xs border border-blue-100/60 shadow-xs'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
                        .replace(/Dhruv/g, '<span class="text-purple-700 font-bold">Dhruv</span>')
                        .replace(/Aarav/g, '<span class="text-emerald-700 font-bold">Aarav</span>')
                        .replace(/Pooja/g, '<span class="text-amber-800 font-bold">Pooja</span>')
                        .replace(/Sneha/g, '<span class="text-indigo-700 font-bold">Sneha</span>'),
                    }}
                  />
                  <div className="text-[10px] font-mono text-slate-400 mt-1 text-right">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2 max-w-[90%]">
              <div className="w-7 h-7 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0 animate-spin">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[#eff4ff] text-[#0b1c30] px-4 py-2 rounded-2xl rounded-tl-xs text-xs font-mono flex items-center gap-2">
                <span>Tabby Copilot is computing proportional shares for Bill #{receipt.billNumber}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 pb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="shrink-0 px-3 py-1 rounded-full bg-[#eff4ff] hover:bg-slate-200/80 text-slate-700 hover:text-[#006948] text-xs font-medium transition-all border border-slate-200/70 active:scale-95 shadow-xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Natural Language Input Capsule */}
        <form onSubmit={handleSubmit} className="mt-auto">
          <div className="relative flex items-center bg-[#eff4ff] rounded-full p-1.5 focus-within:ring-2 focus-within:ring-[#006948] border border-slate-200/80 shadow-xs transition-all">
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-2 transition-colors rounded-full ${
                isListening
                  ? 'text-rose-600 bg-rose-100 animate-pulse'
                  : 'text-slate-500 hover:text-[#006948]'
              }`}
              title={isListening ? 'Stop listening' : 'Dictate voice command'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type command (e.g. 'Dhruv had butter chicken' or 'Split bill equally among 5 of us')..."
              className="w-full bg-transparent px-2 text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-8 h-8 rounded-full bg-[#006948] text-white flex items-center justify-center hover:bg-[#00855d] disabled:opacity-40 transition-all shadow-xs shrink-0 group active:scale-95"
            >
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </form>
      </div>

      {/* Quick Action Unified Settlement Dock */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRequestAllUPI}
          className="flex-1 min-w-[180px] py-2 px-4 rounded-full bg-[#006948] text-white hover:bg-[#00855d] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
        >
          <Smartphone className="w-4 h-4" />
          <span>Request All via UPI (GPay / PhonePe)</span>
        </button>

        <button
          type="button"
          onClick={onCopyGroupChat}
          className="py-2 px-4 rounded-full bg-[#eff4ff] hover:bg-slate-200/80 text-slate-800 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/70 transition-all active:scale-95"
        >
          <Copy className="w-3.5 h-3.5 text-slate-600" />
          <span>Copy to WhatsApp Group</span>
        </button>

        <button
          type="button"
          onClick={onDownloadReport}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
          title="Download Itemized Expense Report"
        >
          <FileDown className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onResetBill}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
          title="Reset item assignments"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
