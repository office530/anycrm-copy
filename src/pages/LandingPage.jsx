import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Database, Smartphone, Zap, Shield, Layout, DollarSign, ChevronRight, Star } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
               <Database className="w-6 h-6 text-white" />
             </div>
             <span className="font-bold text-xl tracking-tight text-white">Base44<span className="text-cyan-400">CRM</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#visuals" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preview</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <Button className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-full px-6">
              Get Lifetime Access
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-32 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-cyan-500/50 text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full text-sm backdrop-blur-sm">
              <Star className="w-3 h-3 mr-2 fill-cyan-400" />
              v2.0 Now Available
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              The CRM You Own.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                The Monthly Fees You Don't.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade aesthetics meet self-hosted freedom. 
              Integrated AI, full source code ownership, and zero recurring costs. 
              <span className="text-slate-200 font-semibold block mt-2">Stop renting your own data.</span>
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" className="w-full md:w-auto h-14 px-8 text-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                Get Lifetime Access <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full md:w-auto h-14 px-8 text-lg border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full">
                View Live Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Image Placeholder */}
          <motion.div 
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.7, delay: 0.2 }}
             className="relative mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden aspect-[16/9] group"
          >
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center">
                   <Layout className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                   <p className="text-slate-500 font-medium">Desktop Dashboard Screenshot</p>
                   <p className="text-slate-600 text-sm mt-2">Place your high-res dashboard image here</p>
                </div>
             </div>
             {/* Gradient overlay for depth */}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <div className="border-y border-slate-800 bg-slate-900/30 py-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by high-growth independent builders</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos placeholders */}
            <div className="flex items-center gap-2 text-xl font-bold text-white"><Shield className="w-6 h-6" /> SecureScale</div>
            <div className="flex items-center gap-2 text-xl font-bold text-white"><Zap className="w-6 h-6" /> FastFlow</div>
            <div className="flex items-center gap-2 text-xl font-bold text-white"><Database className="w-6 h-6" /> DataOwn</div>
            <div className="flex items-center gap-2 text-xl font-bold text-white"><Layout className="w-6 h-6" /> ModernUi</div>
          </div>
        </div>
      </div>

      {/* Visual Proof Section */}
      <section id="visuals" className="py-24 px-6 relative">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">See how real control feels.</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">Designed for clarity. Built for speed. Engineered to help you close.</p>
            </div>

            {/* Feature 1: Desktop */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
               <div className="order-2 md:order-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4 border border-blue-500/20">
                     <Layout className="w-4 h-4" /> Command Center
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Executive Clarity.</h3>
                  <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                     Your entire business health, visualized in sleek dark mode. 
                     Track revenue, monitor pipeline velocity, and spot bottlenecks instantly. 
                     No clutter, no "admin" fluff—just the metrics that move the needle.
                  </p>
                  <ul className="space-y-3 mb-8">
                     <li className="flex items-start gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span>Real-time revenue visualization</span>
                     </li>
                     <li className="flex items-start gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span>Drag-and-drop Kanban boards</span>
                     </li>
                     <li className="flex items-start gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span>Customizable widget grid</span>
                     </li>
                  </ul>
               </div>
               <div className="order-1 md:order-2 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden aspect-square md:aspect-[4/3] flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                  <div className="text-center p-8">
                     <Layout className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                     <p className="text-slate-500">Desktop Dashboard Detail</p>
                  </div>
               </div>
            </div>

            {/* Feature 2: Mobile */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden aspect-[9/19] max-w-[320px] mx-auto flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-slate-900" />
                   <div className="text-center p-8 relative z-10">
                     <Smartphone className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                     <p className="text-slate-500">Mobile Pipeline View</p>
                  </div>
                  {/* Phone Bezel Effect */}
                  <div className="absolute inset-0 border-[8px] border-slate-800 rounded-3xl pointer-events-none" />
               </div>
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4 border border-purple-500/20">
                     <Smartphone className="w-4 h-4" /> Mobile Native
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Close deals from the coffee shop.</h3>
                  <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                     A mobile pipeline that actually works. Swipe, tap, sold.
                     We didn't just shrink the desktop site; we built a dedicated mobile experience
                     so you never miss a lead while you're on the move.
                  </p>
                   <ul className="space-y-3 mb-8">
                     <li className="flex items-start gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                        <span>One-thumb navigation</span>
                     </li>
                     <li className="flex items-start gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                        <span>Quick-add leads via speed dial</span>
                     </li>
                     <li className="flex items-start gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                        <span>Click-to-call & WhatsApp integration</span>
                     </li>
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* Why It's Smarter */}
      <section id="features" className="py-24 bg-slate-900/50 border-y border-slate-800">
         <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Smart Founders Choose Ownership</h2>
               <p className="text-slate-400 text-lg">The SaaS model is broken for small business. We fixed it.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* Card 1 */}
               <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-cyan-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-cyan-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                     <DollarSign className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Keep Your Cash</h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                     Salesforce wants $150/user/month. We want a one-time lunch money payment. 
                     <span className="text-cyan-400 block mt-2 font-medium">You do the math.</span>
                  </p>
               </div>

               {/* Card 2 */}
               <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-purple-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                     <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">AI Native, Not Add-on</h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                     Don't just store data. Talk to it. Built-in AI analyzes lead quality, writes emails, 
                     and suggests next steps automatically.
                  </p>
               </div>

               {/* Card 3 */}
               <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                     <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Total Sovereignty</h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                     Your server. Your database. Your code. No platform lock-in. 
                     No surprise price hikes. You own the asset.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Who Is This For? */}
      <section className="py-24 px-6 border-t border-slate-800 bg-slate-950">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who is Base44 for?</h2>
               <p className="text-slate-400 text-lg">Built for the independent economy.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
               {/* Freelancers */}
               <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Layout className="w-5 h-5" /></div>
                     <h3 className="text-lg font-bold text-white">Freelancers</h3>
                  </div>
                  <ul className="space-y-2">
                     <li className="text-slate-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Stop paying $50/mo for basic CRMs</li>
                     <li className="text-slate-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Manage multiple gigs in one place</li>
                  </ul>
               </div>

               {/* Agency Owners */}
               <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Database className="w-5 h-5" /></div>
                     <h3 className="text-lg font-bold text-white">Agency Owners</h3>
                  </div>
                  <ul className="space-y-2">
                     <li className="text-slate-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> White-label the code for clients</li>
                     <li className="text-slate-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> Customize pipelines for any niche</li>
                  </ul>
               </div>

               {/* Consultants */}
               <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Zap className="w-5 h-5" /></div>
                     <h3 className="text-lg font-bold text-white">Consultants</h3>
                  </div>
                  <ul className="space-y-2">
                     <li className="text-slate-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Track high-ticket deals securely</li>
                     <li className="text-slate-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Automate follow-ups with AI</li>
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
         <div className="container mx-auto max-w-4xl">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
               {/* Glow effect */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyan-500/10 blur-[80px] pointer-events-none" />
               
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">One Payment. Forever Access.</h2>
                  <p className="text-slate-400 text-lg mb-8">Includes all future updates, mobile app code, and AI integrations.</p>
                  
                  <div className="flex items-baseline justify-center gap-2 mb-8">
                     <span className="text-2xl text-slate-500 line-through">$499</span>
                     <span className="text-6xl md:text-7xl font-extrabold text-white">$199</span>
                     <span className="text-xl text-cyan-400 font-bold">USD</span>
                  </div>

                  <ul className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Full Source Code (React/Node)</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Unlimited Users & Leads</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Self-Hosted Guide Included</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Lifetime Updates</li>
                  </ul>

                  <Button size="lg" className="w-full md:w-auto px-12 h-16 text-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-transform hover:scale-105">
                     Secure Your Copy Now
                  </Button>
                  <p className="mt-6 text-sm text-slate-500">
                     Instant digital download. 30-day money-back guarantee.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950 text-slate-500 text-sm">
         <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <Database className="w-5 h-5 text-slate-600" />
               <span className="font-bold text-slate-300">Base44<span className="text-cyan-500">CRM</span></span>
            </div>
            <div className="flex gap-8">
               <a href="#" className="hover:text-white transition-colors">Documentation</a>
               <a href="#" className="hover:text-white transition-colors">Support</a>
               <a href="#" className="hover:text-white transition-colors">License</a>
            </div>
            <p>© 2024 Base44 Inc. All rights reserved.</p>
         </div>
      </footer>

    </div>
  );
}