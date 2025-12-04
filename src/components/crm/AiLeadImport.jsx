import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Upload, FileImage, Type, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AiLeadImport({ open, onOpenChange, onLeadCreated }) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState("text"); // text or image
  const [selectedFile, setSelectedFile] = useState(null);

  const processTextInput = async () => {
    if (!input.trim() && !selectedFile) return;

    setIsProcessing(true);
    try {
      let textToAnalyze = input;

      // אם זו תמונה, נחלץ תחילה את הטקסט
      if (mode === "image" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        // העלאת התמונה
        const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
        const fileUrl = uploadResult.file_url;

        // חילוץ טקסט מהתמונה
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: {
            type: "object",
            properties: {
              text: { type: "string", description: "כל הטקסט שנמצא בתמונה" }
            }
          }
        });

        if (extractResult.status === "success" && extractResult.output?.text) {
          textToAnalyze = extractResult.output.text;
        } else {
          throw new Error("לא הצלחתי לחלץ טקסט מהתמונה");
        }
      }

      // ניתוח הטקסט ע"י AI
      const leadSchema = {
        type: "object",
        properties: {
          full_name: { type: "string", description: "שם מלא של הליד" },
          phone_number: { type: "string", description: "מספר טלפון בפורמט ישראלי" },
          email: { type: "string", description: "כתובת אימייל" },
          age: { type: "number", description: "גיל הליד" },
          city: { type: "string", description: "עיר מגורים" },
          estimated_property_value: { type: "number", description: "שווי נכס משוער" },
          existing_mortgage_balance: { type: "number", description: "יתרת משכנתא קיימת" },
          marital_status: { 
            type: "string", 
            enum: ["Married", "Widowed", "Divorced", "Single"],
            description: "מצב משפחתי"
          },
          has_children: { type: "boolean", description: "האם יש ילדים" },
          spouse_age: { type: "number", description: "גיל בן/בת זוג" },
          notes: { type: "string", description: "כל מידע נוסף שלא מתאים לשדות אחרים" }
        },
        required: ["full_name", "phone_number"]
      };

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה עוזר חכם שמנתח מידע על לקוחות פוטנציאליים.
קבלת טקסט חופשי או מידע לא מובנה, ועליך לחלץ ממנו את הפרטים הבאים:
- שם מלא
- מספר טלפון
- אימייל
- גיל
- עיר
- שווי נכס משוער
- יתרת משכנתא
- מצב משפחתי (Married/Widowed/Divorced/Single)
- האם יש ילדים
- גיל בן/בת זוג

חשוב: 
1. אם לא מצאת שדה מסוים, אל תמציא - השאר אותו ריק/null
2. מספרי טלפון בפורמט ישראלי (050-1234567)
3. כל מידע נוסף שלא שייך לאף שדה - שים בשדה notes

הנה הטקסט לניתוח:
${textToAnalyze}`,
        response_json_schema: leadSchema
      });

      // יצירת הליד
      const leadData = {
        ...aiResult,
        lead_status: "New",
        source_year: new Date().getFullYear().toString(),
        last_contact_date: new Date().toISOString().split('T')[0]
      };

      onLeadCreated(leadData);
      
      // איפוס הטופס
      setInput("");
      setSelectedFile(null);
      onOpenChange(false);

    } catch (error) {
      console.error("Error processing lead:", error);
      alert("שגיאה בעיבוד הנתונים: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            ייבוא ליד חכם עם AI
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-2">
            הדבק טקסט חופשי או העלה תמונה, וה-AI יחלץ את הפרטים באופן אוטומטי
          </p>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              טקסט חופשי
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              סריקת תמונה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                הדבק כאן טקסט עם פרטי הליד
              </label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="לדוגמה:
דוד כהן, גיל 68, גר בתל אביב
טלפון: 050-1234567
נשוי, יש לו 3 ילדים
יש לו דירה ששווה בערך 3 מיליון
יש משכנתא של 500,000 שקל
מעוניין במשכנתא הפוכה כדי לעזור לילדים"
                className="h-64 resize-none font-mono text-sm"
                disabled={isProcessing}
              />
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* כפתור צילום ישיר */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-purple-300 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="camera-capture"
                  disabled={isProcessing}
                />
                <label htmlFor="camera-capture" className="cursor-pointer">
                  <Camera className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                  <p className="text-sm font-medium text-slate-700">צלם תמונה</p>
                  <p className="text-xs text-slate-500 mt-1">פתח מצלמה</p>
                </label>
              </div>

              {/* כפתור העלאת קובץ */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-purple-300 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                  <p className="text-sm font-medium text-slate-700">העלה תמונה</p>
                  <p className="text-xs text-slate-500 mt-1">בחר מהגלריה</p>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-800">✓ {selectedFile.name}</p>
                <p className="text-xs text-green-600 mt-1">התמונה מוכנה לעיבוד</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={processTextInput}
            disabled={isProcessing || (!input.trim() && !selectedFile)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מעבד...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                קלוט ליד
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}