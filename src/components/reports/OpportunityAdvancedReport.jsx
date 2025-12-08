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
                <label className="text-xs font-medium text-neutral-500 ml-1">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px] bg-neutral-50">
                        <Calendar className="w-4 h-4 ml-2 text-neutral-400" />
                        <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="this_quarter">This Quarter</SelectItem>
                        <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500 ml-1">Sales Rep</label>
                <Select value={filterRep} onValueChange={setFilterRep}>
                    <SelectTrigger className="w-[180px] bg-neutral-50">
                        <User className="w-4 h-4 ml-2 text-neutral-400" />
                        <SelectValue placeholder="All Reps" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Reps</SelectItem>
                        {salesReps.map(rep => <SelectItem key={rep} value={rep}>{rep}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500 ml-1">Deal Stage</label>
                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-[180px] bg-neutral-50">
                        <FilterIcon className="w-4 h-4 ml-2 text-neutral-400" />
                        <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200">
            <div className="text-center px-4 border-l border-neutral-200">
                <p className="text-xs text-neutral-500">Pipeline Value</p>
                <p className="text-lg font-bold text-neutral-800">₪{totalPipeline.toLocaleString()}</p>
            </div>
            <div className="text-center px-4 border-l border-neutral-200">
                <p className="text-xs text-neutral-500">Weighted Forecast</p>
                <p className="text-lg font-bold text-red-600">₪{weightedPipeline.toLocaleString()}</p>
            </div>
            <div className="text-center px-4">
                <p className="text-xs text-neutral-500">Win Rate</p>
                <p className="text-lg font-bold text-green-600">{winRate.toFixed(1)}%</p>
            </div>
        </div>
      </div>

      {/* Row 1: Progression & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-red-500" /> Deal Progression (Count & Value)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={progressionData} layout="vertical" margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#666'}} stroke={theme === 'dark' ? '#4b5563' : '#ccc'} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000'}}
                            formatter={(value, name) => name === 'value' ? `₪${value.toLocaleString()}` : value}
                        />
                        <Bar dataKey="count" name="Count" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" /> Conversions by Source (Won Deals)
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
                    <TrendingUp className="w-5 h-5 text-green-500" /> Revenue Forecast (Weighted vs Actual)
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
                        <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#666'} />
                        <YAxis tickFormatter={(val) => `${val/1000}k`} stroke={theme === 'dark' ? '#9ca3af' : '#666'} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000', border: 'none' }}
                            formatter={(val) => `₪${val.toLocaleString()}`} 
                        />
                        <Area type="monotone" dataKey="expected" name="Weighted Forecast" stroke="#8884d8" fillOpacity={1} fill="url(#colorExpected)" />
                        <Area type="monotone" dataKey="actual" name="Actual (Won)" stroke="#82ca9d" fillOpacity={1} fill="url(#colorActual)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" /> Average Sales Cycle Length (Days)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesCycleData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#666'} />
                        <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#666'} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000', border: 'none' }} />
                        <Bar dataKey="avgDays" name="Avg Days" fill="#f97316" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="shadow-sm border-neutral-100 overflow-hidden">
          <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-neutral-500" /> Filtered Opportunities Details
              </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="text-left">Client Name</TableHead>
                          <TableHead className="text-left">Product</TableHead>
                          <TableHead className="text-left">Stage</TableHead>
                          <TableHead className="text-left">Value</TableHead>
                          <TableHead className="text-left">Probability</TableHead>
                          <TableHead className="text-left">Close Date</TableHead>
                          <TableHead className="text-left">Rep</TableHead>
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
                              <TableCell>{o.expected_close_date ? moment(o.expected_close_date).format('MMM D, YYYY') : '-'}</TableCell>
                              <TableCell className="text-xs text-neutral-500">{o.created_by}</TableCell>
                          </TableRow>
                      ))}
                      {filteredData.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-neutral-500">No data to display</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
              {filteredData.length > 10 && (
                  <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-50 border-t border-neutral-100">
                      Showing 10 out of {filteredData.length} opportunities. Download full report to see all.
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}