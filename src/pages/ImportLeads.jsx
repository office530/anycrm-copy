import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Upload, FileSpreadsheet, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function ImportLeadsPage() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing
  const [data, setData] = useState([]);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  // Simple CSV Parser
  const parseCSV = (text) => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map(line => {
      if (!line.trim()) return null;
      // Handle simple CSV splitting (warning: doesn't handle commas inside quotes perfectly without a library)
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    }).filter(row => row !== null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const jsonData = parseCSV(text);
        
        // Normalize data
        const mappedData = jsonData.map(row => ({
            full_name: row['Name'] || row['name'] || row['שם'] || row['שם מלא'] || row['Full Name'] || '',
            phone_number: row['Phone'] || row['phone'] || row['טלפון'] || row['נייד'] || row['Mobile'] || '',
            city: row['City'] || row['city'] || row['עיר'] || '',
            email: row['Email'] || row['email'] || row['אימייל'] || '',
            lead_status: 'New',
            source_year: new Date().getFullYear().toString()
        })).filter(r => r.full_name); // Filter out empty rows

        if (mappedData.length === 0) {
            alert("לא נמצאו נתונים תקינים בקובץ. וודא שזהו קובץ CSV תקין.");
            return;
        }

        setData(mappedData);
        setStep(2);
      } catch (err) {
        console.error(err);
        alert("שגיאה בקריאת הקובץ");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
      setImporting(true);
      let successCount = 0;
      
      for (const row of data) {
          try {
              await base44.entities.Lead.create(row);
              successCount++;
          } catch (e) {
              console.error("Error importing row", row, e);
          }
      }

      setImporting(false);
      alert(`הייבוא הושלם! ${successCount} לידים נוספו.`);
      navigate('/Leads');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-10 font-sans text-slate-900" dir="rtl">
        
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">ייבוא לידים (CSV)</h1>
            <p className="text-slate-500">העלה קובץ CSV כדי להוסיף לידים למערכת</p>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
            <div className="border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-slate-50 rounded-3xl p-20 text-center transition-all relative">
                <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">בחר קובץ CSV</h3>
                <p className="text-slate-500">לחץ כאן להעלאת קובץ מהמחשב</p>
                <div className="mt-4 text-xs text-slate-400">
                    פורמט מומלץ: שם מלא, טלפון, עיר, אימייל
                </div>
            </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
            <div className="space-y-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                נמצאו {data.length} רשומות לייבוא
                            </h3>
                            <Button onClick={() => setStep(1)} variant="outline">החלף קובץ</Button>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-slate-100 sticky top-0">
                                    <TableRow>
                                        <TableHead className="text-right">שם מלא</TableHead>
                                        <TableHead className="text-right">טלפון</TableHead>
                                        <TableHead className="text-right">עיר</TableHead>
                                        <TableHead className="text-right">אימייל</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.slice(0, 50).map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{row.full_name}</TableCell>
                                            <TableCell>{row.phone_number}</TableCell>
                                            <TableCell>{row.city}</TableCell>
                                            <TableCell>{row.email}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {data.length > 50 && <div className="p-4 text-center text-slate-500 border-t">ועוד {data.length - 50} רשומות...</div>}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)}>ביטול</Button>
                    <Button onClick={handleImport} disabled={importing} className="bg-red-700 hover:bg-red-800 text-white w-40">
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>ייבא נתונים <ArrowRight className="w-4 h-4 mr-2" /></>}
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
}