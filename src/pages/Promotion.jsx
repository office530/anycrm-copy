import React from "react";
import { motion } from "framer-motion";
import { 
    Sparkles, Zap, Settings, Shield, 
    Brain, Rocket, CheckCircle2, ArrowRight,
    LayoutDashboard, Users, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function PromotionPage() {
    // Force dark theme visual style regardless of system setting
    const darkBg = "bg-slate-950";
    const darkCard = "bg-slate-900/50";
    const darkText = "text-slate-100";
    const darkMuted = "text-slate-400";
    const border = "border-slate-800";

    const features = [
        {
            icon: Brain,
            title: "Smart AI Integration",
            description: "Built-in AI analysis for leads and opportunities. Get instant insights, temperature scoring, and generated scripts without lifting a finger.",
            color: "text-purple-400"
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "No bloat, no lag. A streamlined architecture designed for speed and efficiency. Get in, do your work, and get out.",
            color: "text-yellow-400"
        },
        {
            icon: Settings,
            title: "Fully Adjustable",
            description: "Customize pipelines, tags, and fields to match your exact workflow. This isn't just software; it's a template for your success.",
            color: "text-cyan-400"
        },
        {
            icon: Shield,
            title: "Quality & Thought",
            description: "Crafted with attention to detail. Every interaction is designed to be intuitive, robust, and reliable for professional use.",
            color: "text-emerald-400"
        }
    ];

    return (
        <div className={`min-h-full rounded-3xl ${darkBg} ${darkText} p-6 md:p-12 font-sans selection:bg-cyan-500/30`}>
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto pt-10 pb-20 text-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-8"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>The Future of Simple CRM</span>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500">
                        Powerful. Simple.
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Intelligent.
                    </span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className={`text-xl md:text-2xl ${darkMuted} max-w-3xl mx-auto mb-12 leading-relaxed`}
                >
                    Stop fighting with complex, overpriced software. 
                    Embrace a CRM template that prioritizes <span className="text-white font-semibold">clarity</span>, <span className="text-white font-semibold">speed</span>, and <span className="text-white font-semibold">smart automation</span>.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link to={createPageUrl('Dashboard')}>
                        <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 shadow-lg shadow-cyan-900/20">
                            Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    {/* <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-700 hover:bg-slate-800 text-slate-300">
                        View Demo
                    </Button> */}
                </motion.div>
            </div>

            {/* Visual Preview / Abstract Graphic */}
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="max-w-5xl mx-auto mb-32 relative group"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className={`relative ${darkCard} backdrop-blur-xl border ${border} rounded-xl p-4 md:p-8 overflow-hidden`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
                        {/* Mock UI Elements */}
                        <div className="space-y-4">
                            <div className="h-32 rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400"><LayoutDashboard size={16}/></div>
                                    <div className="h-2 w-20 bg-slate-700 rounded"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-slate-700/50 rounded"></div>
                                    <div className="h-2 w-2/3 bg-slate-700/50 rounded"></div>
                                </div>
                            </div>
                            <div className="h-24 rounded-lg bg-slate-800/50 border border-slate-700/50 p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Users size={20}/></div>
                                <div>
                                    <div className="h-2 w-24 bg-slate-700 rounded mb-2"></div>
                                    <div className="h-2 w-16 bg-slate-700/50 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 h-full min-h-[200px] rounded-lg bg-slate-800/50 border border-slate-700/50 p-6 flex flex-col justify-center items-center text-center">
                            <Brain className="w-16 h-16 text-cyan-500/50 mb-4 animate-pulse" />
                            <h3 className="text-xl font-bold text-slate-200 mb-2">AI-Driven Insights</h3>
                            <p className="text-slate-500 max-w-sm">Automatically analyzing your data to provide actionable intelligence in real-time.</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Features Grid */}
            <div className="max-w-6xl mx-auto mb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={`h-full ${darkCard} border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/10`}>
                                <CardContent className="p-6">
                                    <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                                    <h3 className="text-xl font-bold mb-3 text-slate-200">{feature.title}</h3>
                                    <p className={`${darkMuted} leading-relaxed text-sm`}>
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Why This Template Section */}
            <div className="max-w-4xl mx-auto text-center mb-32">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Why Choose This Template?</h2>
                <div className="space-y-6 text-left">
                    {[
                        "Zero setup time - Start managing leads immediately.",
                        "Cost-effective solution that scales with you.",
                        "Dark mode optimized for reduced eye strain.",
                        "Mobile-ready design for on-the-go access."
                    ].map((item, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-center gap-4 p-4 rounded-xl ${darkCard} border border-slate-800`}
                        >
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                            <span className="text-lg text-slate-300">{item}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CTA Footer */}
            <div className="text-center pb-20">
                <div className="inline-block p-[1px] rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600">
                    <div className={`${darkBg} rounded-2xl p-8 md:p-12`}>
                        <h2 className="text-3xl font-bold mb-6">Ready to simplify your workflow?</h2>
                        <Link to={createPageUrl('Dashboard')}>
                            <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-8">
                                Launch Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}