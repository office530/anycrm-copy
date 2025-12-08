import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Upload, FileImage, Type, Camera, CheckCircle2, Edit3, ArrowRight, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/components/context/SettingsContext";

export default function AiLeadImport({ open, onOpenChange, onLeadCreated }) {
  const { theme } = useSettings();
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState("text"); // text or image
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const processTextInput = async () => {
    if (!input.trim() && !selectedFile) return;

    setIsProcessing(true);
    try {
      let textToAnalyze = input;

      // אם זו תמונה, נחלץ תחילה את הטקסט
      if (mode === "image" && selectedFile) {
        // העלאת התמונה
        const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
        const fileUrl = uploadResult.file_url;

        // חילוץ מידע ישירות מהתמונה עם AI Vision
        const visionResult = await base44.integrations.Core.InvokeLLM({
          prompt: `ניתוח צילום מסך של מערכת CRM/סיילספורס (צולם בטלפון):
אנא סרוק את התמונה בקפידה וחלץ את פרטי הליד. התמונה עשויה להיות צילום מסך של מערכת ניהול לקוחות.

עליך לחלץ במדויק:
1. שם מלא (Full Name) - חפש בראש הכרטיס או בשדה שם.
2. טלפון (Phone) - בפורמט ישראלי (למשל 050-1234567).
3. אימייל (Email).
4. צורך/בקשת הלקוח (Customer Need) - חפש תיאור של מה הלקוח רוצה, מטרת ההלוואה, או סיבת הפנייה.
5. כל מידע נוסף (Notes) - סכם את *כל* שאר הנתונים המופיעים במסך (כתובת, ת"ז, גיל, סטטוס משפחתי, מצב פיננסי, הערות מערכת קודמות וכו') לתוך טקסט אחד מפורט.

דגשים:
- אם התמונה מטושטשת, נסה לפענח לפי ההקשר.
- אם יש מספר טלפונים, קח את הראשי.
- אל תמציא מידע שלא קיים.`,
          file_urls: [fileUrl],
          response_json_schema: {
            type: "object",
            properties: {
              full_name: { type: "string" },
              phone_number: { type: "string" },
              email: { type: "string" },
              customer_need: { type: "string", description: "The main need or reason for contact" },
              additional_info: { type: "string", description: "Summary of all other visible fields and data" }
            }
          }
        });

        // הכנת נתונים לתצוגה מקדימה
        const combinedNotes = [
          visionResult.customer_need ? `צורך/בקשה: ${visionResult.customer_need}` : null,
          visionResult.additional_info
        ].filter(Boolean).join("\n\n---\nמידע נוסף מהסריקה:\n");

        const leadData = {
          full_name: visionResult.full_name,
          phone_number: visionResult.phone_number,
          email: visionResult.email,
          notes: combinedNotes,
          lead_status: "New",
          source_year: new Date().getFullYear().toString(),
          last_contact_date: new Date().toISOString().split('T')[0]
        };

        setExtractedData(leadData);
        setPreviewMode(true);
        setIsProcessing(false);
        return; // Skip text analysis
      }

      // ניתוח הטקסט ע"י AI
      const leadSchema = {
        type: "object",
        properties: {
          full_name: { type: "string" },
          phone_number: { type: "string" },
          email: { type: "string" },
          customer_need: { type: "string" },
          additional_info: { type: "string" }
        },
        required: ["full_name", "phone_number"]
      };

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: `ניתוח טקסט של ליד (העתק-הדבק או טקסט חופשי):
חלץ את הפרטים הבאים מהטקסט:
1. שם מלא
2. טלפון
3. אימייל
4. צורך/בקשת הלקוח (מה הלקוח רוצה?)
5. כל שאר המידע - סכם אותו בצורה מסודרת לשדה additional_info.

הנה הטקסט לניתוח:
${textToAnalyze}`,
        response_json_schema: leadSchema
      });

      const combinedNotes = [
        aiResult.customer_need ? `צורך/בקשה: ${aiResult.customer_need}` : null,
        aiResult.additional_info
      ].filter(Boolean).join("\n\n---\nמידע נוסף:\n");

      // הכנת נתונים לתצוגה מקדימה
      const leadData = {
        full_name: aiResult.full_name,
        phone_number: aiResult.phone_number,
        email: aiResult.email,
        notes: combinedNotes,
        lead_status: "New",
        source_year: new Date().getFullYear().toString(),
        last_contact_date: new Date().toISOString().split('T')[0]
      };

      setExtractedData(leadData);
      setPreviewMode(true);
      setIsProcessing(false);

    } catch (error) {
      console.error("Error processing lead:", error);
      toast.error("שגיאה בעיבוד הנתונים", {
        description: error.message,
        duration: 5000
      });
      setIsProcessing(false);
    }
  };

  const handleSaveLead = () => {
    onLeadCreated(extractedData);
    toast.success("הליד נקלט בהצלחה!", {
      description: `${extractedData.full_name} • ${extractedData.phone_number}`,
      duration: 3000
    });
    
    // איפוס הטופס וסגירה
    setInput("");
    setSelectedFile(null);
    setPreviewMode(false);
    setExtractedData(null);
    onOpenChange(false);
  };

  const handleEditPreview = () => {
    setPreviewMode(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isProcessing && !previewMode) {
        onOpenChange(newOpen);
        setInput("");
        setSelectedFile(null);
        setExtractedData(null);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl" onPointerDownOutside={(e) => {
        if (isProcessing) {
          e.preventDefault();
        }
      }} onEscapeKeyDown={(e) => {
        if (isProcessing) {
          e.preventDefault();
        }
      }}>
        <AnimatePresence mode="wait">
          {!previewMode ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <div className="flex justify-between items-start">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        ייבוא ליד חכם עם AI
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600 -mt-2 -ml-2">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="preview" 
                      className="w-20 h-20 rounded-lg object-cover border-2 border-green-300"
                    />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-green-800">✓ {selectedFile.name}</p>
                    <p className="text-xs text-green-600 mt-1">התמונה מוכנה לסריקה עם AI Vision</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-600 hover:bg-red-50 mt-2 h-7"
                    >
                      הסר תמונה
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 text-center shadow-sm"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-blue-600" />
            <p className="text-base font-bold text-blue-900 mb-2">מעבד את הנתונים...</p>
            <p className="text-sm text-blue-700">
              {mode === "image" ? "🔍 AI Vision סורק את התמונה ומחלץ את כל הפרטים" : "🤖 AI מנתח את הטקסט"}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </motion.div>
        )}

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
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
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
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                בדוק את הפרטים שזוהו
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-2">
                ה-AI חילץ את המידע הבא - ערוך אם צריך ושמור
              </p>
            </DialogHeader>

            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">שם מלא *</label>
                  <Input
                    value={extractedData?.full_name || ""}
                    onChange={(e) => setExtractedData({...extractedData, full_name: e.target.value})}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">טלפון *</label>
                  <Input
                    value={extractedData?.phone_number || ""}
                    onChange={(e) => setExtractedData({...extractedData, phone_number: e.target.value})}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">אימייל</label>
                  <Input
                    value={extractedData?.email || ""}
                    onChange={(e) => setExtractedData({...extractedData, email: e.target.value})}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">עיר</label>
                  <Input
                    value={extractedData?.city || ""}
                    onChange={(e) => setExtractedData({...extractedData, city: e.target.value})}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">גיל</label>
                  <Input
                    type="number"
                    value={extractedData?.age || ""}
                    onChange={(e) => setExtractedData({...extractedData, age: parseInt(e.target.value)})}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">מצב משפחתי</label>
                  <Input
                    value={extractedData?.marital_status || ""}
                    onChange={(e) => setExtractedData({...extractedData, marital_status: e.target.value})}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>

              {extractedData?.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">הערות</label>
                  <Textarea
                    value={extractedData.notes}
                    onChange={(e) => setExtractedData({...extractedData, notes: e.target.value})}
                    className="border-purple-200 focus:border-purple-500"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleEditPreview}
                  className="flex-1"
                >
                  <Edit3 className="w-4 h-4 ml-2" />
                  חזור לעריכה
                </Button>
                <Button
                  onClick={handleSaveLead}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  שמור ליד
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        </DialogContent>
        </Dialog>
        );
        }