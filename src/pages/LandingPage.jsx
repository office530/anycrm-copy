import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, BarChart3, Zap, Shield, Users } from 'lucide-react';
import { motion } from "framer-motion";
import { useSettings } from '@/components/context/SettingsContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { updateBranding } = useSettings();

  const handleLogin = () => {
    // סימולציה של התחברות
    localStorage.setItem('crm_is_authenticated', 'true');
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans" dir="rtl">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
           <div className="bg-teal-600 p-1.5 rounded-lg">
             <BarChart3 className="w-6 h-6 text-white" />
           </div>
           <span className="text-xl font-bold text-slate-800 tracking-tight">AgentCRM</span>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" className="hidden md:flex">אודות</Button>
           <Button variant="ghost" className="hidden md:flex">פיצ'רים</Button>
           <Button onClick={handleLogin} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6">
              כניסה למערכת
           </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-8 pt-12 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto text-center relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-3xl -z-10"></div>
         
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto space-y-6"
         >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-100 mb-4">
               <Zap className="w-4 h-4" /> מערכת ה-CRM המתקדמת ליועצי משכנתאות
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
               נהל את העסק שלך <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">בחכמה ובקלות</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
               כל הכלים שיועץ משכנתאות צריך במקום אחד: ניהול לידים, מעקב הזדמנויות, אוטומציות חכמות ודוחות מתקדמים.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <Button onClick={handleLogin} size="lg" className="h-14 px-8 text-lg rounded-full bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20">
                    התחל עכשיו בחינם <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-slate-200">
                    תיאום שיחת הדגמה
                </Button>
            </div>
         </motion.div>

         {/* UI Mockup */}
         <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mt-20 relative mx-auto max-w-5xl"
         >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-2 md:p-4">
               <img 
                 src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2400&q=80" 
                 alt="Dashboard Preview" 
                 className="rounded-xl w-full h-auto object-cover border border-slate-100"
               />
               {/* Floating Elements */}
               <div className="absolute -top-10 -right-10 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce duration-[3000ms]">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle2 /></div>
                  <div>
                     <div className="text-sm font-bold">ליד חדש נקלט!</div>
                     <div className="text-xs text-slate-400">לפני 2 דקות</div>
                  </div>
               </div>
            </div>
         </motion.div>
      </header>

      {/* Features */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-slate-900">למה לבחור ב-AgentCRM?</h2>
               <p className="text-slate-500 mt-4">כל הפיצ'רים שנבנו במיוחד עבור יועצי משכנתאות</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               <FeatureCard 
                  icon={Users} 
                  title="ניהול לידים חכם" 
                  desc="ריכוז כל הלידים במקום אחד, סינון מתקדם, ומעקב אחרי סטטוס טיפול בזמן אמת."
               />
               <FeatureCard 
                  icon={BarChart3} 
                  title="דוחות וניתוחים" 
                  desc="קבל תמונה מלאה על העסק שלך עם דשבורדים ויזואליים ונתוני המרה מדויקים."
               />
               <FeatureCard 
                  icon={Shield} 
                  title="אבטחת מידע" 
                  desc="המידע שלך ושל הלקוחות שלך מאובטח ברמה הגבוהה ביותר עם גיבויים אוטומטיים."
               />
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="bg-teal-600/20 p-1.5 rounded-lg">
                 <BarChart3 className="w-5 h-5 text-teal-500" />
               </div>
               <span className="text-lg font-bold text-slate-200">AgentCRM</span>
            </div>
            <div className="text-sm">
               © 2025 כל הזכויות שמורות. נבנה באמצעות Base44.
            </div>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
   return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
         <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-6">
            <Icon className="w-6 h-6" />
         </div>
         <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
         <p className="text-slate-500 leading-relaxed">
            {desc}
         </p>
      </div>
   );
}