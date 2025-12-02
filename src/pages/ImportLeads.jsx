import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  XCircle,
  RefreshCw,
  Download
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Utility for simple CSV generation
const downloadCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function ImportLeadsPage() {
  // Steps: upload -> preview (validate) -> processing -> report
  const [step, setStep] = useState('upload'); 
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, skipped: 0, total: 0 });
  const [failedRows, setFailedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // --- STEP 1: UPLOAD & EXTRACT ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startExtraction = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      // 1. Upload File
      const uploadRes = await base44.integrations.Core.UploadFile({ file: file });
      if (!uploadRes || !uploadRes.file_url) throw new Error("File upload failed");

      // 2. Extract Data using AI Schema
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            phone_number: { type: "string" },
            age: { type: "number" },
            email: { type: "string" },
            city: { type: "string" },
            notes: { type: "string" },
            estimated_property_value: { type: "number" },
            last_contact_date: { type: "string" },
            // AI Fields
            main_pain_point: { 
                type: "string", 
                enum: ["Debt Consolidation (סגירת חובות/מינוס)", "Family Assistance (עזרה למשפחה)", "Help Children Buy Apartment (עזרה לילדים לדירה)", "Supplement Monthly Income (השלמת הכנסה חודשית)"]
            },
            current_objection: { 
                type: "string", 
                enum: ["High Interest/Timing", "Not Interested", "Other"]
            }
          },
          required: ["full_name", "phone_number"]
        }
      };

      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: schema
      });

      if (extractRes.status !== 'success' || !extractRes.output) {
        throw new Error(extractRes.details || "Data extraction failed");
      }

      // Normalize data
      const rawData = Array.isArray(extractRes.output) ? extractRes.output : (extractRes.output.leads || []);
      
      // Initial Validation
      const validatedData = rawData.map((row, index) => {
        const errors = [];
        // Phone validation (Basic Israeli check)
        const phoneClean = row.phone_number?.replace(/\D/g, '') || '';
        if (!phoneClean || phoneClean.length < 9) errors.push("מספר טלפון לא תקין");
        
        // Required fields
        if (!row.full_name) errors.push("חסר שם מלא");

        return {
          ...row,
          _id: index, // temp id for UI
          _status: errors.length === 0 ? 'valid' : 'invalid',
          _errors: errors,
          _selected: errors.length === 0 // Auto-select valid ones
        };
      });

      setExtractedData(validatedData);
      setStep('preview');

    } catch (err) {
      console.error(err);
      alert("שגיאה בתהליך הטעינה: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- STEP 2: PREVIEW & EDIT ---
  const toggleRowSelection = (id) => {
    setExtractedData(prev => prev.map(row => 
      row._id === id ? { ...row, _selected: !row._selected } : row
    ));
  };

  const updateRowData = (id, field, value) => {
    setExtractedData(prev => prev.map(row => {
        if (row._id === id) {
            const updated = { ...row, [field]: value };
            // Re-validate simpler logic
            const errors = [];
            const phoneClean = updated.phone_number?.replace(/\D/g, '') || '';
            if (!phoneClean || phoneClean.length < 9) errors.push("מספר טלפון לא תקין");
            if (!updated.full_name) errors.push("חסר שם מלא");
            
            return { 
                ...updated, 
                _status: errors.length === 0 ? 'valid' : 'invalid',
                _errors: errors,
                _selected: errors.length === 0 // Auto select if fixed
            };
        }
        return row;
    }));
  };

  // --- STEP 3: SAVE TO DB ---
  const executeImport = async () => {
    const rowsToImport = extractedData.filter(r => r._selected);
    if (rowsToImport.length === 0) return;

    setStep('processing');
    setIsProcessing(true);
    setImportStats({ success: 0, failed: 0, skipped: extractedData.length - rowsToImport.length, total: rowsToImport.length });
    setFailedRows([]);

    const chunkSize = 20; // Small chunks for better progress updates
    let successCount = 0;
    let failCount = 0;
    const fails = [];

    for (let i = 0; i < rowsToImport.length; i += chunkSize) {
      const chunk = rowsToImport.slice(i, i + chunkSize);
      
      try {
        // Prepare chunk for DB (remove internal flags)
        const cleanChunk = chunk.map(({ _id, _status, _errors, _selected, ...rest }) => ({
            ...rest,
            source_year: "2023", // Default
            lead_status: "New",
            lead_temperature: "Cold (קר)"
        }));

        // Check duplicates logic could go here (query by phone), 
        // but for bulk performance we'll just try insert. 
        // Base44 bulkCreate doesn't error on dupes usually unless ID matches, 
        // but we don't have IDs yet. 
        // Real-world: ideally we check each phone. 
        
        // Optimistic Bulk Create
        await base44.entities.Lead.bulkCreate(cleanChunk);
        
        successCount += chunk.length;
      } catch (err) {
        console.error("Chunk failed", err);
        failCount += chunk.length;
        fails.push(...chunk.map(r => ({ ...r, error: "שגיאת שמירה (DB Error)" })));
      }

      // Update Progress
      setImportStats(prev => ({ ...prev, success: successCount, failed: failCount }));
      setProcessingProgress(Math.round(((i + chunkSize) / rowsToImport.length) * 100));
    }

    setFailedRows(fails);
    setStep('report');
    setIsProcessing(false);
  };

  // --- RENDER HELPERS ---
  const renderStatusBadge = (status, errors) => {
    if (status === 'valid') return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">תקין</Badge>;
    return (
        <div className="flex flex-col gap-1">
            <Badge variant="destructive">שגיאה</Badge>
            <span className="text-[10px] text-red-500">{errors[0]}</span>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg border shadow-sm">
                <UploadCloud className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">אשף ייבוא לידים</h1>
                <p className="text-slate-500 text-sm">ייבוא קבצי אקסל/CSV, בדיקת תקינות ומיפוי חכם</p>
            </div>
          </div>
          <Link to={createPageUrl('Leads')}>
            <Button variant="outline" size="sm">
                <ArrowRight className="w-4 h-4 ml-2" />
                חזרה למאגר
            </Button>
          </Link>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>1</div>
                <div className="h-1 w-12 bg-slate-200"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                <div className="h-1 w-12 bg-slate-200"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'processing' || step === 'report' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
            </div>
        </div>

        {/* --- VIEW: UPLOAD --- */}
        {step === 'upload' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>העלאת קובץ נתונים</CardTitle>
                <CardDescription>המערכת תנתח את הקובץ ותבצע מיפוי שדות אוטומטי (AI)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                    className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".csv, .xlsx, .xls, .pdf"
                        onChange={handleFileChange}
                    />
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UploadCloud className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">
                        {file ? file.name : "לחץ לבחירת קובץ"}
                    </h3>
                    <p className="text-slate-400 text-sm mt-2">תומך בקבצי Excel, CSV ו-PDF</p>
                </div>

                {isProcessing ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">מנתח קובץ ומבצע מיפוי חכם...</span>
                        </div>
                        <p className="text-xs text-center text-slate-400">זה עשוי לקחת דקה, אנא המתן</p>
                    </div>
                ) : (
                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 py-6" 
                        disabled={!file}
                        onClick={startExtraction}
                    >
                        המשך לשלב הבא <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                )}
            </CardContent>
          </Card>
        )}

        {/* --- VIEW: PREVIEW --- */}
        {step === 'preview' && (
          <Card className="border-none shadow-none bg-transparent">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="font-bold text-slate-800">סקירת נתונים ואימות</h2>
                        <p className="text-sm text-slate-500">נמצאו {extractedData.length} רשומות. אנא וודא שהנתונים תקינים לפני השמירה.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep('upload')}>ביטול</Button>
                        <Button onClick={executeImport} className="bg-emerald-600 hover:bg-emerald-700">
                            <Save className="w-4 h-4 ml-2" />
                            שמור {extractedData.filter(r => r._selected).length} לידים
                        </Button>
                    </div>
                </div>
                
                <div className="overflow-auto max-h-[600px]">
                    <Table>
                        <TableHeader className="bg-slate-100 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[50px]">ייבוא?</TableHead>
                                <TableHead className="w-[100px]">סטטוס</TableHead>
                                <TableHead>שם מלא</TableHead>
                                <TableHead>טלפון</TableHead>
                                <TableHead>עיר</TableHead>
                                <TableHead>שווי נכס</TableHead>
                                <TableHead>הערות / תובנות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {extractedData.map((row) => (
                                <TableRow key={row._id} className={!row._selected ? 'opacity-50 bg-slate-50' : ''}>
                                    <TableCell>
                                        <input 
                                            type="checkbox" 
                                            checked={row._selected} 
                                            onChange={() => toggleRowSelection(row._id)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </TableCell>
                                    <TableCell>{renderStatusBadge(row._status, row._errors)}</TableCell>
                                    <TableCell>
                                        <Input 
                                            value={row.full_name || ''} 
                                            onChange={(e) => updateRowData(row._id, 'full_name', e.target.value)}
                                            className="h-8 text-sm" 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={row.phone_number || ''} 
                                            onChange={(e) => updateRowData(row._id, 'phone_number', e.target.value)}
                                            className={`h-8 text-sm ${row._errors.includes("מספר טלפון לא תקין") ? 'border-red-300 bg-red-50' : ''}`}
                                        />
                                    </TableCell>
                                    <TableCell>{row.city || '-'}</TableCell>
                                    <TableCell>{row.estimated_property_value ? `₪${row.estimated_property_value.toLocaleString()}` : '-'}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={row.notes}>
                                        {row.main_pain_point && <Badge variant="outline" className="ml-1 text-xs">{row.main_pain_point.split(' ')[0]}</Badge>}
                                        <span className="text-xs text-slate-500">{row.notes}</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
          </Card>
        )}

        {/* --- VIEW: PROCESSING --- */}
        {step === 'processing' && (
            <Card className="max-w-md mx-auto text-center py-10">
                <CardContent className="space-y-6">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">מבצע ייבוא...</h2>
                        <p className="text-slate-500">שומר נתונים במסד הנתונים ({importStats.success} / {importStats.total})</p>
                    </div>
                    <Progress value={processingProgress} className="w-full h-2" />
                </CardContent>
            </Card>
        )}

        {/* --- VIEW: REPORT --- */}
        {step === 'report' && (
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader className="text-center border-b bg-slate-50/50 pb-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl text-emerald-800">התהליך הסתיים!</CardTitle>
                        <CardDescription>סיכום תוצאות הייבוא</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="grid grid-cols-3 gap-4 text-center mb-8">
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="text-3xl font-bold text-emerald-600">{importStats.success}</div>
                                <div className="text-sm text-emerald-800">רשומות נוצרו בהצלחה</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <div className="text-3xl font-bold text-red-600">{importStats.failed}</div>
                                <div className="text-sm text-red-800">שגיאות</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="text-3xl font-bold text-gray-600">{importStats.skipped}</div>
                                <div className="text-sm text-gray-800">דולגו (לא תקינים/לא נבחרו)</div>
                            </div>
                        </div>

                        {failedRows.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    פירוט שגיאות
                                </h3>
                                <div className="bg-red-50 p-4 rounded border border-red-100 max-h-40 overflow-y-auto text-sm">
                                    {failedRows.map((fail, i) => (
                                        <div key={i} className="text-red-800 border-b border-red-100 last:border-0 py-1">
                                            <strong>{fail.full_name}:</strong> {fail.error || "שגיאה לא ידועה"}
                                        </div>
                                    ))}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    className="text-red-600 mt-2 h-8"
                                    onClick={() => downloadCSV(failedRows, 'import_errors.csv')}
                                >
                                    <Download className="w-3 h-3 ml-2" />
                                    הורד דוח שגיאות CSV
                                </Button>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <Link to={createPageUrl('Leads')}>
                                <Button className="bg-blue-600 hover:bg-blue-700 w-40">
                                    עבור ללידים
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={() => {
                                setStep('upload');
                                setFile(null);
                                setExtractedData([]);
                            }}>
                                <RefreshCw className="w-4 h-4 ml-2" />
                                ייבוא קובץ נוסף
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

      </div>
    </div>
  );
}