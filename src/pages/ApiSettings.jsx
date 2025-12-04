import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Code, ArrowLeft, CheckCircle2, Globe, Lock, Zap, FileJson,
  Database, Send, TrendingUp, Calendar, Activity, BarChart3, AlertCircle
} from "lucide-react";

export default function ApiSettingsPage() {
  const baseUrl = window.location.origin;

  const apiEndpoints = [
    {
      category: "ניהול לידים",
      icon: Database,
      color: "bg-blue-100 text-blue-700",
      endpoints: [
        { method: "POST", path: "/createLeadFromApi", description: "יצירת ליד חדש", status: "active" },
        { method: "GET", path: "/getLeads", description: "קבלת רשימת לידים", status: "active" },
        { method: "GET", path: "/getLeadById", description: "קבלת ליד לפי ID", status: "active" },
        { method: "PATCH", path: "/updateLead", description: "עדכון ליד קיים", status: "active" }
      ]
    },
    {
      category: "ניהול הזדמנויות",
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
      endpoints: [
        { method: "GET", path: "/getOpportunities", description: "קבלת רשימת הזדמנויות", status: "active" },
        { method: "POST", path: "/createOpportunity", description: "יצירת הזדמנות חדשה", status: "active" },
        { method: "PATCH", path: "/updateOpportunityStage", description: "עדכון שלב עסקה", status: "active" }
      ]
    },
    {
      category: "משימות ופעילויות",
      icon: Calendar,
      color: "bg-purple-100 text-purple-700",
      endpoints: [
        { method: "GET", path: "/getTasks", description: "קבלת רשימת משימות", status: "active" },
        { method: "POST", path: "/createTask", description: "יצירת משימה חדשה", status: "active" },
        { method: "GET", path: "/getActivities", description: "קבלת פעילויות", status: "active" },
        { method: "POST", path: "/logActivity", description: "רישום פעילות", status: "active" }
      ]
    },
    {
      category: "דוחות וסטטיסטיקות",
      icon: BarChart3,
      color: "bg-orange-100 text-orange-700",
      endpoints: [
        { method: "GET", path: "/getStats", description: "קבלת KPIs ומדדים", status: "active" },
        { method: "GET", path: "/getConversionReport", description: "דוח המרות מפורט", status: "active" }
      ]
    }
  ];

  const methodColors = {
    GET: "bg-green-100 text-green-700 border-green-300",
    POST: "bg-blue-100 text-blue-700 border-blue-300",
    PATCH: "bg-orange-100 text-orange-700 border-orange-300",
    DELETE: "bg-red-100 text-red-700 border-red-300"
  };

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" className="mb-2 -mr-3">
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזרה להגדרות
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">API & חיבורים חיצוניים</h1>
          <p className="text-slate-600 mt-2">ניהול מלא של אינטגרציות ו-API endpoints</p>
        </div>
        <Link to={createPageUrl('ApiIntegration')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Code className="w-4 h-4 ml-2" />
            תיעוד API מלא
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">סך API Endpoints</p>
              <p className="text-2xl font-bold text-blue-700">13</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">פעילים</p>
              <p className="text-2xl font-bold text-emerald-700">13</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lock className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">אבטחה</p>
              <p className="text-sm font-semibold text-purple-700">ללא אימות</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Webhooks</p>
              <p className="text-sm font-semibold text-orange-700">בקרוב</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints by Category */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">API Endpoints זמינים</h2>
        
        {apiEndpoints.map((category, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardHeader className={`${category.color} border-b`}>
              <CardTitle className="flex items-center gap-3">
                <category.icon className="w-5 h-5" />
                {category.category}
              </CardTitle>
              <CardDescription className="text-slate-700">
                {category.endpoints.length} endpoints זמינים
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {category.endpoints.map((endpoint, endIdx) => (
                  <div key={endIdx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Badge className={`${methodColors[endpoint.method]} font-mono text-xs border px-2 py-1`}>
                          {endpoint.method}
                        </Badge>
                        <div className="flex-1">
                          <code className="text-sm font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                          <p className="text-sm text-slate-600 mt-1">{endpoint.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {endpoint.status === 'active' && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            פעיל
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">הערת אבטחה</h3>
            <p className="text-sm text-amber-800">
              כרגע ה-API פתוח ללא אימות. מומלץ להוסיף מנגנון אימות (API Keys / OAuth) לפני שימוש בסביבת ייצור.
              ניתן להוסיף header של X-API-Key או JWT token לאבטחה מתקדמת.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            אינטגרציות מומלצות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">Zapier / Make</h4>
              <p className="text-sm text-slate-600 mb-3">חבר אוטומטית את המערכת למאות אפליקציות</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">מומלץ</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">Google Sheets</h4>
              <p className="text-sm text-slate-600 mb-3">ייצוא נתונים אוטומטי לגיליון אלקטרוני</p>
              <Badge variant="outline">בקרוב</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">WhatsApp Business API</h4>
              <p className="text-sm text-slate-600 mb-3">שליחת הודעות אוטומטיות ללקוחות</p>
              <Badge variant="outline">בקרוב</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">SendGrid / Mailchimp</h4>
              <p className="text-sm text-slate-600 mb-3">סנכרון לידים ממערכות דיוור</p>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">זמין</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}