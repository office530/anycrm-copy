import React, { useState, useEffect, useRef } from 'react';
import { 
    ArrowLeft, MoreHorizontal, Sparkles, Zap, 
    MessageSquare, User, Send, X, ChevronDown,
    Bold, Italic, List, Link as LinkIcon, AlertTriangle,
    CheckCircle2, AlertCircle, Info, Split
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useSettings } from '@/components/context/SettingsContext';

// Custom Toolbar for Quill
const CustomToolbar = ({ theme }) => (
    <div id="toolbar" className={`flex items-center gap-1 border-b p-2 mb-2 sticky top-0 backdrop-blur z-10 ${theme === 'dark' ? 'border-slate-700/50 bg-slate-900/95' : 'border-slate-200 bg-white/95'}`}>
        <button className={`ql-bold p-2 rounded transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
            <Bold className="w-4 h-4" />
        </button>
        <button className={`ql-italic p-2 rounded transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
            <Italic className="w-4 h-4" />
        </button>
        <div className={`w-px h-4 mx-2 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <button className="ql-list" value="bullet">
            <List className="w-4 h-4" />
        </button>
        <button className="ql-link">
            <LinkIcon className="w-4 h-4" />
        </button>
    </div>
);

const MOCK_PERSONAS = [
    { id: '1', name: "Steve - Skeptical CTO", job: "CTO", disc: "Dominant", style: { likes: ["brevity", "data"], dislikes: ["fluff", "buzzwords"] } },
    { id: '2', name: "Linda - Relationship VP", job: "VP Sales", disc: "Influential", style: { likes: ["stories", "connection"], dislikes: ["cold facts", "pressure"] } },
    { id: '3', name: "Gary - Budget Hawk CFO", job: "CFO", disc: "Conscientious", style: { likes: ["ROI", "security"], dislikes: ["risk", "ambiguity"] } },
];

export default function SmartEmailEditor() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('id');
    const { theme } = useSettings();
    
    // State
    const [templateName, setTemplateName] = useState("New Campaign Template");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [resonanceScore, setResonanceScore] = useState(0);
    const [isLabMode, setIsLabMode] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState(MOCK_PERSONAS[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: "system", text: "Simulation started. I am modeling Steve's responses based on his DISC profile." }
    ]);
    const [isSimulating, setIsSimulating] = useState(false);

    const quillRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (templateId) {
            base44.entities.MarketingTemplate.read({ id: templateId }).then(res => {
                if (res && res[0]) {
                    setTemplateName(res[0].name);
                    setSubject(res[0].subject_line || "");
                    setContent(res[0].body_content || "");
                    setResonanceScore(res[0].ai_resonance_score || 0);
                }
            });
        }
    }, [templateId]);

    // Live Resonance Calc
    useEffect(() => {
        const calculateResonance = (text) => {
            if (!text || text.length < 10) return 0;
            const base = 50;
            const randomVar = Math.floor(Math.random() * 40) - 20; 
            const hasBuzzword = text.toLowerCase().includes('synergy');
            const penalty = hasBuzzword ? 15 : 0;
            return Math.min(100, Math.max(0, base + randomVar - penalty));
        };
        
        const timer = setTimeout(() => {
            setResonanceScore(calculateResonance(content));
        }, 500);

        return () => clearTimeout(timer);
    }, [content]);

    const handleAutoTune = async () => {
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 1500));
        
        setContent(`Hi {{FirstName}},<br/><br/>I reviewed your Q3 goals and believe we can help you reduce churn by 12%.<br/><br/>Do you have 10 mins this Tuesday?`);
        setResonanceScore(92);
        toast.success("Content optimized for higher resonance!");
        setIsGenerating(false);
    };

    const handleSimulateReply = async () => {
        setIsSimulating(true);
        await new Promise(r => setTimeout(r, 1200));
        
        const persona = MOCK_PERSONAS.find(p => p.id === selectedPersona);
        let reply = "I would delete this. You didn't mention pricing upfront.";
        
        if (persona.name.includes("Linda")) {
            reply = "A bit too abrupt for me. Ask about my team first?";
        } else if (persona.name.includes("Gary")) {
            reply = "What's the ROI? This feels like fluff.";
        }

        setChatHistory(prev => [...prev, { role: "twin", text: reply }]);
        setIsSimulating(false);
    };

    const getScoreColor = (score) => {
        if (score < 40) return { dot: "bg-red-500", text: "text-red-500", label: "High Spam Risk", badge: theme === 'dark' ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200" };
        if (score < 70) return { dot: "bg-amber-500", text: "text-amber-500", label: "Generic", badge: theme === 'dark' ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200" };
        return { dot: "bg-emerald-500", text: "text-emerald-500", label: "High Resonance", badge: theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200" };
    };

    const scoreMeta = getScoreColor(resonanceScore);

    // Theme Classes
    const bgBase = theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50';
    const bgHeader = theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200';
    const textMain = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
    const textSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
    const inputBg = theme === 'dark' ? 'bg-transparent text-white' : 'bg-transparent text-slate-900';
    const editorBg = theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm';
    const sidePanelBg = theme === 'dark' ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-slate-200';
    const chatUserBg = theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700';
    const chatTwinBg = theme === 'dark' ? 'bg-blue-900/20 text-blue-200 border-blue-800/30' : 'bg-blue-50 text-blue-800 border-blue-100';

    return (
        <div className={`flex flex-col h-screen overflow-hidden ${bgBase} ${textMain}`}>
            {/* A. Header */}
            <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 z-20 transition-colors ${bgHeader}`}>
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className={theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Input 
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className={`border-none text-xl font-bold placeholder:text-slate-400 focus-visible:ring-0 px-0 w-96 h-auto ${inputBg}`}
                        placeholder="Template Name..."
                    />
                </div>

                <div className="flex items-center gap-6">
                    {/* Traffic Light Badge */}
                    <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all duration-500 ${scoreMeta.badge}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${scoreMeta.dot} animate-pulse`} />
                        <span className={`text-sm font-medium ${scoreMeta.text}`}>{scoreMeta.label} ({resonanceScore})</span>
                    </div>

                    {/* Magic Wand */}
                    <Button 
                        onClick={handleAutoTune}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-md shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        {isGenerating ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isGenerating ? 'Optimizing...' : 'Auto-Tune'}
                    </Button>

                    <div className={`h-6 w-px mx-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />

                    {/* Lab Mode Toggle */}
                    <div className="flex items-center gap-3">
                        <Label htmlFor="lab-mode" className={`cursor-pointer font-medium flex items-center gap-2 ${isLabMode ? 'text-blue-500' : textSub}`}>
                            <Split className="w-4 h-4" /> Lab Mode
                        </Label>
                        <Switch 
                            id="lab-mode" 
                            checked={isLabMode} 
                            onCheckedChange={setIsLabMode}
                            className="data-[state=checked]:bg-blue-600"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* B. Main Editor */}
                <main className={`flex-1 flex flex-col transition-all duration-500 relative ${isLabMode ? 'w-[70%]' : 'w-full'}`}>
                    <div className="flex-1 max-w-4xl mx-auto w-full p-8 flex flex-col">
                        <div className="mb-6 space-y-4">
                            <Input 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject Line..."
                                className={`bg-transparent border-b rounded-none px-0 text-2xl font-light placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-blue-500 transition-colors h-14 ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-900'}`}
                            />
                        </div>

                        <div className={`flex-1 rounded-xl border backdrop-blur-sm overflow-hidden flex flex-col ${editorBg}`}>
                            <CustomToolbar theme={theme} />
                            <ReactQuill 
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                ref={quillRef}
                                modules={{
                                    toolbar: {
                                        container: "#toolbar"
                                    }
                                }}
                                className={`flex-1 flex flex-col bg-transparent ${theme === 'dark' ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
                                placeholder="Start writing your masterpiece..."
                            />
                            
                            {/* "Synergy" Warning Overlay */}
                            {content.toLowerCase().includes('synergy') && (
                                <div className={`absolute bottom-4 left-4 right-4 p-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 border ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    <p className="text-sm">
                                        <span className="font-bold underline decoration-amber-500 decoration-wavy">synergy</span> detected. 
                                        <span className="opacity-75 ml-1">AI Hint: This word is considered a buzzword. Try 'collaboration' instead.</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* C. Lab Mode Panel */}
                <aside className={`border-l transition-all duration-500 ease-in-out flex flex-col ${sidePanelBg} ${isLabMode ? 'w-[30%] translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>
                    <div className={`p-6 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <h2 className={`font-bold ${textMain}`}>Psychographic Simulation</h2>
                        </div>
                        <p className={`text-xs ${textSub}`}>Test how your content resonates with different personalities.</p>
                    </div>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Section 1: Persona */}
                        <div className="space-y-3">
                            <Label className={`text-xs uppercase font-bold tracking-wider ${textSub}`}>Target Persona</Label>
                            <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                                <SelectTrigger className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                                    {MOCK_PERSONAS.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {/* Persona Details Card */}
                            {selectedPersona && (
                                <div className={`rounded-lg p-3 text-xs space-y-2 border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between">
                                        <span className={textSub}>DISC:</span>
                                        <span className="text-blue-500 font-medium">{MOCK_PERSONAS.find(p => p.id === selectedPersona).disc}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <span className="text-emerald-500 block mb-1">Likes</span>
                                            <div className="flex flex-wrap gap-1">
                                                {MOCK_PERSONAS.find(p => p.id === selectedPersona).style.likes.map(l => (
                                                    <span key={l} className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>{l}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-red-400 block mb-1">Dislikes</span>
                                            <div className="flex flex-wrap gap-1">
                                                {MOCK_PERSONAS.find(p => p.id === selectedPersona).style.dislikes.map(l => (
                                                    <span key={l} className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'}`}>{l}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Chat Window */}
                        <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden min-h-[300px] ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`p-3 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                                <span className={`text-xs font-bold ${textSub}`}>Live Simulation</span>
                                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500 bg-blue-500/5">Digital Twin Active</Badge>
                            </div>
                            
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'twin' ? '' : 'flex-row-reverse'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'twin' ? 'bg-blue-600' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')}`}>
                                            {msg.role === 'twin' ? <User className="w-4 h-4 text-white" /> : <Zap className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} />}
                                        </div>
                                        <div className={`rounded-lg p-3 text-sm max-w-[85%] border ${msg.role === 'twin' ? chatTwinBg : chatUserBg}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isSimulating && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 animate-pulse">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div className={`rounded-lg p-3 text-sm italic ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`p-3 border-t ${theme === 'dark' ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
                                <Button 
                                    className={`w-full ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                    onClick={handleSimulateReply}
                                    disabled={isSimulating || !content}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Simulate Reply
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
            
            <style>{`
                .ql-container.ql-snow { border: none !important; }
                .ql-editor { font-size: 1.125rem; line-height: 1.75; min-height: 300px; }
                .ql-editor.ql-blank::before { color: ${theme === 'dark' ? '#94a3b8' : '#cbd5e1'}; font-style: normal; }
            `}</style>
        </div>
    );
}