import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, Copy, Check, ExternalLink, Zap, FileJson, Globe, 
  PlayCircle, AlertCircle, CheckCircle2
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ApiIntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the API endpoint URL (you'll need to replace this with actual function URL)
  const apiEndpoint = `${window.location.origin}/api/functions/createLeadFromApi`;
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testApiCall = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await base44.functions.invoke('createLeadFromApi', {
        full_name: "איש בדיקה",
        phone_number: "050-1234567",
        email: "test@example.com",
        city: "תל אביב",
        tags: ["API Test"]
      });
      
      setTestResult({
        success: true,
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "דוד כהן",
    "phone_number": "050-1234567",
    "email": "david@example.com",
    "city": "תל אביב",
    "age": 65,
    "source_year": "2025",
    "lead_status": "New",
    "tags": ["Mailchimp", "Newsletter"],
    "notes": "ליד שנוצר אוטומטית מדיוור"
  }'`;

  const pythonExample = `import requests

url = "${apiEndpoint}"
headers = {"Content-Type": "application/json"}

data = {
    "full_name": "דוד כהן",
    "phone_number": "050-1234567",
    "email": "david@example.com",
    "city": "תל אביב",
    "age": 65,
    "tags": ["Mailchimp"]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`;

  const jsExample = `const apiUrl = "${apiEndpoint}";

const leadData = {
  full_name: "דוד כהן",
  phone_number: "050-1234567",
  email: "david@example.com",
  city: "תל אביב",
  age: 65,
  tags: ["Mailchimp"]
};

fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(leadData)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`;

  const zapierExample = `1. צור Zap חדש ב-Zapier
2. בחר טריגר (לדוגמה: "New Subscriber in Mailchimp")
3. בחר Action: "Webhooks by Zapier" → "POST"
4. הזן URL: ${apiEndpoint}
5. הגדר Payload Type: JSON
6. מפה שדות:
   - full_name: {{subscriber_name}}
   - phone_number: {{subscriber_phone}}
   - email: {{subscriber_email}}
   - tags: ["Mailchimp", "Zapier"]`;

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">אינטגרציות API</h1>
          <p className="text-slate-600 mt-2">חבר מערכות חיצוניות ישירות למאגר הלידים שלך</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-2">
          <Zap className="w-4 h-4 ml-2" />
          פעיל
        </Badge>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Endpoint</p>
              <p className="font-mono text-xs text-blue-700 truncate">POST /createLeadFromApi</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileJson className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">פורמט</p>
              <p className="font-semibold text-purple-700">JSON</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">אימות</p>
              <p className="font-semibold text-emerald-700">לא נדרש</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="docs" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100">
          <TabsTrigger value="docs">יצירת לידים</TabsTrigger>
          <TabsTrigger value="opportunities">קבלת הזדמנויות</TabsTrigger>
          <TabsTrigger value="examples">דוגמאות קוד</TabsTrigger>
          <TabsTrigger value="test">בדיקה</TabsTrigger>
        </TabsList>

        {/* Create Lead Documentation Tab */}
        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Endpoint
              </CardTitle>
              <CardDescription>שלח ליד חדש למערכת באמצעות POST request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">URL</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={apiEndpoint} 
                    readOnly 
                    className="font-mono text-sm bg-slate-50"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(apiEndpoint)}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Method</label>
                <Badge className="mt-1 bg-blue-100 text-blue-700">POST</Badge>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Request Body (JSON)</label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "full_name": "string (חובה)",
  "phone_number": "string (חובה)",
  "email": "string (אופציונלי)",
  "city": "string (אופציונלי)",
  "age": "number (אופציונלי)",
  "source_year": "string (אופציונלי, ברירת מחדל: שנה נוכחית)",
  "lead_status": "string (אופציונלי, ברירת מחדל: 'New')",
  "tags": ["array (אופציונלי)"],
  "notes": "string (אופציונלי)",
  "marital_status": "string (אופציונלי)",
  "estimated_property_value": "number (אופציונלי)",
  "existing_mortgage_balance": "number (אופציונלי)",
  "has_children": "boolean (אופציונלי)",
  "spouse_age": "number (אופציונלי)"
}`}</pre>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Response (Success)</label>
                <div className="bg-emerald-900 text-emerald-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "success": true,
  "message": "Lead created successfully",
  "lead_id": "123",
  "data": { /* פרטי הליד */ }
}`}</pre>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Response (Error)</label>
                <div className="bg-red-900 text-red-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "error": "Missing required fields",
  "required": ["full_name", "phone_number"]
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Get Opportunities Documentation Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Get Opportunities API
              </CardTitle>
              <CardDescription>קבל נתוני הזדמנויות מהמערכת באמצעות GET request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">URL</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={`${window.location.origin}/api/functions/getOpportunities`}
                    readOnly 
                    className="font-mono text-sm bg-slate-50"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/functions/getOpportunities`)}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Method</label>
                <Badge className="mt-1 bg-green-100 text-green-700">GET</Badge>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Query Parameters (כולם אופציונליים)</label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`?deal_stage=<שלב_עסקה>
?lead_id=<מזהה_ליד>
?product_type=<סוג_מוצר>
?min_probability=<הסתברות_מינימלית>

דוגמה:
/getOpportunities?deal_stage=New&min_probability=50`}</pre>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Response (Success)</label>
                <div className="bg-emerald-900 text-emerald-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "123",
      "lead_id": "456",
      "lead_name": "דוד כהן",
      "product_type": "Reverse Mortgage",
      "deal_stage": "New (חדש)",
      "probability": 60,
      "loan_amount_requested": 500000,
      "expected_close_date": "2025-12-31",
      "created_date": "2025-12-01",
      ...
    }
  ]
}`}</pre>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">דוגמאות שימוש</label>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded">
                    <strong className="text-sm">כל ההזדמנויות:</strong>
                    <code className="block mt-1 text-xs text-slate-700">/getOpportunities</code>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <strong className="text-sm">הזדמנויות בשלב מסוים:</strong>
                    <code className="block mt-1 text-xs text-slate-700">/getOpportunities?deal_stage=Closed Won</code>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <strong className="text-sm">הזדמנויות עם הסתברות גבוהה:</strong>
                    <code className="block mt-1 text-xs text-slate-700">/getOpportunities?min_probability=70</code>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <strong className="text-sm">הזדמנויות של ליד ספציפי:</strong>
                    <code className="block mt-1 text-xs text-slate-700">/getOpportunities?lead_id=123</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-2">💡 בחר דוגמה</h3>
            <p className="text-sm text-blue-700">הדוגמאות כוללות גם יצירת לידים וגם קבלת הזדמנויות</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>cURL - יצירת ליד</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{curlExample}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(curlExample)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>cURL - קבלת הזדמנויות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`curl -X GET "${window.location.origin}/api/functions/getOpportunities?min_probability=50" \\
  -H "Content-Type: application/json"`}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(`curl -X GET "${window.location.origin}/api/functions/getOpportunities?min_probability=50"`)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JavaScript - יצירת ליד</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{jsExample}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(jsExample)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JavaScript - קבלת הזדמנויות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`const apiUrl = "${window.location.origin}/api/functions/getOpportunities";

// Get all opportunities
fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    console.log(\`נמצאו \${data.count} הזדמנויות\`);
    console.log(data.data);
  })
  .catch(err => console.error(err));

// Get with filters
const filters = new URLSearchParams({
  deal_stage: "New (חדש)",
  min_probability: 50
});

fetch(\`\${apiUrl}?\${filters}\`)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(`fetch("${window.location.origin}/api/functions/getOpportunities")...`)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Python - יצירת ליד</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{pythonExample}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(pythonExample)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Python - קבלת הזדמנויות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import requests

# Get all opportunities
url = "${window.location.origin}/api/functions/getOpportunities"
response = requests.get(url)
data = response.json()

print(f"נמצאו {data['count']} הזדמנויות")
for opp in data['data']:
    print(f"{opp['lead_name']} - {opp['product_type']} - ₪{opp.get('loan_amount_requested', 0):,}")

# Get with filters
params = {
    "deal_stage": "New (חדש)",
    "min_probability": 70
}
response = requests.get(url, params=params)
filtered_data = response.json()
print(filtered_data)`}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(`import requests\n\nurl = "${window.location.origin}/api/functions/getOpportunities"...`)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Zapier / Make Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap text-slate-700">{zapierExample}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                בדיקת API
              </CardTitle>
              <CardDescription>שלח קריאת בדיקה ליצירת ליד דמה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testApiCall} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "שולח..." : "שלח בקשת בדיקה"}
              </Button>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {testResult.success ? "הליד נוצר בהצלחה!" : "שגיאה"}
                    </span>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>שימושים מומלצים</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Mailchimp / SendGrid:</strong> שליחת לידים אוטומטית מדיוורים
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Facebook Lead Ads:</strong> ייבוא ישיר של לידים מפרסום
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Google Forms:</strong> שילוב עם טפסים חיצוניים
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Zapier / Make:</strong> אוטומציה מתקדמת בין מערכות
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}