
import React from 'react';
import { BookOpen, Zap, Rocket, Code2, ShieldCheck, Globe } from 'lucide-react';

const ApiDocsView: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="relative">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 relative z-10 animate-bounce">
          <BookOpen className="w-12 h-12" />
        </div>
        <div className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-2xl opacity-20 animate-pulse"></div>
      </div>

      <div className="space-y-4 max-w-xl">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">وثائق الـ API <span className="text-indigo-600">قريباً جداً</span></h2>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">
          نحن نعمل حالياً على بناء واجهة برمجية متطورة تسمح لك بربط نظامك الخاص مع داش آي بشكل آلي وسلس. ستتمكن قريباً من إرسال الطلبات، تتبعها، وإدارة المخزون عبر الكود.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-8">
        {[
          { icon: Code2, label: 'توثيق RESTful', desc: 'معايير برمجية عالمية' },
          { icon: ShieldCheck, label: 'أمان عالي', desc: 'تشفير API Keys' },
          { icon: Rocket, label: 'سرعة المزامنة', desc: 'Webhooks فورية' }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto text-indigo-600">
              <feat.icon className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{feat.label}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{feat.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
        <Globe className="w-4 h-4 text-indigo-600" />
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">انتظرونا في التحديث القادم</span>
      </div>
    </div>
  );
};

export default ApiDocsView;
