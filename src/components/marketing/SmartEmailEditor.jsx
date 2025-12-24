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
    <div id="toolbar" className={`flex items-center gap-1 border-b px-4 py-3 sticky top-0 backdrop-blur-md z-10 transition-colors ${theme === 'dark' ? 'border-slate-700/50 bg-[#0f172a]/80' : 'border-slate-100 bg-white/80'}`}>
        <div className={`flex items-center gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-100/50 border border-slate-200/50'}`}>
            <button className={`ql-bold p-1.5 rounded-md transition-all ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'}`}>
                <Bold className="w-4 h-4" />
            </button>
            <button className={`ql-italic p-1.5 rounded-md transition-all ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'}`}>
                <Italic className="w-4 h-4" />
            </button>
        </div>
        
        <div className={`w-px h-5 mx-2 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
        
        <div className={`flex items-center gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-100/50 border border-slate-200/50'}`}>
            <button className="ql-list" value="bullet">
                <List className="w-4 h-4" />
            </button>
            <button className="ql-link">
                <LinkIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const MOCK_TEMPLATES = [
  {
    "id": "t_001",
    "name": "Enterprise Value Prop (Optimized)",
    "subject_line": "Reducing your cloud spend by 12% in Q4",
    "body_content": "Hi {{First_Name}},<br/><br/>I noticed {{Company_Name}} is expanding its infrastructure. Most CTOs I speak with are struggling to balance scaling costs with performance.<br/><br/>We helped Acme Corp cut AWS spend by 12% in under 30 days without downtime.<br/><br/>Are you open to a 10-minute technical review next Tuesday?",
    "ai_resonance_score": 92,
    "status_color": "green", 
    "tone_analysis": "Professional, Data-Driven",
    "spam_triggers": []
  },
  {
    "id": "t_002",
    "name": "Generic Follow Up (Needs Work)",
    "subject_line": "Just checking in...",
    "body_content": "Hi {{First_Name}},<br/><br/>I am just bumping this to the top of your inbox.<br/><br/>Did you see my last email? I would love to hop on a quick call and see if there are any synergies we can explore.<br/><br/>Best,<br/>[My Name]",
    "ai_resonance_score": 35,
    "status_color": "red",
    "tone_analysis": "Passive, Generic",
    "spam_triggers": [
      { "word": "synergies", "suggestion": "collaboration opportunities" },
      { "word": "bumping", "suggestion": "following up on" }
    ]
  },
  {
    "id": "t_003",
    "name": "Intro - SaaS Founders",
    "subject_line": "Question about your sales process",
    "body_content": "Hey {{First_Name}},<br/><br/>Saw you guys are growing fast. Congrats!<br/><br/>I wanted to reach out and see if you need help with your CRM. We have a great tool that is super cheap and easy to use.<br/><br/>Let me know?",
    "ai_resonance_score": 55,
    "status_color": "yellow",
    "tone_analysis": "Too Casual, Vague",
    "spam_triggers": [
      { "word": "cheap", "suggestion": "cost-effective" }
    ]
  }
];

const MOCK_PERSONAS = [
  {
    "id": "p_001",
    "name": "Steve - The Skeptical CTO",
    "role": "Chief Technology Officer",
    "company_type": "Series B Fintech",
    "disc_profile": "High Dominance (D)",
    "avatar_initials": "ST",
    "ai_simulation_prompt": "You are a busy CTO. You hate sales fluff. If the email doesn't mention security, compliance, or hard ROI numbers immediately, you delete it. You are rude but honest.",
    "recent_activity": "Posted on LinkedIn about 'SOC2 Compliance Nightmares'"
  },
  {
    "id": "p_002",
    "name": "Sarah - The Visionary VP",
    "role": "VP of Marketing",
    "company_type": "Consumer Brand",
    "disc_profile": "High Influence (I)",
    "avatar_initials": "SA",
    "ai_simulation_prompt": "You are a creative VP. You love emails that feel personal, use emojis, and talk about 'brand values' and 'storytelling'. You dislike cold, robotic data lists.",
    "recent_activity": "Shared an article about 'The Future of Community'"
  }
];

const MOCK_CHAT_HISTORY = [
  {
    "sender": "user",
    "text": "Simulating reply for: 'Generic Follow Up' template...",
    "timestamp": "10:00 AM"
  },
  {
    "sender": "ai_persona",
    "persona_name": "Steve (CTO)",
    "text": "I'm deleting this immediately. 'Just checking in' adds zero value to my day. Also, you used the word 'synergies' - that's a red flag that you don't understand my technical problems. Don't email me again unless you have a specific ROI calculation.",
    "sentiment": "negative",
    "timestamp": "10:00 AM"
  }
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
    const [personaSource, setPersonaSource] = useState('preset'); // 'preset' | 'crm'
    const [selectedCrmId, setSelectedCrmId] = useState("");
    const [crmType, setCrmType] = useState("lead"); // 'lead' | 'opportunity'
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: "system", text: "Simulation ready." }
    ]);
    const [isSimulating, setIsSimulating] = useState(false);

    const quillRef = useRef(null);

    // Fetch CRM Data
    const { data: leads = [] } = useQuery({ 
        queryKey: ['leads'], 
        queryFn: () => base44.entities.Lead.list(),
        enabled: personaSource === 'crm'
    });
    
    const { data: opportunities = [] } = useQuery({ 
        queryKey: ['opportunities'], 
        queryFn: () => base44.entities.Opportunity.list(),
        enabled: personaSource === 'crm'
    });

    // Derived Current Persona
    const currentPersona = React.useMemo(() => {
        if (personaSource === 'preset') {
            return MOCK_PERSONAS.find(p => p.id === selectedPersona);
        }
        
        if (personaSource === 'crm' && selectedCrmId) {
            let data = null;
            let prompt = "";
            let role = "";
            
            if (crmType === 'lead') {
                data = leads.find(l => l.id === selectedCrmId);
                if (data) {
                    role = data.lead_status || "Prospect";
                    prompt = `You are ${data.full_name}, a ${data.lead_temperature} lead in the ${data.lead_status} stage. Your background: ${data.notes || 'No notes'}. AI Analysis: ${data.ai_analysis || 'None'}. React to this email based on your history.`;
                }
            } else {
                data = opportunities.find(o => o.id === selectedCrmId);
                if (data) {
                    role = `Deal: ${data.product_type} ($${data.amount})`;
                    prompt = `You are a prospect with an active deal for ${data.product_type} worth $${data.amount}. Stage: ${data.deal_stage}. Main pain point: ${data.main_pain_point}. Objection: ${data.current_objection}. Strategy: ${data.ai_sales_strategy}. React accordingly.`;
                }
            }

            if (data) {
                return {
                    id: data.id,
                    name: data.full_name || data.lead_name || "Unknown Contact",
                    role: role,
                    disc_profile: data.ai_classification || "Unknown",
                    avatar_initials: (data.full_name || data.lead_name || "??").substring(0,2).toUpperCase(),
                    ai_simulation_prompt: prompt,
                    // Synthesize style from data for UI
                    style: { likes: [], dislikes: [] } 
                };
            }
        }
        return null;
    }, [personaSource, selectedPersona, selectedCrmId, crmType, leads, opportunities]);


    // Initial Load
    useEffect(() => {
        if (templateId) {
            // Check Mocks first
            const mock = MOCK_TEMPLATES.find(t => t.id === templateId);
            if (mock) {
                setTemplateName(mock.name);
                setSubject(mock.subject_line);
                setContent(mock.body_content);
                setResonanceScore(mock.ai_resonance_score);
            } else {
                // Fallback to DB
                base44.entities.MarketingTemplate.read({ id: templateId }).then(res => {
                    if (res && res[0]) {
                        setTemplateName(res[0].name);
                        setSubject(res[0].subject_line || "");
                        setContent(res[0].body_content || "");
                        setResonanceScore(res[0].ai_resonance_score || 0);
                    }
                });
            }
        }
    }, [templateId]);

    // Live Resonance Calc
    useEffect(() => {
        // Only calc if not one of the static mocks to preserve their specific scores for demo
        const isMock = MOCK_TEMPLATES.find(t => t.id === templateId && t.body_content === content);
        if (isMock) return;

        const calculateResonance = (text) => {
            if (!text || text.length < 10) return 0;
            const base = 50;
            const randomVar = Math.floor(Math.random() * 40) - 20; 
            const hasBuzzword = text.toLowerCase().includes('synergy') || text.toLowerCase().includes('bumping');
            const penalty = hasBuzzword ? 15 : 0;
            return Math.min(100, Math.max(0, base + randomVar - penalty));
        };
        
        const timer = setTimeout(() => {
            setResonanceScore(calculateResonance(content));
        }, 500);

        return () => clearTimeout(timer);
    }, [content, templateId]);

    const handleAutoTune = async () => {
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 1500));
        
        // Demo Logic: If on the bad template (t_002), swap to good one (t_001)
        if (templateId === 't_002') {
            const goodTemplate = MOCK_TEMPLATES.find(t => t.id === 't_001');
            setContent(goodTemplate.body_content);
            setSubject(goodTemplate.subject_line);
            setResonanceScore(goodTemplate.ai_resonance_score);
            toast.success("✨ Optimization complete! Spam triggers removed.");
        } else {
            // Generic fallback
            setContent(`Hi {{FirstName}},<br/><br/>I reviewed your Q3 goals and believe we can help you reduce churn by 12%.<br/><br/>Do you have 10 mins this Tuesday?`);
            setResonanceScore(92);
            toast.success("Content optimized for higher resonance!");
        }
        setIsGenerating(false);
    };

    const handleSimulateReply = async () => {
        setIsSimulating(true);
        const persona = currentPersona;
        if (!persona) return;

        await new Promise(r => setTimeout(r, 1500));
        
        // Dynamic Simulation Logic
        let reply = "";
        
        if (personaSource === 'crm') {
            // Simulate AI generating response based on real CRM data
            const isHot = persona.disc_profile === 'Hot' || persona.ai_simulation_prompt.includes('Hot');
            const hasObjection = persona.ai_simulation_prompt.includes('Objection');
            
            if (isHot) {
                reply = "Thanks for reaching out. This actually aligns with what we were discussing internally. Do you have time for a quick call?";
            } else if (hasObjection) {
                reply = "I'm hesitant. As I mentioned before, our main concern is " + (crmType === 'opportunity' ? "budget and timeline" : "implementation time") + ". Does this email address that?";
            } else {
                reply = `[Auto-Generated based on ${crmType} profile]: "This is interesting, but I'm swamped. Can you send me a one-pager instead of a call?"`;
            }
        } else {
            // Existing Mock Logic
            if (persona.id === 'p_001') {
                const mockReply = MOCK_CHAT_HISTORY.find(m => m.sender === 'ai_persona');
                reply = mockReply.text;
                // Add system message only for the scripted demo
                setChatHistory(prev => [...prev, { role: "system", text: MOCK_CHAT_HISTORY[0].text }]);
            } else {
                reply = "I would delete this. You didn't mention pricing upfront.";
                if (persona.name?.includes("Sarah")) {
                    reply = "This feels a bit dry. Can you tell me a story about how you helped others?";
                }
            }
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
                    <div className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-10 flex flex-col h-full">
                        {/* Integrated Editor Container */}
                        <div className={`flex-1 rounded-2xl border shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-[#1e293b]/50 border-slate-700/50 shadow-black/20' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                            
                            {/* Subject Line Area */}
                            <div className={`px-8 pt-8 pb-4 border-b ${theme === 'dark' ? 'border-slate-700/30' : 'border-slate-100'}`}>
                                <div className="relative">
                                    <Input 
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className={`bg-transparent border-none px-0 text-2xl font-semibold placeholder:text-transparent focus-visible:ring-0 h-auto p-0 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                                    />
                                    {!subject && (
                                        <span className={`absolute left-0 top-0 text-2xl font-light pointer-events-none transition-opacity ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
                                            Type your subject here...
                                        </span>
                                    )}
                                </div>
                            </div>

                            <CustomToolbar theme={theme} />
                            
                            <div className="flex-1 relative flex flex-col min-h-0">
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
                                    className={`flex-1 flex flex-col bg-transparent overflow-y-auto ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
                                    placeholder="Start writing..."
                                />
                                
                                {/* "Synergy" Warning Overlay */}
                                {content.toLowerCase().includes('synergy') && (
                                    <div className={`absolute bottom-6 left-6 right-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 border backdrop-blur-md shadow-lg ${theme === 'dark' ? 'bg-amber-950/40 border-amber-500/20 text-amber-200' : 'bg-amber-50/90 border-amber-200 text-amber-800'}`}>
                                        <div className="p-2 bg-amber-500/10 rounded-full">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Buzzword Detected</p>
                                            <p className="text-sm opacity-90">
                                                <span className="font-bold underline decoration-amber-500 decoration-wavy">synergy</span> is often ignored. Try <span className="font-semibold text-emerald-500 bg-emerald-500/10 px-1 rounded">collaboration</span> instead.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                            
                            {/* Source Toggle */}
                            <div className={`p-1 rounded-lg flex mb-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <button 
                                    onClick={() => setPersonaSource('preset')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${personaSource === 'preset' ? (theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow') : 'text-slate-500'}`}
                                >
                                    Presets
                                </button>
                                <button 
                                    onClick={() => setPersonaSource('crm')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${personaSource === 'crm' ? (theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow') : 'text-slate-500'}`}
                                >
                                    From CRM
                                </button>
                            </div>

                            {/* Preset Selection */}
                            {personaSource === 'preset' && (
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
                            )}

                            {/* CRM Selection */}
                            {personaSource === 'crm' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex gap-2">
                                        <Badge 
                                            variant={crmType === 'lead' ? 'default' : 'outline'} 
                                            className={`cursor-pointer flex-1 justify-center ${crmType === 'lead' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                            onClick={() => { setCrmType('lead'); setSelectedCrmId(""); }}
                                        >
                                            Leads
                                        </Badge>
                                        <Badge 
                                            variant={crmType === 'opportunity' ? 'default' : 'outline'} 
                                            className={`cursor-pointer flex-1 justify-center ${crmType === 'opportunity' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                            onClick={() => { setCrmType('opportunity'); setSelectedCrmId(""); }}
                                        >
                                            Opportunities
                                        </Badge>
                                    </div>

                                    <select 
                                        value={selectedCrmId}
                                        onChange={(e) => setSelectedCrmId(e.target.value)}
                                        className={`w-full p-2.5 rounded-md text-sm border focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                    >
                                        <option value="">-- Choose {crmType === 'lead' ? 'Lead' : 'Deal'} --</option>
                                        {crmType === 'lead' 
                                            ? leads.map(l => (
                                                <option key={l.id} value={l.id}>{l.full_name} ({l.lead_status})</option>
                                            ))
                                            : opportunities.map(o => (
                                                <option key={o.id} value={o.id}>{o.lead_name} - ${o.amount}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}
                            
                            {/* Dynamic Persona Details Card */}
                            {currentPersona && (
                                <div className={`rounded-lg p-3 text-xs space-y-2 border mt-4 animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className={textSub}>Role:</span>
                                        <span className={`font-medium ${textMain} truncate max-w-[150px]`}>{currentPersona.role}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={textSub}>DISC/Analysis:</span>
                                        <span className="text-blue-500 font-medium truncate max-w-[150px]">{currentPersona.disc_profile}</span>
                                    </div>
                                    <div className={`mt-2 p-2 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                                        <span className={`block mb-1 font-semibold ${textSub}`}>AI Prompt Preview:</span>
                                        <p className={`italic line-clamp-3 ${textMain}`}>"{currentPersona.ai_simulation_prompt}"</p>
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