import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertTriangle, CheckCircle2, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const STEPS = [
    { id: 1, label: 'העלאת קובץ' },
    { id: 2, label: 'בדיקת נתונים' },
    { id: 3, label: 'ייבוא' }
];

export default function ImportLeadsPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ valid: 0, invalid: 0 });
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  const parseCSV = (text) => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map((line, index) => {
      if (!line.trim()) return null;
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      return { ...row, _originalIndex: index };
    }).filter(row => row !== null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        const jsonData = parseCSV(text);
        
        let validCount = 0;
        let invalidCount = 0;

        const mappedData = jsonData.map((row, index) => {
            // זיהוי שדות (כולל שדות פיננסיים והערות)
            const fullName = row['Name'] || row['name'] || row['שם'] || row['שם מלא'] || row['שם לקוח'] || row['לקוח'] || row['Full Name'];
            const phone = row['Phone'] || row['phone'] || row['טלפון'] || row['נייד'] || row['סלולרי'] || row['Mobile'];
            const city = row['City'] || row['city'] || row['עיר'] || row['כתובת'];
            const year = row['Year'] || row['year'] || row['שנה'] || new Date().getFullYear().toString();
            
            // שדות נוספים
            const age = row['Age'] || row['age'] || row['גיל'];
            const email = row['Email'] || row['email'] || row['אימייל'] || row['מייל'];
            const notes = row['Notes'] || row['notes'] || row['הערות'] || row['סיכום'];
            const marital = row['Marital Status'] || row['marital'] || row['מצב משפחתי']; // צריך להיות באנגלית: Married, Single, etc.
            const propertyVal = row['Estimated Value'] || row['property'] || row['שווי נכס'];
            const mortgageBal = row['Mortgage Balance'] || row['mortgage'] || row['יתרת משכנתא'];
            const status = row['Status'] || row['status'] || row['סטטוס'] || 'New';
  
            const isValid = !!(fullName || phone);

            if (isValid) validCount++; else invalidCount++;
  
            return {
                id: index,
                full_name: fullName || 'לא ידוע',
                phone_number: phone || '',
                city: city || '',
                age: age || '',
                email: email || '',
                notes: notes || '',
                marital_status: marital || '',
                estimated_property_value: propertyVal || '',
                existing_mortgage_balance: mortgageBal || '',
                lead_status: status,
                source_year: year,
                isValid,
                errors: !isValid ? 'שורה ריקה או חסרה' : ''
            };
        });

        setData(mappedData);
        setSummary({ valid: validCount, invalid: invalidCount });
        setStep(2);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
      setIsImporting(true);
      const validRows = data.filter(r => r.isValid);
      const total = validRows.length;
      const BATCH_SIZE = 50; 
      let completed = 0;

      for (let i = 0; i < total; i += BATCH_SIZE) {
          const batch = validRows.slice(i, i + BATCH_SIZE);
          
          try {
              await Promise.all(batch.map(row => {
                  const { isValid, errors, id, ...leadData } = row;
                  return base44.entities.Lead.create(leadData);
              }));
              
              completed += batch.length;
              setImportProgress(Math.round((completed / total) * 100));
              
          } catch (error) {
              console.error(`Batch failed at index ${i}`, error);
          }
      }

      setIsImporting(false);
      setTimeout(() => {
          alert(`תהליך הסתיים! ${completed} לידים יובאו בהצלחה.`);
          navigate('/Leads');
      }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-10 font-sans text-slate-900" dir="rtl">
        
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">ייבוא לידים</h1>
            <p className="text-slate-500">העלה קובץ CSV כדי להזין נתונים בצורה מרוכזת</p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-8">
            {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center">
                    <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors
                        ${step === s.id ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : step > s.id ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}
                    `}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s.id ? 'bg-red-700 text-white' : step > s.id ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {step > s.id ? <CheckCircle2 className="w-3 h-3" /> : s.id}
                        </div>
                        {s.label}
                    </div>
                    {i < STEPS.length - 1 && <div className="w-8 h-[2px] bg-slate-200 mx-2" />}
                </div>
            ))}
        </div>

        {step === 1 && (
            <div className="border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-slate-50 rounded-3xl p-24 text-center transition-all relative bg-white shadow-sm">
                <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Upload className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">גרור קובץ לכאן</h3>
                <p className="text-slate-500">תומך בקבצי CSV בלבד</p>
                <Button variant="outline" className="mt-6 border-slate-200 text-slate-600 hover:bg-white hover:text-red-700 pointer-events-none">בחר קובץ מהמחשב</Button>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-50 border-green-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-sm font-medium text-green-800">רשומות תקינות</p>
                                <p className="text-2xl font-bold text-green-700">{summary.valid}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={`${summary.invalid > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} shadow-sm`}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertTriangle className={`w-8 h-8 ${summary.invalid > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                            <div>
                                <p className={`text-sm font-medium ${summary.invalid > 0 ? 'text-red-800' : 'text-slate-500'}`}>שגיאות / חסרים</p>
                                <p className={`text-2xl font-bold ${summary.invalid > 0 ? 'text-red-700' : 'text-slate-400'}`}>{summary.invalid}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">תצוגה מקדימה (50 רשומות ראשונות)</h3>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-500 hover:text-red-600">
                            <RefreshCw className="w-4 h-4 ml-1" /> החלף קובץ
                        </Button>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 shadow-sm z-10">
                                <TableRow>
                                    <TableHead className="text-right font-bold text-slate-700">סטטוס</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">שם מלא</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">טלפון</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">עיר</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">שנה</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.slice(0, 50).map((row, i) => (
                                    <TableRow key={i} className={`hover:bg-slate-50 ${!row.isValid ? 'bg-red-50/30' : ''}`}>
                                        <TableCell>
                                            {row.isValid ? (
                                                <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">תקין</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-0 hover:bg-red-100">
                                                    {row.errors}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-800">{row.full_name}</TableCell>
                                        <TableCell className="font-mono text-slate-600">{row.phone_number}</TableCell>
                                        <TableCell className="text-slate-600">{row.city}</TableCell>
                                        <TableCell className="text-slate-500">{row.source_year}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {data.slice(0, 50).map((row, i) => (
                        <div key={i} className={`bg-white p-4 rounded-xl shadow-sm border ${!row.isValid ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} flex flex-col gap-3`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">{row.full_name}</div>
                                    <div className="text-xs text-slate-500">{row.city}</div>
                                </div>
                                {row.isValid ? (
                                    <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">תקין</Badge>
                                ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-0 hover:bg-red-100">
                                        {row.errors}
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 text-sm">טלפון:</span>
                                    <span className="font-mono text-slate-700 font-medium">{row.phone_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 text-sm">שנה:</span>
                                    <span className="text-slate-700">{row.source_year}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4">
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-500">חזרה</Button>
                    
                    <div className="flex gap-4 items-center">
                        {isImporting && (
                            <div className="flex flex-col items-end gap-1 min-w-[200px]">
                                <span className="text-xs font-bold text-red-600">{importProgress}% הושלם</span>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                        
                        <Button 
                            onClick={handleImport} 
                            disabled={isImporting || summary.valid === 0} 
                            className="bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-900/20 px-8 py-6 text-lg rounded-xl transition-all hover:scale-105"
                        >
                            {isImporting ? (
                                <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> מייבא נתונים...</>
                            ) : (
                                <><ArrowRight className="w-5 h-5 ml-2" /> ייבא {summary.valid} לידים</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}