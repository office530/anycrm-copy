import React, { useState, useEffect } from "react";
import { Check, Lock, ChevronDown, ChevronUp, User, Briefcase, RefreshCw, BarChart3, Clock, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock Data Structure
const ONBOARDING_TEMPLATES = {
  "enterprise": {
    "title": "Enterprise Implementation (High-Touch)",
    "total_days_est": 45,
    "phases": [
      {
        "id": "p1",
        "name": "Phase 1: Alignment & Kickoff",
        "status": "completed",
        "tasks": [
          { "id": "t1", "text": "Hold Kickoff Call with Stakeholders", "completed": true, "owner": "CSM" },
          { "id": "t2", "text": "Define Success KPIs & Metrics", "completed": true, "owner": "Client" },
          { "id": "t3", "text": "Sign Technical Requirements Doc", "completed": true, "owner": "Client" }
        ]
      },
      {
        "id": "p2",
        "name": "Phase 2: Technical Setup",
        "status": "in_progress",
        "tasks": [
          { "id": "t4", "text": "Configure SSO / SAML", "completed": false, "owner": "Tech Support" },
          { "id": "t5", "text": "Data Migration from Legacy System", "completed": false, "owner": "Tech Support" },
          { "id": "t6", "text": "Whitelabel Domain Setup", "completed": false, "owner": "CSM" }
        ]
      },
      {
        "id": "p3",
        "name": "Phase 3: Training",
        "status": "locked",
        "tasks": [
          { "id": "t7", "text": "Admin Power-User Training", "completed": false, "owner": "CSM" },
          { "id": "t8", "text": "End-User Webinar", "completed": false, "owner": "CSM" }
        ]
      }
    ]
  },
  "smb": {
    "title": "SMB Fast-Track (Self-Serve)",
    "total_days_est": 7,
    "phases": [
      {
        "id": "p1",
        "name": "Getting Started",
        "status": "in_progress",
        "tasks": [
          { "id": "s1", "text": "Complete Billing Profile", "completed": true, "owner": "Client" },
          { "id": "s2", "text": "Import Contacts (CSV)", "completed": false, "owner": "Client" },
          { "id": "s3", "text": "Watch 'Day 1' Tutorial Video", "completed": false, "owner": "Client" }
        ]
      }
    ]
  }
};

export default function OnboardingWidget({ client, onUpdate, isDark = true }) {
  const [selectedTemplate, setSelectedTemplate] = useState(client.onboarding_track || "");
  const [plan, setPlan] = useState(client.onboarding_plan || null);
  const [expandedPhases, setExpandedPhases] = useState({});

  useEffect(() => {
    // Sync props to state if they change externally
    if (client.onboarding_track) setSelectedTemplate(client.onboarding_track);
    if (client.onboarding_plan) {
        setPlan(client.onboarding_plan);
        // Expand first active or in-progress phase by default
        const activePhase = client.onboarding_plan.phases.find(p => p.status === 'in_progress') || client.onboarding_plan.phases[0];
        if (activePhase) setExpandedPhases({ [activePhase.id]: true });
    }
  }, [client]);

  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    const newPlan = JSON.parse(JSON.stringify(ONBOARDING_TEMPLATES[value])); // Deep copy
    setPlan(newPlan);
    setExpandedPhases({ [newPlan.phases[0].id]: true }); // Open first phase
    
    // Call parent updater
    onUpdate({
        onboarding_track: value,
        onboarding_plan: newPlan,
        onboarding_status: 'In Progress'
    });
  };

  const handleTaskToggle = (phaseId, taskId) => {
    if (!plan) return;
    
    const newPlan = { ...plan };
    const phaseIndex = newPlan.phases.findIndex(p => p.id === phaseId);
    if (phaseIndex === -1) return;
    
    const taskIndex = newPlan.phases[phaseIndex].tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    // Toggle completion
    const currentStatus = newPlan.phases[phaseIndex].tasks[taskIndex].completed;
    newPlan.phases[phaseIndex].tasks[taskIndex].completed = !currentStatus;
    
    // Update Phase Status Logic (Simplified)
    const allTasks = newPlan.phases[phaseIndex].tasks;
    const allCompleted = allTasks.every(t => t.completed);
    const anyCompleted = allTasks.some(t => t.completed);
    
    if (allCompleted) {
        newPlan.phases[phaseIndex].status = 'completed';
        // Unlock next phase if exists
        if (phaseIndex < newPlan.phases.length - 1) {
            if (newPlan.phases[phaseIndex + 1].status === 'locked') {
                newPlan.phases[phaseIndex + 1].status = 'in_progress';
                setExpandedPhases(prev => ({ ...prev, [newPlan.phases[phaseIndex + 1].id]: true }));
            }
        }
    } else if (anyCompleted) {
        newPlan.phases[phaseIndex].status = 'in_progress';
    } else {
        // Only reset to locked if previous phase is NOT completed, but here we assume linear progression logic or manual
        // For simplicity, just set to in_progress or pending logic could go here. 
        // Keeping it simple as per requirement: update progress bar.
    }
    
    setPlan(newPlan);
    onUpdate({ onboarding_plan: newPlan });
  };

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  // Stats Calculation
  const calculateStats = () => {
    if (!plan) return { percent: 0, daysLeft: 0, completedTasks: 0, totalTasks: 0, health: 'N/A' };
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    plan.phases.forEach(p => {
        totalTasks += p.tasks.length;
        completedTasks += p.tasks.filter(t => t.completed).length;
    });
    
    const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    // Mocking days left calculation based on start date or just static for now as per prompt example
    // "Days Remaining: 12" was the requirement example.
    
    return {
        percent,
        daysLeft: Math.max(0, plan.total_days_est - 5), // Mock calculation
        completedTasks,
        totalTasks,
        health: percent > 50 ? 'On Track' : 'At Risk' // Simple logic
    };
  };

  const stats = calculateStats();

  return (
    <div className="w-full h-full bg-[#0f172a] text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl font-sans">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-400" />
                    Onboarding Hub
                </h2>
                <p className="text-sm text-slate-400 mt-1">Track implementation progress</p>
            </div>
            
            <div className="w-full md:w-64">
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 transition-colors">
                        <SelectValue placeholder="Load Template..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="enterprise">Enterprise Implementation</SelectItem>
                        <SelectItem value="smb">SMB Fast-Track</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {!plan ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <Briefcase className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a template to initialize onboarding</p>
            </div>
        ) : (
            <>
                {/* Hero Area (Status Board) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Progress Circle & Percent */}
                    <div className="col-span-1 bg-slate-800/30 backdrop-blur-md rounded-2xl p-5 border border-white/5 flex items-center gap-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                            {/* SVG Circle Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                                <circle 
                                    cx="40" cy="40" r="36" 
                                    stroke="#10b981" 
                                    strokeWidth="8" 
                                    fill="transparent" 
                                    strokeDasharray={226}
                                    strokeDashoffset={226 - (226 * stats.percent) / 100}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <span className="absolute text-lg font-bold text-white">{stats.percent}%</span>
                        </div>
                        
                        <div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Progress</div>
                            <div className="text-emerald-400 text-sm font-medium mt-1">{plan.title}</div>
                        </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                        <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center shadow-lg hover:bg-slate-800/50 transition-colors">
                            <Clock className="w-6 h-6 text-blue-400 mb-2" />
                            <div className="text-2xl font-bold text-white">{stats.daysLeft}</div>
                            <div className="text-xs text-slate-400 font-medium">Days Remaining</div>
                        </div>
                        
                        <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center shadow-lg hover:bg-slate-800/50 transition-colors">
                            <Check className="w-6 h-6 text-emerald-400 mb-2" />
                            <div className="text-2xl font-bold text-white">{stats.completedTasks}/{stats.totalTasks}</div>
                            <div className="text-xs text-slate-400 font-medium">Tasks Done</div>
                        </div>
                        
                        <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center shadow-lg hover:bg-slate-800/50 transition-colors">
                            <BarChart3 className={`w-6 h-6 mb-2 ${stats.health === 'On Track' ? 'text-emerald-400' : 'text-amber-400'}`} />
                            <div className={`text-xl font-bold ${stats.health === 'On Track' ? 'text-emerald-400' : 'text-amber-400'}`}>{stats.health}</div>
                            <div className="text-xs text-slate-400 font-medium">Project Health</div>
                        </div>
                    </div>
                </div>

                {/* List Area (Accordion) */}
                <div className="space-y-4">
                    {plan.phases.map((phase) => (
                        <div 
                            key={phase.id} 
                            className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                                phase.status === 'locked' 
                                    ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                                    : 'bg-slate-800/40 border-slate-700/50 shadow-md backdrop-blur-sm'
                            }`}
                        >
                            {/* Phase Header */}
                            <div 
                                onClick={() => phase.status !== 'locked' && togglePhase(phase.id)}
                                className={`p-4 flex items-center justify-between cursor-pointer ${
                                    phase.status === 'locked' ? 'cursor-not-allowed' : 'hover:bg-slate-700/30'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                        phase.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                                        phase.status === 'locked' ? 'bg-slate-800 border-slate-700 text-slate-500' :
                                        'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                    }`}>
                                        {phase.status === 'completed' ? <Check className="w-4 h-4" /> : 
                                         phase.status === 'locked' ? <Lock className="w-4 h-4" /> : 
                                         <RefreshCw className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${phase.status === 'locked' ? 'text-slate-500' : 'text-white'}`}>
                                            {phase.name}
                                        </h3>
                                        <div className="text-xs font-medium uppercase tracking-wide mt-0.5">
                                            <span className={
                                                phase.status === 'completed' ? 'text-emerald-500' :
                                                phase.status === 'locked' ? 'text-slate-600' :
                                                'text-blue-400'
                                            }>
                                                {phase.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {phase.status !== 'locked' && (
                                    <div className="text-slate-400">
                                        {expandedPhases[phase.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                )}
                            </div>
                            
                            {/* Phase Tasks (Accordion Body) */}
                            {expandedPhases[phase.id] && phase.status !== 'locked' && (
                                <div className="p-4 pt-0 space-y-2 border-t border-white/5 mt-2 bg-slate-900/20">
                                    {phase.tasks.map((task) => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => handleTaskToggle(phase.id, task.id)}
                                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer group ${
                                                task.completed 
                                                    ? 'bg-emerald-950/20 border-emerald-900/30' 
                                                    : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-800 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                task.completed 
                                                    ? 'bg-emerald-500 border-emerald-500 text-slate-900' 
                                                    : 'bg-transparent border-slate-500 group-hover:border-slate-400'
                                            }`}>
                                                {task.completed && <Check className="w-3.5 h-3.5 font-bold" />}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium transition-colors ${
                                                    task.completed ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-200'
                                                }`}>
                                                    {task.text}
                                                </p>
                                            </div>
                                            
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                task.owner === 'CSM' 
                                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' 
                                                    : task.owner === 'Client'
                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                                                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                                            }`}>
                                                <User className="w-3 h-3" />
                                                {task.owner}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
  );
}