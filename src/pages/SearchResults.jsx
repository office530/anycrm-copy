import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Search, User, Briefcase, Phone, MapPin, Calendar, ArrowRight, 
    Loader2, Filter, ChevronLeft, ExternalLink
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function SearchResultsPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get('q') || '';
    
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState("all");

    // Update local state if URL changes
    useEffect(() => {
        setSearchTerm(initialQuery);
    }, [initialQuery]);

    const { data: results, isLoading } = useQuery({
        queryKey: ['fullSearch', searchTerm],
        queryFn: async () => {
            if (!searchTerm) return { leads: [], opportunities: [] };
            
            // Parallel fetch of all data
            const [leads, opportunities] = await Promise.all([
                base44.entities.Lead.list(),
                base44.entities.Opportunity.list()
            ]);

            const lowerTerm = searchTerm.toLowerCase().trim();
            const searchParts = lowerTerm.split(' ').filter(p => p.length > 0);

            // Smart Search Logic
            // 1. Exact matches get priority? (Not easily doable with simple filter, but we can filter broadly)
            // 2. Partial matches on multiple fields
            
            const filterItem = (item, fields) => {
                if (!lowerTerm) return true;
                // Check if ANY part of the search term is in ANY of the fields
                return searchParts.every(part => 
                    fields.some(field => 
                        field && String(field).toLowerCase().includes(part)
                    )
                );
            };

            const filteredLeads = leads.filter(l => 
                filterItem(l, [
                    l.full_name, 
                    l.phone_number, 
                    l.email, 
                    l.city, 
                    l.notes,
                    ...(l.tags || [])
                ])
            );

            const filteredOpps = opportunities.filter(o => 
                filterItem(o, [
                    o.lead_name, 
                    o.product_type, 
                    o.deal_stage,
                    String(o.loan_amount_requested),
                    o.main_pain_point
                ])
            );

            return { leads: filteredLeads, opportunities: filteredOpps };
        },
        enabled: true, // Always run if mounted
        staleTime: 0 // Always fresh for search results
    });

    const totalResults = (results?.leads?.length || 0) + (results?.opportunities?.length || 0);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Update URL without reloading to keep history clean
        const newUrl = createPageUrl('SearchResults') + `?q=${encodeURIComponent(searchTerm)}`;
        window.history.pushState({}, '', newUrl);
        // React Query will refetch automatically because we're using searchTerm in queryKey
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 p-6 lg:p-10 font-sans text-slate-900" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header & Search Bar */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div>
                        <Link to={createPageUrl('Dashboard')} className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1 mb-2 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                            חזרה ללוח הבקרה
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">תוצאות חיפוש</h1>
                        <p className="text-slate-500 mt-1">
                            נמצאו {totalResults} תוצאות עבור "{searchTerm}"
                        </p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-12 pl-4 h-12 text-lg bg-white shadow-sm border-slate-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
                            placeholder="חיפוש מתקדם..."
                        />
                    </form>
                </div>

                {/* Results Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-600" />
                        <p className="text-lg">סורק את המאגר...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-white p-1 border border-slate-200 rounded-xl w-full md:w-auto inline-flex mb-6">
                            <TabsTrigger value="all" className="flex-1 md:flex-none px-6">הכל ({totalResults})</TabsTrigger>
                            <TabsTrigger value="leads" className="flex-1 md:flex-none px-6">לידים ({results?.leads?.length || 0})</TabsTrigger>
                            <TabsTrigger value="opportunities" className="flex-1 md:flex-none px-6">הזדמנויות ({results?.opportunities?.length || 0})</TabsTrigger>
                        </TabsList>

                        {totalResults === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">לא נמצאו תוצאות</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    נסה לחפש באמצעות מילות מפתח אחרות, או בדוק שגיאות כתיב.
                                    ניתן לחפש לפי שם, טלפון, עיר, או תגיות.
                                </p>
                                <Button 
                                    variant="link" 
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 text-red-600"
                                >
                                    נקה חיפוש
                                </Button>
                            </div>
                        )}

                        {/* Leads Results */}
                        <TabsContent value="all" className="space-y-8">
                            {results?.leads?.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-500" />
                                            לידים
                                        </h2>
                                        {activeTab === 'all' && results.leads.length > 3 && (
                                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('leads')} className="text-slate-500 hover:text-blue-600">
                                                הצג את כל ה-{results.leads.length}
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(activeTab === 'all' ? results.leads.slice(0, 6) : results.leads).map(lead => (
                                            <LeadResultCard key={lead.id} lead={lead} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {results?.opportunities?.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-purple-500" />
                                            הזדמנויות
                                        </h2>
                                        {activeTab === 'all' && results.opportunities.length > 3 && (
                                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('opportunities')} className="text-slate-500 hover:text-purple-600">
                                                הצג את כל ה-{results.opportunities.length}
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(activeTab === 'all' ? results.opportunities.slice(0, 6) : results.opportunities).map(opp => (
                                            <OpportunityResultCard key={opp.id} opp={opp} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </TabsContent>

                        <TabsContent value="leads">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results?.leads?.map(lead => (
                                    <LeadResultCard key={lead.id} lead={lead} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="opportunities">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results?.opportunities?.map(opp => (
                                    <OpportunityResultCard key={opp.id} opp={opp} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}

function LeadResultCard({ lead }) {
    return (
        <Link to={createPageUrl(`LeadDetails?leadId=${lead.id}`)} className="group">
            <Card className="h-full hover:shadow-md transition-all border-slate-200 hover:border-red-200 group-hover:-translate-y-1">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                {lead.full_name?.charAt(0)}
                            </div>
                            <div>
                                <CardTitle className="text-base group-hover:text-blue-700 transition-colors">
                                    {lead.full_name}
                                </CardTitle>
                                <div className="text-xs text-slate-500 mt-0.5">{lead.lead_status}</div>
                            </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span dir="ltr">{lead.phone_number}</span>
                    </div>
                    {lead.city && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {lead.city}
                        </div>
                    )}
                    {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                            {lead.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 h-5 bg-slate-100 text-slate-600 font-normal">
                                    {tag}
                                </Badge>
                            ))}
                            {lead.tags.length > 3 && (
                                <span className="text-[10px] text-slate-400">+{lead.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

function OpportunityResultCard({ opp }) {
    return (
        <Link to={createPageUrl('Opportunities')} className="group">
            <Card className="h-full hover:shadow-md transition-all border-slate-200 hover:border-purple-200 group-hover:-translate-y-1">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base group-hover:text-purple-700 transition-colors">
                                    {opp.lead_name}
                                </CardTitle>
                                <div className="text-xs text-slate-500 mt-0.5">{opp.product_type}</div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-slate-50 font-normal border-slate-200">
                            {opp.deal_stage?.split('(')[0]}
                        </Badge>
                        <span className="font-bold text-slate-700">
                            {opp.loan_amount_requested ? `₪${opp.loan_amount_requested.toLocaleString()}` : ''}
                        </span>
                    </div>
                    {opp.probability && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                            <div 
                                className="bg-purple-500 h-1.5 rounded-full" 
                                style={{ width: `${opp.probability}%` }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}