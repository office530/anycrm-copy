import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Settings, Shield, ChevronRight, CheckCircle2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PromotionPage() {
  // Hardcoded dark theme styles
  const bgMain = "bg-slate-950";
  const textMain = "text-slate-50";
  const textMuted = "text-slate-400";
  const accentGradient = "bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent";
  const cardBg = "bg-slate-900/50 border border-slate-800 backdrop-blur-sm";

  const features = [
    {
      icon: Sparkles,
      title: "Smart AI Core",
      desc: "Built-in intelligence that scores leads, suggests actions, and generates sales scripts automatically. Let the CRM think for you.",
      color: "text-purple-400"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "No bloat, no loading screens. A streamlined interface designed for speed and efficiency in every interaction.",
      color: "text-yellow-400"
    },
    {
      icon: Settings,
      title: "Fully Adjustable",
      desc: "Customize pipelines, fields, and tags to fit your exact workflow. Rigid systems are a thing of the past.",
      color: "text-cyan-400"
    },
    {
      icon: Shield,
      title: "Quality & Simplicity",
      desc: "Professional grade security and reliability without the enterprise complexity. Simple enough for anyone, powerful enough for pros.",
      color: "text-emerald-400"
    }
  ];

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} font-sans selection:bg-cyan-500/30 overflow-x-hidden`} dir="ltr">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent blur-3xl -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -z-10 animate-pulse" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold tracking-wider uppercase mb-6 text-cyan-400">
              The Future of Simple CRM
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Keep it Simple.<br />
              <span className={accentGradient}>Make it Smart.</span>
            </h1>
            <p className={`text-xl md:text-2xl ${textMuted} max-w-2xl mx-auto mb-10 leading-relaxed`}>
              A template designed for professionals who value quality and thought over complexity. 
              Smart AI, intuitive design, and zero clutter.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg h-14 px-8 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                Get Started Now <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-14 px-8 rounded-full">
                View Live Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`${cardBg} p-8 rounded-3xl hover:bg-slate-800/80 transition-all duration-300 group`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className={`${textMuted} leading-relaxed`}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 px-6 relative bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
             <h2 className="text-4xl font-bold">
               Why choose this <span className="text-cyan-400">Template?</span>
             </h2>
             <div className="space-y-4">
               {[
                 "Thoughtfully designed for real sales workflows",
                 "Cheap to maintain, premium in quality",
                 "Dark mode native interface for focus",
                 "Instant setup - no implementation teams needed"
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <CheckCircle2 className="w-6 h-6 text-purple-500 shrink-0" />
                   <span className="text-lg text-slate-300">{item}</span>
                 </div>
               ))}
             </div>
          </div>
          <div className="flex-1 relative">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 blur-3xl opacity-20 rounded-full" />
             <div className="relative bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-6">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">AI Analysis</div>
                    <div className="text-sm text-slate-400">Lead Score: 98/100</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-3/4 bg-slate-800 rounded-full" />
                  <div className="h-2 w-full bg-slate-800 rounded-full" />
                  <div className="h-2 w-5/6 bg-slate-800 rounded-full" />
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                   <div className="text-sm text-slate-500">Status</div>
                   <div className="text-sm font-bold text-emerald-400">Sales Ready</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Ready to upgrade your workflow?</h2>
          <p className="text-xl text-slate-400 mb-10">
            Join the professionals who choose simplicity and intelligence over clutter.
          </p>
          <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-200 font-bold text-lg h-14 px-10 rounded-full transition-all hover:scale-105">
            Get the Template
          </Button>
          <p className="mt-8 text-sm text-slate-500">
            © 2024 Base44 Templates. Crafted with thought.
          </p>
        </div>
      </footer>

    </div>
  );
}