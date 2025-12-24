import React, { useState, useRef, useEffect } from 'react';
import { 
    Mail, Clock, CheckCircle, AlertOctagon, GitBranch, 
    MousePointer2, Target, Plus, X, Settings, GripVertical,
    Play, Save, CheckSquare, Search, ArrowLeft, Zap
} from 'lucide-react';
import SmartTriggerConfig from './SmartTriggerConfig';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// --- Node Component ---
const FlowNode = ({ node, isSelected, onClick, onDragStart, onDrag, onDragEnd }) => {
    const getIcon = () => {
        switch(node.type) {
            case 'EMAIL': return <Mail className="w-4 h-4 text-blue-500" />;
            case 'DELAY': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'TASK': return <CheckSquare className="w-4 h-4 text-purple-500" />;
            case 'DECISION': return <GitBranch className="w-4 h-4 text-emerald-500" />;
            case 'GOAL': return <Target className="w-4 h-4 text-red-500" />;
            case 'START': return <Zap className="w-4 h-4 text-emerald-500" />;
            default: return <Settings className="w-4 h-4 text-slate-500" />;
        }
    };

    const getColors = () => {
        if (isSelected) return "ring-2 ring-blue-500 border-blue-500";
        if (theme === 'dark') return "border-slate-700 hover:border-blue-400";
        return "border-slate-200 hover:border-blue-300";
    };

    const bgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textMain = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
    const textSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
    const iconBg = theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100';

    return (
        <div
            className={`absolute ${bgClass} rounded-lg shadow-sm border w-64 p-3 cursor-grab active:cursor-grabbing transition-all ${getColors()}`}
            style={{ left: node.x, top: node.y }}
            onMouseDown={(e) => onDragStart(e, node.id)}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-md border ${iconBg}`}>
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${textMain}`}>{node.label}</p>
                    <p className={`text-xs truncate ${textSub}`}>{node.subLabel}</p>
                </div>
                <GripVertical className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>

            {node.stats && (
                <div className={`flex items-center gap-2 mt-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <Badge variant="secondary" className={`text-[10px] h-5 px-1 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                        Open: {node.stats.openRate}%
                    </Badge>
                    <Badge variant="secondary" className={`text-[10px] h-5 px-1 ${theme === 'dark' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                        Click: {node.stats.clickRate}%
                    </Badge>
                </div>
            )}
            
            {node.abTest && (
                 <div className="absolute -right-2 -top-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                    AB
                 </div>
            )}

            {/* Connection Points */}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-slate-300 rounded-full hover:bg-blue-500 cursor-crosshair" title="Output" />
            {node.type !== 'START' && (
                <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-300 rounded-full hover:bg-blue-500 cursor-crosshair" title="Input" />
            )}
        </div>
    );
};

// --- Connection Line Component ---
const ConnectionLine = ({ start, end }) => {
    const { theme } = useSettings();
    // Bezier curve calculation
    const controlPointOffset = Math.abs(end.x - start.x) / 2;
    const path = `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${end.x - controlPointOffset} ${end.y}, ${end.x} ${end.y}`;

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
            <path d={path} stroke={theme === 'dark' ? '#475569' : '#cbd5e1'} strokeWidth="2" fill="none" />
            <path d={path} stroke="transparent" strokeWidth="10" fill="none" className="pointer-events-auto hover:stroke-blue-200 cursor-pointer" />
        </svg>
    );
};

export default function SequenceCanvas() {
    const navigate = useNavigate();
    const { theme } = useSettings();
    const [nodes, setNodes] = useState([
        { id: 'start', type: 'START', x: 100, y: 100, label: 'Start Sequence', subLabel: 'Trigger: New Lead' },
        { id: 'email1', type: 'EMAIL', x: 400, y: 100, label: 'Intro Email', subLabel: 'Day 1 - Welcome', stats: { openRate: 45, clickRate: 12 }, abTest: true },
        { id: 'wait1', type: 'DELAY', x: 700, y: 100, label: 'Wait 3 Days', subLabel: 'Business hours only' },
        { id: 'decision1', type: 'DECISION', x: 400, y: 300, label: 'Check Reply', subLabel: 'If replied...' },
    ]);
    const [connections, setConnections] = useState([
        { from: 'start', to: 'email1' },
        { from: 'email1', to: 'wait1' },
    ]);
    
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [inspectorOpen, setInspectorOpen] = useState(true);
    const [dragState, setDragState] = useState({ isDragging: false, nodeId: null, startX: 0, startY: 0 });

    const containerRef = useRef(null);

    // Drag Logic
    const handleDragStart = (e, id) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === id);
        setDragState({
            isDragging: true,
            nodeId: id,
            offsetX: e.clientX - node.x,
            offsetY: e.clientY - node.y
        });
        setSelectedNodeId(id);
    };

    const handleMouseMove = (e) => {
        if (dragState.isDragging) {
            const newX = e.clientX - dragState.offsetX;
            const newY = e.clientY - dragState.offsetY;
            setNodes(nodes.map(n => n.id === dragState.nodeId ? { ...n, x: newX, y: newY } : n));
        }
    };

    const handleMouseUp = () => {
        setDragState({ isDragging: false, nodeId: null, startX: 0, startY: 0 });
    };

    // Calculate connection points
    const getConnectorPoints = (conn) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.to === conn.to); // Fix: conn.to is an ID, not an object
        // Assuming nodes are 256px wide (w-64) and approx 80px high. 
        // Output is right center, Input is left center.
        return {
            start: { x: fromNode.x + 256, y: fromNode.y + 40 },
            end: { x: (nodes.find(n => n.id === conn.to)?.x || 0), y: (nodes.find(n => n.id === conn.to)?.y || 0) + 40 }
        };
    };

    const bgBase = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
    const bgPanel = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const bgHeader = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textMain = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
    const textSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
    const itemBg = theme === 'dark' ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300';
    const inspectorHeaderBg = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-200';

    return (
        <div className={`flex h-screen flex-col ${bgBase} font-sans`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            {/* Header */}
            <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 z-20 relative ${bgHeader}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className={theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : ''}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className={`font-bold ${textMain}`}>SaaS CEO Outreach</h1>
                        <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span>
                             <span>•</span>
                             <span>Last saved: 2 mins ago</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className={theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'text-slate-600'}>
                        <Play className="w-4 h-4 mr-2" /> Test Run
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> Save & Activate
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar - Toolbox */}
                <aside className={`w-64 border-r z-10 flex flex-col ${bgPanel}`}>
                    <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Toolbox</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                         {[
                             { icon: Mail, label: 'Send Email', color: 'text-blue-500' },
                             { icon: Clock, label: 'Wait / Delay', color: 'text-amber-500' },
                             { icon: CheckSquare, label: 'Task / Call', color: 'text-purple-500' },
                             { icon: GitBranch, label: 'Condition', color: 'text-emerald-500' },
                             { icon: Target, label: 'Goal', color: 'text-red-500' },
                         ].map((item, idx) => (
                             <div key={idx} className={`p-3 border rounded-lg cursor-grab hover:shadow-sm transition-all flex items-center gap-3 ${itemBg}`}>
                                 <item.icon className={`w-5 h-5 ${item.color}`} />
                                 <span className={`text-sm font-medium ${textMain}`}>{item.label}</span>
                             </div>
                         ))}
                    </div>
                </aside>

                {/* Main Canvas */}
                <main 
                    className={`flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing ${bgBase}`}
                    ref={containerRef}
                    style={{
                        backgroundImage: `radial-gradient(${theme === 'dark' ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}
                >
                    {/* Render Connections */}
                    {connections.map((conn, i) => {
                         const points = getConnectorPoints(conn);
                         return <ConnectionLine key={i} start={points.start} end={points.end} />;
                    })}

                    {/* Render Nodes */}
                    {nodes.map(node => (
                        <FlowNode 
                            key={node.id} 
                            node={node} 
                            isSelected={selectedNodeId === node.id}
                            onDragStart={handleDragStart}
                        />
                    ))}

                </main>

                {/* Right Sidebar - Inspector */}
                <aside className={`w-80 border-l z-10 flex flex-col transition-all duration-300 ${inspectorOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'} ${bgPanel}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${inspectorHeaderBg}`}>
                        <h3 className={`text-sm font-bold ${textMain}`}>Inspector</h3>
                        <Button variant="ghost" size="icon" onClick={() => setInspectorOpen(false)} className={theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : ''}><X className="w-4 h-4" /></Button>
                    </div>
                    
                    {selectedNodeId ? (
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Node Specific Settings */}
                            <div className="space-y-4">
                                {nodes.find(n => n.id === selectedNodeId)?.type !== 'START' && (
                                    <div>
                                        <Label className="text-xs text-slate-500 uppercase tracking-wider">Step Name</Label>
                                        <Input defaultValue={nodes.find(n => n.id === selectedNodeId)?.label} className={`mt-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : ''}`} />
                                    </div>
                                )}

                                {nodes.find(n => n.id === selectedNodeId)?.type === 'START' && (
                                    <SmartTriggerConfig />
                                )}

                                {nodes.find(n => n.id === selectedNodeId)?.type === 'EMAIL' && (
                                    <>
                                        <div className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="w-4 h-4 text-purple-600" />
                                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-900'}`}>A/B Test</span>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className={textMain}>Email Template</Label>
                                            <div className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between ${theme === 'dark' ? 'hover:bg-slate-700 border-slate-600' : 'hover:bg-slate-50'}`}>
                                                <span className={`text-sm truncate ${textMain}`}>Intro Template v2</span>
                                                <Settings className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className={textMain}>Safety Check</Label>
                                            <div className={`flex items-center gap-2 text-sm p-2 rounded border ${theme === 'dark' ? 'bg-amber-900/20 text-amber-500 border-amber-800' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                <AlertOctagon className="w-4 h-4" />
                                                <span>Missing Fallback for {'{{Company}}'}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {nodes.find(n => n.id === selectedNodeId)?.type === 'DELAY' && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label className={textMain}>Wait Duration</Label>
                                            <div className="flex gap-2 mt-1">
                                                <Input type="number" defaultValue="3" className={`w-20 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : ''}`} />
                                                <select className={`flex-1 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-background border-input'}`}>
                                                    <option>Days</option>
                                                    <option>Hours</option>
                                                    <option>Minutes</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch id="business-hours" defaultChecked />
                                            <Label htmlFor="business-hours" className={`font-normal ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Business Hours Only</Label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 text-center text-slate-400">
                            <MousePointer2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Select a node to edit its properties</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}