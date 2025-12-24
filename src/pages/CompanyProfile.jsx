import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, Globe, Users, Phone, Mail, ArrowLeft, Plus, Briefcase, Contact, Activity } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';
import ActivityLog from "@/components/crm/ActivityLog"; 

export default function CompanyProfile() {
    const { theme } = useSettings();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const companyId = searchParams.get('id');

    const { data: company, isLoading } = useQuery({
        queryKey: ['company', companyId],
        queryFn: async () => {
            const res = await base44.entities.Company.list({ id: companyId });
            return res[0];
        },
        enabled: !!companyId
    });

    const { data: contacts } = useQuery({
        queryKey: ['company_contacts', companyId],
        queryFn: () => base44.entities.Contact.filter({ company_id: companyId }),
        enabled: !!companyId
    });

    const { data: opportunities } = useQuery({
        queryKey: ['company_opportunities', companyId],
        queryFn: () => base44.entities.Opportunity.filter({ company_id: companyId }),
        enabled: !!companyId
    });

    if (isLoading) return <div className="p-8 text-center">Loading profile...</div>;
    if (!company) return <div className="p-8 text-center">Company not found</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header */}
             <div className="flex flex-col md:flex-row gap-6 items-start">
                <Button variant="ghost" size="sm" asChild className="mb-4 md:mb-0">
                    <Link to={createPageUrl('Companies')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Companies</Link>
                </Button>
            </div>

            <div className={`rounded-xl border shadow-sm p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className={`w-24 h-24 rounded-xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="w-20 h-20 object-contain" />
                        ) : (
                            <Building2 className="w-10 h-10 text-slate-400" />
                        )}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
                            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{company.name}</h1>
                            {company.lifecycle_stage && <Badge>{company.lifecycle_stage}</Badge>}
                        </div>
                        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{company.description || "No description provided."}</p>
                        
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-2">
                             {company.industry && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <Briefcase className="w-4 h-4" />
                                    {company.industry}
                                </div>
                             )}
                             {company.address && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="w-4 h-4" />
                                    {company.address}
                                </div>
                             )}
                             {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline">
                                    <Globe className="w-4 h-4" />
                                    Website
                                </a>
                             )}
                             {company.phone_number && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <Phone className="w-4 h-4" />
                                    {company.phone_number}
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> New Opportunity
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stats / Info */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                        <CardHeader>
                            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-white' : ''}`}>At a Glance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500">Annual Revenue</span>
                                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {company.annual_revenue ? `$${company.annual_revenue.toLocaleString()}` : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500">Employees</span>
                                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {company.employees_count?.toLocaleString() || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500">Owner</span>
                                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {company.assigned_to || 'Unassigned'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                         <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-white' : ''}`}>Contacts</CardTitle>
                            <Button size="icon" variant="ghost" className="h-8 w-8"><Plus className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {contacts?.length > 0 ? (
                                contacts.map(contact => (
                                    <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{contact.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <Link to={createPageUrl(`ContactDetails?id=${contact.id}`)} className={`block font-medium truncate hover:underline ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                                {contact.full_name}
                                            </Link>
                                            <p className="text-xs text-slate-500 truncate">{contact.job_title}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">No contacts linked</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="activity">
                        <TabsList className="mb-4">
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="activity">
                             <div className={`rounded-xl border p-4 min-h-[400px] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                {/* Pass company_id to ActivityLog to filter by company */}
                                <ActivityLog companyId={companyId} />
                            </div>
                        </TabsContent>

                        <TabsContent value="opportunities">
                            <div className={`rounded-xl border p-4 min-h-[400px] space-y-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                 <div className="flex justify-between items-center mb-2">
                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Open Deals</h3>
                                    <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Deal</Button>
                                 </div>
                                 {opportunities?.length > 0 ? (
                                     opportunities.map(opp => (
                                         <div key={opp.id} className={`p-4 rounded-lg border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                             <div>
                                                 <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{opp.product_type}</h4>
                                                 <p className="text-sm text-slate-500">Stage: {opp.deal_stage}</p>
                                             </div>
                                             <div className="text-right">
                                                 <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>${opp.amount?.toLocaleString()}</div>
                                                 <p className="text-xs text-slate-500">Close: {opp.expected_close_date}</p>
                                             </div>
                                         </div>
                                     ))
                                 ) : (
                                     <div className="text-center py-10 text-slate-500">No active opportunities</div>
                                 )}
                            </div>
                        </TabsContent>
                         
                         <TabsContent value="notes">
                            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                                <CardContent className="p-6">
                                    <p className="text-slate-500 italic">Notes functionality coming soon...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}