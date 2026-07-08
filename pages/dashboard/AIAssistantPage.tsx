import React, { useState, useRef, useEffect } from 'react';
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { ASK_CRM_AGENT, GET_CRM_AGENT_HISTORY, CLEAR_CRM_AGENT_HISTORY } from '../../graphql/queries';
import { Send, Bot, User, Sparkles, Loader2, Maximize, Minimize, ExternalLink, RotateCcw } from 'lucide-react';
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

  const [askAgent, { loading }] = useLazyQuery(ASK_CRM_AGENT, {
    fetchPolicy: 'no-cache', // Ensure we always get fresh analysis
    onCompleted: (data) => {
      const response = data?.askCRMAgent;
        
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: response || "عذراً، لم أتمكن من إحضار الرد.",
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `عذراً، حدث خطأ أثناء الاتصال بالنظام: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading || historyLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: userMsg,
      timestamp: new Date()
    }]);
    
    setInput('');
    
    askAgent({ variables: { message: userMsg } });
  };

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
          {loading && (
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
        <div className="max-w-4xl mx-auto relative flex items-end gap-3">
          <div className="relative flex-1 bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
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
            onClick={handleSend}
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
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #334155;
          margin: 1rem 0;
        }
        .markdown-body th, .markdown-body td {
          padding: 12px 16px;
          text-align: right;
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

export default AIAssistantPage;
