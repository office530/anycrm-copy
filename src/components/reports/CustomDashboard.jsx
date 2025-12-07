import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, BarChart3, PieChart, LineChart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart as ReLineChart, Line 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CustomDashboard() {
    const queryClient = useQueryClient();
    const [isAddingWidget, setIsAddingWidget] = useState(false);

    // Fetch chart configs
    const { data: widgets, isLoading } = useQuery({
        queryKey: ['dashboard_widgets'],
        queryFn: () => base44.entities.ReportConfig.filter({ type: { $in: ['bar_chart', 'pie_chart', 'line_chart', 'kpi_card'] } }),
        initialData: []
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ReportConfig.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['dashboard_widgets'])
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">דשבורד ויזואלי</h2>
                    <p className="text-slate-500">מדדי ביצוע וגרפים מותאמים אישית</p>
                </div>
                <Button onClick={() => setIsAddingWidget(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף וידג'ט
                </Button>
            </div>

            {isLoading ? <Loader2 className="animate-spin mx-auto mt-20" /> :
             widgets.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-slate-50/50">
                    <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">הדשבורד ריק</h3>
                    <p className="text-slate-500 mb-6">הוסף גרפים ומדדים כדי לעקוב אחרי הביצועים החשובים לך</p>
                    <Button onClick={() => setIsAddingWidget(true)}>הוסף וידג'ט ראשון</Button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {widgets.map(widget => (
                        <DashboardWidget 
                            key={widget.id} 
                            config={widget} 
                            onDelete={() => {
                                if(confirm('למחוק וידג\'ט זה?')) deleteMutation.mutate(widget.id);
                            }} 
                        />
                    ))}
                </div>
             )}

             <Dialog open={isAddingWidget} onOpenChange={setIsAddingWidget}>
                <DialogContent className="max-w-2xl">
                    <WidgetBuilder onSave={() => {
                        setIsAddingWidget(false);
                        queryClient.invalidateQueries(['dashboard_widgets']);
                    }} onCancel={() => setIsAddingWidget(false)} />
                </DialogContent>
             </Dialog>
        </div>
    );
}

function WidgetBuilder({ onSave, onCancel }) {
    const [config, setConfig] = useState({
        name: "",
        type: "bar_chart",
        entity_type: "Opportunity",
        config: { groupBy: "", metric: "count" } // metric: count or sum(field)
    });
    const [schema, setSchema] = useState(null);

    useEffect(() => {
        async function fetchSchema() {
            try {
                let s = null;
                try {
                    s = await base44.entities[config.entity_type].schema();
                } catch (err) {
                    console.warn("Schema fetch failed, trying fallback", err);
                }

                if (!s || !s.properties || Object.keys(s.properties).length === 0) {
                     const items = await base44.entities[config.entity_type].list(1);
                     if (items && items.length > 0) {
                         const props = {};
                         Object.keys(items[0]).forEach(key => {
                             props[key] = { description: key };
                         });
                         s = { properties: props };
                     }
                }
                setSchema(s);
            } catch (e) { console.error(e); }
        }
        fetchSchema();
    }, [config.entity_type]);

    const saveMutation = useMutation({
        mutationFn: (data) => base44.entities.ReportConfig.create(data),
        onSuccess: onSave
    });

    const fields = schema ? Object.keys(schema.properties) : [];

    return (
        <div className="space-y-4">
            <DialogHeader>
                <DialogTitle>הוספת וידג'ט חדש</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>כותרת</Label>
                    <Input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="למשל: מכירות לפי שלב" />
                </div>
                <div className="space-y-2">
                    <Label>סוג תצוגה</Label>
                    <Select value={config.type} onValueChange={v => setConfig({...config, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bar_chart">גרף עמודות (Bar)</SelectItem>
                            <SelectItem value="pie_chart">גרף עוגה (Pie)</SelectItem>
                            <SelectItem value="line_chart">גרף קו (Line)</SelectItem>
                            <SelectItem value="kpi_card">כרטיס מדד (KPI)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>מקור נתונים</Label>
                    <Select value={config.entity_type} onValueChange={v => setConfig({...config, entity_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Lead">לידים</SelectItem>
                            <SelectItem value="Opportunity">הזדמנויות</SelectItem>
                            <SelectItem value="Task">משימות</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>קבץ לפי (X Axis)</Label>
                    <Select value={config.config.groupBy} onValueChange={v => setConfig({...config, config: {...config.config, groupBy: v}})}>
                        <SelectTrigger><SelectValue placeholder="בחר שדה..." /></SelectTrigger>
                        <SelectContent>
                            {fields.map(f => <SelectItem key={f} value={f}>{schema?.properties[f]?.description || f}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={onCancel}>ביטול</Button>
                <Button onClick={() => saveMutation.mutate(config)} disabled={!config.name || !config.config.groupBy}>
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    שמור וידג'ט
                </Button>
            </div>
        </div>
    );
}

function DashboardWidget({ config, onDelete }) {
    const { data, isLoading } = useQuery({
        queryKey: ['widget_data', config.id],
        queryFn: async () => {
            const items = await base44.entities[config.entity_type].list();
            // Client-side aggregation
            const groupBy = config.config.groupBy;
            const groups = {};
            
            items.forEach(item => {
                const key = String(item[groupBy] || 'Unknown');
                if (!groups[key]) groups[key] = 0;
                groups[key]++;
            });

            return Object.entries(groups).map(([name, value]) => ({ name, value }));
        }
    });

    return (
        <Card className="h-80 flex flex-col relative group">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">{config.name}</CardTitle>
                <Button 
                    variant="ghost" size="icon" 
                    className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {isLoading ? <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div> :
                 data.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 text-sm">אין נתונים</div> :
                 (
                    <ResponsiveContainer width="100%" height="100%">
                        {config.type === 'bar_chart' ? (
                            <ReBarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <ReTooltip />
                                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </ReBarChart>
                        ) : config.type === 'pie_chart' ? (
                            <RePieChart>
                                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ReTooltip />
                            </RePieChart>
                        ) : (
                             <ReLineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ReTooltip />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                            </ReLineChart>
                        )}
                    </ResponsiveContainer>
                 )
                }
            </CardContent>
        </Card>
    );
}