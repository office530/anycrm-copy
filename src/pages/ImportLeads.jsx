import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, UploadCloud, FileText, ArrowRight } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ImportLeadsPage() {
  const [status, setStatus] = useState('idle'); // idle, processing, saving, success, error
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);

  const runImport = async () => {
    try {
      setStatus('processing');
      setLogs(prev => [...prev, "מתחיל ניתוח קובץ PDF... זה עשוי לקחת דקה או שתיים..."]);
      
      // Using the file provided by the user
      const fileUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692ea53ece3f48d4695254eb/3f21f7b82_xlsx-2023.pdf";
      
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            phone_number: { type: "string" },
            age: { type: "number" },
            last_contact_date: { type: "string" },
            notes: { type: "string", description: "Content of the 'Result' / 'תוצאה' column" },
            city: { type: "string", description: "Extract city from the notes text if present" },
            estimated_property_value: { type: "number", description: "Extract property value number from notes (e.g. 3.1M -> 3100000, 2.5M -> 2500000, K580 -> 580000)" },
            
            // AI Brain Fields
            main_pain_point: { 
                type: "string", 
                enum: [
                    "Debt Consolidation (סגירת חובות/מינוס)", 
                    "Family Assistance (עזרה למשפחה)",
                    "Help Children Buy Apartment (עזרה לילדים לדירה)"
                ], 
                description: "Analyze notes: If 'משכנתא'/'חוב'/'מינוס' -> 'Debt Consolidation (סגירת חובות/מינוס)'. If 'ילדים'/'בן'/'בת' -> 'Family Assistance (עזרה למשפחה)'. If specific help buying apartment -> 'Help Children Buy Apartment (עזרה לילדים לדירה)'." 
            },
            current_objection: { 
                type: "string", 
                enum: ["High Interest/Timing"], 
                description: "Analyze notes: If 'יקר'/'ריבית'/'לחכות' -> 'High Interest/Timing'." 
            }
          },
          required: ["full_name", "phone_number"]
        }
      };

      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: schema
      });

      if (res.status !== 'success' || !res.output) {
        throw new Error(res.details || "Extraction failed");
      }

      const extractedData = Array.isArray(res.output) ? res.output : res.output.leads || [];
      
      setLogs(prev => [...prev, `נמצאו ${extractedData.length} רשומות. מעבד ושומר...`]);
      setStatus('saving');
      
      // Clean and prepare data
      const validLeads = extractedData
        .filter(l => l.phone_number && l.full_name)
        .map(l => ({
         ...l,
         source_year: "2023",
         lead_status: "New",
         original_status_color: "Green", // Defaulting to Green as requested
         lead_temperature: "Cold (קר)" // Default, will be updated by logic later if needed
      }));

      if (validLeads.length === 0) {
          throw new Error("No valid leads found with phone numbers.");
      }

      // Insert in chunks to be safe
      const chunkSize = 50;
      for (let i = 0; i < validLeads.length; i += chunkSize) {
          const chunk = validLeads.slice(i, i + chunkSize);
          await base44.entities.Lead.bulkCreate(chunk);
          setLogs(prev => [...prev, `שמר ${Math.min(i + chunkSize, validLeads.length)} מתוך ${validLeads.length}...`]);
      }
      
      setCount(validLeads.length);
      setStatus('success');
      setLogs(prev => [...prev, "הייבוא הסתיים בהצלחה!"]);
      
    } catch (err) {
      console.error(err);
      setStatus('error');
      setLogs(prev => [...prev, `שגיאה: ${err.message}`]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-8 h-8 text-blue-600" />
                ייבוא לידים מתקדם (2023)
            </h1>
            <Link to={createPageUrl('Leads')}>
                <Button variant="outline">
                    חזרה ללידים <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
            </Link>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>מקור נתונים: קובץ PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p className="font-bold mb-2">הגדרות "המוח" (AI Brain):</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>זיהוי התנגדויות (יקר/ריבית) ← "High Interest/Timing"</li>
                        <li>זיהוי צורך (חוב/מינוס) ← "Debt Consolidation"</li>
                        <li>זיהוי משפחה (ילדים/בן/בת) ← "Family Assistance"</li>
                        <li>המרה אוטומטית של 3.1M ל-3,100,000 ₪</li>
                    </ul>
                </div>

                {status === 'idle' && (
                    <Button onClick={runImport} className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg">
                        <FileText className="w-5 h-5 ml-2" />
                        התחל ניתוח וייבוא נתונים
                    </Button>
                )}

                {status === 'processing' && (
                    <div className="text-center py-8 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                        <p className="text-lg font-medium text-slate-600">מנתח את הקובץ באמצעות AI...</p>
                        <p className="text-sm text-slate-400">זה עשוי לקחת מספר דקות, נא לא לסגור את החלון.</p>
                    </div>
                )}

                {status === 'saving' && (
                    <div className="text-center py-8 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
                        <p className="text-lg font-medium text-slate-600">שומר נתונים במערכת...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-700">הייבוא הושלם!</h3>
                        <p className="text-lg text-slate-600">נוספו {count} לידים חדשים למערכת.</p>
                        <Link to={createPageUrl('Leads')}>
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                עבור לרשימת הלידים
                            </Button>
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-red-700">שגיאה בייבוא</h3>
                        <p className="text-slate-600">אנא נסה שנית מאוחר יותר.</p>
                        <Button onClick={() => setStatus('idle')} variant="outline" className="mt-4">
                            נסה שוב
                        </Button>
                    </div>
                )}

                {logs.length > 0 && (
                    <div className="mt-6 bg-slate-900 text-slate-300 p-4 rounded-md text-xs font-mono max-h-40 overflow-y-auto" dir="ltr">
                        {logs.map((log, i) => (
                            <div key={i}>{`> ${log}`}</div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}