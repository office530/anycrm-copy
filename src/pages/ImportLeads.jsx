import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // צריך להתקין או להשתמש ב-input רגיל
import * as XLSX from 'xlsx'; // npm install xlsx
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function ImportLeadsPage() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing
  const [data, setData] = useState([]);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  // 1. קריאת הקובץ
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      // נרמול נתונים (מיפוי ראשוני)
      const mappedData = jsonData.map(row => ({
          full_name: row['Name'] || row['name'] || row['שם'] || row['שם מלא'] || '',
          phone_number: row['Phone'] || row['phone'] || row['טלפון'] || row['נייד'] || '',
          city: row['City'] || row['city'] || row['עיר'] || '',
          lead_status: 'New', // ברירת מחדל
          source_year: new Date().getFullYear().toString()
      }));

      setData(mappedData);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] } 
  });

  // 2. ביצוע הייבוא
  const handleImport = async () => {
      setImporting(true);
      let successCount = 0;
      
      // אופציה א': שליחה במקביל (מהיר)
      // אופציה ב': אחד אחד (בטוח יותר) -> נלך על אחד אחד כדי לא להעמיס
      for (const row of data) {
          if (!row.full_name) continue; // דילוג על ריקים
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
            <h1 className="text-3xl font-bold text-slate-900">ייבוא לידים</h1>
            <p className="text-slate-500">העלה קובץ Excel או CSV כדי להוסיף לידים למערכת</p>
        </div>

        {/* שלב 1: העלאה */}
        {step === 1 && (
            <div {...getRootProps()} className={`
                border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all
                ${isDragActive ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-red-400 hover:bg-slate-50'}
            `}>
                <input {...getInputProps()} />
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">גרור קובץ לכאן</h3>
                <p className="text-slate-500">או לחץ כדי לבחור מהמחשב</p>
            </div>
        )}

        {/* שלב 2: תצוגה מקדימה */}
        {step === 2 && (
            <div className="space-y-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                נמצאו {data.length} רשומות
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
                                        <TableHead className="text-right">סטטוס</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.slice(0, 50).map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className={!row.full_name ? 'bg-red-50 text-red-600 font-bold' : ''}>
                                                {row.full_name || 'חסר שם!'}
                                            </TableCell>
                                            <TableCell>{row.phone_number}</TableCell>
                                            <TableCell>{row.city}</TableCell>
                                            <TableCell><span className="bg-slate-200 px-2 py-1 rounded text-xs">{row.lead_status}</span></TableCell>
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