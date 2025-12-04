import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { Download, Filter, RefreshCw, Calendar, User, Filter as FilterIcon, Table as TableIcon, BarChart3, TrendingUp } from "lucide-react";
import moment from 'moment';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

export default function OpportunityAdvancedReport({ leads, opportunities }) {
  const [filterRep, setFilterRep] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [dateRange, setDateRange] = useState('this_year'); // this_month, last_month, this_quarter, this_year, all

  // Derived Data & Filtering
  const filteredData = useMemo(() => {
    let filtered = [...opportunities];
    const now = moment();

    // Date Filter (using created_date)
    if (dateRange !== 'all') {
      filtered = filtered.filter(o => {
        const date = moment(o.created_date);
        switch(dateRange) {
          case 'this_month': return date.isSame(now, 'month');
          case 'last_month': return date.isSame(now.clone().subtract(1, 'month'), 'month');
          case 'this_quarter': return date.isSame(now, 'quarter');
          case 'this_year': return date.isSame(now, 'year');
          default: return true;
        }
      });
    }

    // Rep Filter
    if (filterRep !== 'all') {
      filtered = filtered.filter(o => o.created_by === filterRep);
    }

    // Stage Filter
    if (filterStage !== 'all') {
      filtered = filtered.filter(o => o.deal_stage === filterStage);
    }

    return filtered;
  }, [opportunities, dateRange, filterRep, filterStage]);

  // Unique Sales Reps
  const salesReps = useMemo(() => {
    const reps = new Set(opportunities.map(o => o.created_by).filter(Boolean));
    return Array.from(reps);
  }, [opportunities]);

  // Unique Stages
  const stages = useMemo(() => {
    const s = new Set(opportunities.map(o => o.deal_stage).filter(Boolean));
    return Array.from(s);
  }, [opportunities]);

  // Chart 1: Deal Progression (Stage Funnel)
  const progressionData = useMemo(() => {
    const counts = {};
    filteredData.forEach(o => {
      const stage = o.deal_stage?.split('(')[0]?.trim() || 'Unknown';
      if (!counts[stage]) counts[stage] = { name: stage, count: 0, value: 0 };
      counts[stage].count += 1;
      counts[stage].value += (o.loan_amount_requested || 0);
    });
    // Sort by count descending or predefined order if possible
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Chart 2: Conversion by Source
  const sourceData = useMemo(() => {
    const wonDeals = filteredData.filter(o => o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה'));
    const counts = {};
    
    wonDeals.forEach(o => {
      const lead = leads.find(l => l.id === o.lead_id);
      const source = lead?.source_year || 'Unknown'; 
      // Ideally we'd have a real source field, using source_year as proxy per request context/availability
      if (!counts[source]) counts[source] = { name: source, value: 0 };
      counts[source].value += 1;
    });

    return Object.values(counts);
  }, [filteredData, leads]);

  // Chart 3: Revenue Over Time
  const revenueData = useMemo(() => {
    const data = {};
    filteredData.forEach(o => {
        if (!o.expected_close_date) return;
        const month = moment(o.expected_close_date).format('YYYY-MM');
        if (!data[month]) data[month] = { month, expected: 0, actual: 0 };
        
        data[month].expected += (o.loan_amount_requested || 0) * ((o.probability || 0) / 100);
        if (o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה')) {
            data[month].actual += (o.loan_amount_requested || 0);
        }
    });
    return Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData]);

  // Chart 4: Sales Cycle Length
  const salesCycleData = useMemo(() => {
    const productCycles = {}; // { Product: [days, days...] }
    
    filteredData.forEach(o => {
        if ((o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה')) && o.created_date) {
            const start = moment(o.created_date);
            const end = o.updated_date ? moment(o.updated_date) : moment();
            const days = end.diff(start, 'days');
            const prod = o.product_type || 'Other';
            
            if (!productCycles[prod]) productCycles[prod] = [];
            productCycles[prod].push(days);
        }
    });

    return Object.entries(productCycles).map(([name, cycles]) => ({
        name,
        avgDays: Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
    }));
  }, [filteredData]);

  // Metrics
  const totalPipeline = filteredData.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);
  const weightedPipeline = filteredData.reduce((sum, o) => sum + ((o.loan_amount_requested || 0) * ((o.probability || 0) / 100)), 0);
  const winRate = filteredData.length > 0 
    ? (filteredData.filter(o => o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה')).length / filteredData.length) * 100 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500 ml-1">טווח תאריכים</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px] bg-neutral-50">
                        <Calendar className="w-4 h-4 ml-2 text-neutral-400" />
                        <SelectValue placeholder="בחר טווח" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל הזמנים</SelectItem>
                        <SelectItem value="this_month">החודש הנוכחי</SelectItem>
                        <SelectItem value="last_month">חודש שעבר</SelectItem>
                        <SelectItem value="this_quarter">הרבעון הנוכחי</SelectItem>
                        <SelectItem value="this_year">השנה הנוכחית</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500 ml-1">נציג מטפל</label>
                <Select value={filterRep} onValueChange={setFilterRep}>
                    <SelectTrigger className="w-[180px] bg-neutral-50">
                        <User className="w-4 h-4 ml-2 text-neutral-400" />
                        <SelectValue placeholder="כל הנציגים" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל הנציגים</SelectItem>
                        {salesReps.map(rep => <SelectItem key={rep} value={rep}>{rep}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500 ml-1">שלב בעסקה</label>
                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-[180px] bg-neutral-50">
                        <FilterIcon className="w-4 h-4 ml-2 text-neutral-400" />
                        <SelectValue placeholder="כל השלבים" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל השלבים</SelectItem>
                        {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200">
            <div className="text-center px-4 border-l border-neutral-200">
                <p className="text-xs text-neutral-500">שווי צנרת</p>
                <p className="text-lg font-bold text-neutral-800">₪{totalPipeline.toLocaleString()}</p>
            </div>
            <div className="text-center px-4 border-l border-neutral-200">
                <p className="text-xs text-neutral-500">צפי משוקלל</p>
                <p className="text-lg font-bold text-red-600">₪{weightedPipeline.toLocaleString()}</p>
            </div>
            <div className="text-center px-4">
                <p className="text-xs text-neutral-500">אחוז סגירה</p>
                <p className="text-lg font-bold text-green-600">{winRate.toFixed(1)}%</p>
            </div>
        </div>
      </div>

      {/* Row 1: Progression & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-red-500" /> התקדמות עסקאות (כמות ושווי)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={progressionData} layout="vertical" margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                            formatter={(value, name) => name === 'value' ? `₪${value.toLocaleString()}` : value}
                        />
                        <Bar dataKey="count" name="כמות" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" /> המרות לפי מקור (עסקאות זכייה)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {sourceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue & Cycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" /> צפי הכנסות (משוקלל vs בפועל)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(val) => `${val/1000}k`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip formatter={(val) => `₪${val.toLocaleString()}`} />
                        <Area type="monotone" dataKey="expected" name="צפי משוקלל" stroke="#8884d8" fillOpacity={1} fill="url(#colorExpected)" />
                        <Area type="monotone" dataKey="actual" name="בפועל (זכייה)" stroke="#82ca9d" fillOpacity={1} fill="url(#colorActual)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" /> אורך מחזור מכירה ממוצע (ימים)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesCycleData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="avgDays" name="ימים בממוצע" fill="#f97316" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="shadow-sm border-neutral-100 overflow-hidden">
          <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-neutral-500" /> פירוט הזדמנויות מסונן
              </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="text-right">שם לקוח</TableHead>
                          <TableHead className="text-right">מוצר</TableHead>
                          <TableHead className="text-right">שלב</TableHead>
                          <TableHead className="text-right">שווי</TableHead>
                          <TableHead className="text-right">הסתברות</TableHead>
                          <TableHead className="text-right">תאריך יעד</TableHead>
                          <TableHead className="text-right">נציג</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredData.slice(0, 10).map((o) => (
                          <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.lead_name}</TableCell>
                              <TableCell>{o.product_type}</TableCell>
                              <TableCell>
                                  <Badge variant="outline" className="bg-neutral-50 font-normal">{o.deal_stage?.split('(')[0]}</Badge>
                              </TableCell>
                              <TableCell>₪{o.loan_amount_requested?.toLocaleString()}</TableCell>
                              <TableCell>{o.probability}%</TableCell>
                              <TableCell>{o.expected_close_date ? moment(o.expected_close_date).format('DD/MM/YYYY') : '-'}</TableCell>
                              <TableCell className="text-xs text-neutral-500">{o.created_by}</TableCell>
                          </TableRow>
                      ))}
                      {filteredData.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-neutral-500">לא נמצאו נתונים לתצוגה</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
              {filteredData.length > 10 && (
                  <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-50 border-t border-neutral-100">
                      מציג 10 מתוך {filteredData.length} הזדמנויות. הורד דוח מלא לצפייה בכולם.
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}