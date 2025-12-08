import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BrainCircuit, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AiInsights() {
  const [insights, setInsights] = React.useState(null);
  const [isLoadingAI, setIsLoadingAI] = React.useState(false);

  // Fetch data for analysis
  const { data: leads } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list() });
  const { data: opportunities } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list() });

  const generateInsights = async () => {
    if (!leads || !opportunities) return;
    setIsLoadingAI(true);

    try {
      // Prepare aggregated data anonymously to save tokens and privacy
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.lead_status === 'Converted' || l.lead_status === 'Converted to Opportunity').length;
      const leadsByCity = {};
      const leadsBySource = {};
      
      leads.forEach(l => {
        if (l.city) leadsByCity[l.city] = (leadsByCity[l.city] || 0) + 1;
        if (l.source_year) leadsBySource[l.source_year] = (leadsBySource[l.source_year] || 0) + 1;
      });

      const wonOpps = opportunities.filter(o => o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה'));
      const lostOpps = opportunities.filter(o => o.deal_stage?.includes('Lost') || o.deal_stage?.includes('אבוד'));
      
      const analysisPayload = {
        stats: {
          totalLeads,
          convertedLeads,
          conversionRate: (convertedLeads / totalLeads * 100).toFixed(1),
          wonCount: wonOpps.length,
          lostCount: lostOpps.length,
        },
        distributions: {
          city_top5: Object.entries(leadsByCity).sort((a,b) => b[1]-a[1]).slice(0, 5),
          source: leadsBySource
        }
      };

      const prompt = `
        You are a senior CRM data analyst. Analyze the following sales data and provide insights in English.
        Data: ${JSON.stringify(analysisPayload)}
        
        Provide a JSON response with:
        1. "key_factors": List of 3 main factors likely influencing conversion (based on general knowledge + data).
        2. "recommendations": List of 3 strategic recommendations for the sales manager.
        3. "trend_analysis": A short paragraph summarizing the current health of the pipeline.
        
        Return JSON format only:
        {
          "key_factors": ["string", "string", "string"],
          "recommendations": ["string", "string", "string"],
          "trend_analysis": "string"
        }
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                key_factors: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                trend_analysis: { type: "string" }
            }
        }
      });

      setInsights(result);
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            Conversion Analysis (AI)
          </h2>
          <p className="text-indigo-700/80 mt-1">
            The system will scan all leads and opportunities to identify hidden patterns and recommend improvements.
          </p>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={isLoadingAI || !leads}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          size="lg"
        >
          {isLoadingAI ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lightbulb className="w-5 h-5 mr-2" />}
          {insights ? 'Refresh Insights' : 'Generate New Insights'}
        </Button>
      </div>

      {isLoadingAI && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {!isLoadingAI && insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Trend Analysis */}
          <Card className="md:col-span-3 border-indigo-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                General Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 leading-relaxed">
                {insights.trend_analysis}
              </p>
            </CardContent>
          </Card>

          {/* Key Factors */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                Key Influencing Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.key_factors?.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5">{i+1}</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-l-4 border-l-emerald-500 shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {insights.recommendations?.map((rec, i) => (
                  <div key={i} className="flex gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                     <div className="mt-1">
                       <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                         {i+1}
                       </div>
                     </div>
                     <p className="text-slate-800 font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!isLoadingAI && !insights && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Click the button above to start the AI engine</p>
        </div>
      )}
    </div>
  );
}