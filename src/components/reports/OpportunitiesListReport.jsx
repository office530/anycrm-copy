import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';
import { Search, DollarSign, Briefcase, CheckCircle2 } from 'lucide-react';

export default function OpportunitiesListReport({ opportunities = [] }) {
  const [filterStage, setFilterStage] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [searchClient, setSearchClient] = useState('');

  // Unique Stages for Filter
  const stages = useMemo(() => {
    const s = new Set(opportunities.map(o => o.deal_stage).filter(Boolean));
    return Array.from(s);
  }, [opportunities]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return opportunities.filter(o => {
      // Stage Filter
      if (filterStage !== 'all' && o.deal_stage !== filterStage) return false;

      // Date Filter (Created Date)
      if (filterDate !== 'all') {
        const created = moment(o.created_date);
        const now = moment();
        if (filterDate === 'this_month' && !created.isSame(now, 'month')) return false;
        if (filterDate === 'last_month' && !created.isSame(now.clone().subtract(1, 'month'), 'month')) return false;
        if (filterDate === 'this_year' && !created.isSame(now, 'year')) return false;
      }

      // Client Name Filter
      if (searchClient) {
        const name = o.lead_name || '';
        if (!name.toLowerCase().includes(searchClient.toLowerCase())) return false;
      }

      return true;
    });
  }, [opportunities, filterStage, filterDate, searchClient]);

  // Stats Calculation
  const stats = useMemo(() => {
    let openCount = 0;
    let wonCount = 0;
    let wonAmount = 0;

    filteredData.forEach(o => {
      const isWon = o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה') || o.deal_stage?.includes('נחתם');
      const isLost = o.deal_stage?.includes('Lost') || o.deal_stage?.includes('אבוד');
      
      if (isWon) {
        wonCount++;
        wonAmount += (o.loan_amount_requested || 0);
      } else if (!isLost) {
        openCount++;
      }
    });

    return { openCount, wonCount, wonAmount };
  }, [filteredData]);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">הזדמנויות פתוחות</p>
              <h3 className="text-3xl font-bold text-blue-900">{stats.openCount}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">עסקאות שנסגרו (Won)</p>
              <h3 className="text-3xl font-bold text-emerald-900">{stats.wonCount}</h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">סך הכנסות מעסקאות סגורות</p>
              <h3 className="text-3xl font-bold text-purple-900">₪{stats.wonAmount.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="w-full md:w-64 space-y-1">
          <label className="text-xs font-medium text-slate-500">חיפוש לקוח</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="שם לקוח..." 
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-medium text-slate-500">סינון לפי שלב</label>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger>
              <SelectValue placeholder="כל השלבים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל השלבים</SelectItem>
              {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-medium text-slate-500">תאריך יצירה</label>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger>
              <SelectValue placeholder="כל הזמנים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הזמנים</SelectItem>
              <SelectItem value="this_month">החודש הנוכחי</SelectItem>
              <SelectItem value="last_month">חודש שעבר</SelectItem>
              <SelectItem value="this_year">השנה הנוכחית</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden border-slate-100">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg font-medium text-slate-800">פירוט הזדמנויות</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right min-w-[150px]">שם ההזדמנות / לקוח</TableHead>
                <TableHead className="text-right">סכום מבוקש</TableHead>
                <TableHead className="text-right">שלב במכירה</TableHead>
                <TableHead className="text-right">תאריך יצירה</TableHead>
                <TableHead className="text-right">תאריך סגירה משוער</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-slate-900">{o.lead_name || 'ללא שם'}</TableCell>
                    <TableCell className="font-mono text-slate-600">₪{o.loan_amount_requested?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white border-slate-200 font-normal text-slate-600">
                        {o.deal_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {o.created_date ? moment(o.created_date).format('DD/MM/YYYY') : '-'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {o.expected_close_date ? moment(o.expected_close_date).format('DD/MM/YYYY') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    לא נמצאו הזדמנויות התואמות את הסינון
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}