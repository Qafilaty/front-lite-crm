import React, { useState, useRef, useEffect } from 'react';
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { ASK_CRM_AGENT, GET_CRM_AGENT_HISTORY, CLEAR_CRM_AGENT_HISTORY, GET_CRM_AGENT_SUGGESTIONS } from '../../graphql/queries';
import { Send, Bot, User, Sparkles, Loader2, Maximize, Minimize, ExternalLink, RotateCcw, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface AIAssistantPageProps {
  isStandalone?: boolean;
}

const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ isStandalone = false }) => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Security check: Only allow specific emails
  if (user?.email !== 'wilo@gmail.com' && user?.email !== 'hicham5lehouedj@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init-crm', 
      type: 'agent', 
      content: 'أهلاً بك يا سيدي! 👋 أنا المساعد الذكي الشامل الخاص بشركتك. أنا متصل مباشرة بقاعدة البيانات وأستطيع تزويدك بأدق التحليلات عن المبيعات، المرتجعات، المصاريف، وأداء المنتجات.\n\nكما يمكنني متابعة حالة طلب معين برقم الهاتف أو رقم التتبع، وإعطائك نظرة شاملة عن المخزون وشركات التوصيل المربوطة.\n\n**كيف يمكنني مساعدتك اليوم؟**', 
      timestamp: new Date() 
    }
  ]);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [model, setModel] = useState(() => localStorage.getItem('crm_agent_model') || 'google/gemini-3.1-flash-lite');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('crm_agent_model', model);
  }, [model]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const openInNewWindow = () => {
    window.open('/ai-assistant-standalone', '_blank');
  };

  // 1. Fetch persistent chat history from MongoDB
  const { loading: historyLoading } = useQuery(GET_CRM_AGENT_HISTORY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getCRMAgentHistory && data.getCRMAgentHistory.length > 0) {
        const historyMsgs = data.getCRMAgentHistory.map((m: any, idx: number) => ({
          id: 'hist-' + idx + '-' + new Date(m.timestamp).getTime(),
          type: m.role === 'user' ? 'user' : 'agent' as 'user' | 'agent',
          content: m.content,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(historyMsgs);
      }
    }
  });

  // 2. Clear history mutation
  const [clearHistory, { loading: clearing }] = useMutation(CLEAR_CRM_AGENT_HISTORY, {
    onCompleted: () => {
      setMessages([
        { 
          id: 'init-crm', 
          type: 'agent', 
          content: 'أهلاً بك يا سيدي! 👋 أنا المساعد الذكي الشامل الخاص بشركتك. أنا متصل مباشرة بقاعدة البيانات وأستطيع تزويدك بأدق التحليلات عن المبيعات، المرتجعات، المصاريف، وأداء المنتجات.\n\nكما يمكنني متابعة حالة طلب معين برقم الهاتف أو رقم التتبع، وإعطائك نظرة شاملة عن المخزون وشركات التوصيل المربوطة.\n\n**كيف يمكنني مساعدتك اليوم؟**', 
          timestamp: new Date() 
        }
      ]);
    }
  });

  const handleNewChat = () => {
    if (clearing) return;
    clearHistory();
  };

  const [streaming, setStreaming] = useState(false);
  const loading = streaming;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const [fetchSuggestions] = useLazyQuery(GET_CRM_AGENT_SUGGESTIONS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getCRMAgentSuggestions) {
        setSuggestions(data.getCRMAgentSuggestions);
      }
    }
  });

  useEffect(() => {
    if (!loading && !historyLoading) {
      fetchSuggestions();
    }
  }, [messages.length, loading, historyLoading]);

  const handleSend = async (textToSend?: string) => {
    const msgToSend = textToSend || input.trim();
    if (!msgToSend || streaming || historyLoading) return;

    const userMsgId = 'user-' + Date.now();
    setMessages(prev => [...prev, {
      id: userMsgId,
      type: 'user',
      content: msgToSend,
      timestamp: new Date()
    }]);
    
    setInput('');
    setStreaming(true);

    const agentMsgId = 'agent-' + (Date.now() + 1);
    setMessages(prev => [...prev, {
      id: agentMsgId,
      type: 'agent',
      content: '🔍 *[جاري بدء التحليل والاتصال بخدمة الذكاء الاصطناعي...]*\n\n',
      timestamp: new Date()
    }]);

    try {
      const token = localStorage.getItem('authToken');
      const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/graphql').replace('/graphql', '');
      
      const response = await fetch(`${apiBaseUrl}/api/ai/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? token : '',
        },
        body: JSON.stringify({
          message: msgToSend,
          model: model
        })
      });

      if (!response.ok) {
        let errText = "فشل الاتصال بخادم الذكاء الاصطناعي.";
        try {
          const errData = await response.json();
          if (errData?.message) errText = errData.message;
        } catch (_) {}
        throw new Error(errText);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let accumulatedText = '';
      let thoughtsText = '';

      while (!finished && reader) {
        const { value, done } = await reader.read();
        finished = done;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                finished = true;
                break;
              }
              try {
                const chunk = JSON.parse(dataStr);
                
                if (chunk.type === 'error') {
                  accumulatedText = chunk.message;
                  finished = true;
                  break;
                }

                if (chunk.type === 'text-delta') {
                  accumulatedText += chunk.text;
                  setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, content: thoughtsText + accumulatedText } : m));
                } else if (chunk.type === 'tool-call') {
                  const toolNameArabic = mapToolNameToArabic(chunk.toolName);
                  thoughtsText += `🔍 *[خطوة تفكير: جاري تشغيل أداة ${toolNameArabic}...]*\n\n`;
                  setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, content: thoughtsText + accumulatedText } : m));
                }
              } catch (e) {
                // Ignore partial JSON parsing errors
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error during streaming:", error);
      setMessages(prev => prev.map(m => m.id === agentMsgId 
        ? { ...m, content: `❌ عذراً، حدث خطأ أثناء الاتصال بالنظام: ${error.message || "يرجى التحقق من اتصالك بالإنترنت"}` } 
        : m
      ));
    } finally {
      setStreaming(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSend(suggestionText);
  };

  const pool = Array.from(new Set([
    ...suggestions,
    ...messages.filter(m => m.type === 'user').map(m => m.content),
    "ما هي نسبة تسليم الطلبات هذا الشهر؟",
    "أعطني نظرة عامة على المخزون والمنتجات الأكثر مبيعاً.",
    "ما هي الولايات الأكثر مبيعاً؟",
    "أعطني ملخصاً للمصاريف التسويقية.",
    "ما هو صافي الأرباح لهذا الأسبوع؟",
    "كيف يمكنني تقليل نسبة المرتجعات وتحسين التوصيل؟",
    "ما هي المنتجات التي تقترب من النفاد؟",
    "تتبع الطلب الخاص بالزبون"
  ]));

  const filteredSuggestions = input.trim() === ''
    ? suggestions
    : pool.filter(s => 
        s.toLowerCase().includes(input.toLowerCase()) && 
        s.toLowerCase() !== input.toLowerCase()
      );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      ref={containerRef}
      dir={i18n.dir()}
      className={`${(isFullscreen || isStandalone) ? 'h-[100dvh] w-screen fixed inset-0 z-[9999] rounded-none border-none' : 'h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] rounded-2xl w-full border border-slate-800'} flex flex-col bg-[#0F172A] text-slate-200 overflow-hidden relative shadow-2xl transition-all duration-300 ${i18n.language === 'ar' ? "font-['Tajawal']" : "font-['Roboto']"}`}
    >
      
      {/* Premium Header */}
      <div className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-indigo-950/90 border-indigo-500/10 to-transparent z-10 flex items-center px-6 border-b backdrop-blur-sm`}>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <div className={`w-12 h-12 bg-indigo-600 shadow-indigo-600/30 rounded-2xl flex items-center justify-center shadow-lg rotate-3 transition-transform hover:rotate-6`}>
              <Sparkles className="text-white w-6 h-6 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              المساعد الذكي للشركة
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border-indigo-500/30 border`}>BETA</span>
            </h1>
            <p className={`text-sm text-indigo-200/60 font-medium`}>متصل ببيانات المبيعات والمخزون الحية</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="relative flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 h-10 gap-2 transition-all select-none">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none pr-6 cursor-pointer focus:ring-0 focus:text-white"
            >
              <option value="google/gemini-3.1-flash-lite" className="bg-[#0F172A] text-white">Google: Gemini 3.1 Flash Lite (افتراضي)</option>
              <option value="openai/gpt-oss-20b:free" className="bg-[#0F172A] text-white">OpenAI: gpt-oss-20b (مجاني)</option>
              <option value="openai/gpt-oss-120b:free" className="bg-[#0F172A] text-white">OpenAI: gpt-oss-120b (مجاني)</option>
              <option value="openai/gpt-5-nano" className="bg-[#0F172A] text-white">OpenAI: GPT-5 Nano (اقتصادي)</option>
              <option value="openai/gpt-4.1-nano" className="bg-[#0F172A] text-white">OpenAI: GPT-4.1 Nano (اقتصادي)</option>
              <option value="openai/gpt-4o-mini" className="bg-[#0F172A] text-white">OpenAI: GPT-4o-mini</option>
            </select>
          </div>
          <button 
            onClick={handleNewChat}
            disabled={clearing || historyLoading}
            className={`px-4 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 text-xs font-bold transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer ${(clearing || historyLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="بدء محادثة جديدة وتصفير السجل"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>
          {!isStandalone && (
            <button 
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? "تصغير" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          )}
          {!isStandalone && (
            <button 
              onClick={openInNewWindow}
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title="فتح في صفحة منفصلة"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-28 pb-10 custom-scrollbar scroll-smooth" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Agent Avatar */}
              {msg.type === 'agent' && (
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-1`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Message Bubble */}
              <div 
                className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-sm ${
                  msg.type === 'user' 
                    ? `bg-indigo-600 text-white rounded-tl-sm` 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tr-sm'
                }`}
              >
                {msg.type === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{msg.content}</p>
                ) : (
                  <div className={`markdown-body text-[15px] leading-relaxed prose prose-invert max-w-none prose-p:my-2 prose-headings:text-indigo-300 prose-strong:text-white prose-li:my-1 prose-table:w-full prose-td:border-slate-700 prose-th:border-slate-600 prose-th:bg-slate-900/50`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                <span className={`text-[10px] mt-3 block font-medium ${msg.type === 'user' ? 'text-indigo-200/70' : 'text-slate-500'}`}>
                  {msg.timestamp.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* User Avatar */}
              {msg.type === 'user' && (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shadow-lg flex-shrink-0 mt-1 border border-slate-600">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && messages[messages.length - 1]?.type !== 'agent' && (
            <div className="flex gap-4 justify-start">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-1`}>
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-slate-800 border border-slate-700 text-slate-200 rounded-3xl rounded-tr-sm p-5 shadow-sm flex items-center gap-2">
                <div className="flex space-x-1 space-x-reverse">
                  <div className={`w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
                  <div className={`w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
                  <div className={`w-2 h-2 bg-indigo-500 rounded-full animate-bounce`}></div>
                </div>
                <span className="text-sm text-slate-400 font-medium mr-3">جاري تحليل الأرقام والبيانات...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800">
        {/* Suggestion Chips */}
        {input.trim() === '' && filteredSuggestions.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto justify-start overflow-x-auto pb-1 custom-scrollbar" dir="rtl">
            {filteredSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 text-xs bg-slate-800/85 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-slate-300 hover:text-indigo-200 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto relative flex items-end gap-3">
          <div className="relative flex-1 bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
            {/* Autocomplete Suggestion List */}
            {input.trim() !== '' && filteredSuggestions.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-20" dir="rtl">
                <div className="py-1">
                  {filteredSuggestions.slice(0, 5).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-right px-5 py-3 text-sm text-slate-300 hover:bg-indigo-600/90 hover:text-white transition-all duration-150 flex items-center gap-2 cursor-pointer font-medium border-b border-slate-700/30 last:border-b-0"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={"اسألني عن مبيعاتك، مخزونك، حالة طلب معين، أو اطلب نصيحة إدارية..."}
              className="w-full bg-transparent text-white placeholder-slate-500 px-5 py-4 min-h-[56px] max-h-40 outline-none resize-none custom-scrollbar font-medium"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
              dir="auto"
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300
              ${input.trim() && !loading 
                ? `bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-500 text-white shadow-lg hover:scale-105 active:scale-95` 
                : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'}
            `}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className={`w-6 h-6 ${input.trim() ? i18n?.dir() === 'rtl' ? 'rotate-180' : '' : ''}`} />}
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">
          المساعد الذكي يقرأ بيانات متجرك الحية. قد يخطئ الذكاء الاصطناعي، يرجى مراجعة الأرقام الهامة.
        </p>
      </div>

      {/* Styles for Markdown */}
      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body table {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 8px;
          border: 1px solid #334155;
          margin: 1rem 0;
        }
        .markdown-body th, .markdown-body td {
          padding: 12px 16px;
          text-align: right;
          white-space: nowrap;
        }
        .markdown-body th {
          background-color: #0F172A;
          color: #818CF8;
          font-weight: 900;
        }
        .markdown-body tr:not(:last-child) td {
          border-bottom: 1px solid #334155;
        }
      `}} />
    </div>
  );
};

const mapToolNameToArabic = (name: string): string => {
  switch (name) {
    case 'getFinancialData': return 'البيانات المالية والمبيعات';
    case 'getInventoryData': return 'المخزون والمنتجات';
    case 'getOperationsData': return 'شركات الشحن والعمليات';
    case 'searchOrders': return 'البحث في الطلبات';
    case 'getSalaries': return 'حسابات الرواتب';
    case 'getFinancialTransactions': return 'التدفقات المالية والمصاريف';
    case 'getNetProfitAnalysis': return 'تحليل الأرباح الصافية';
    default: return name;
  }
};

export default AIAssistantPage;
