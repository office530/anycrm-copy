import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, Globe, User, Phone, Mail, ArrowLeft, Plus, Briefcase, Linkedin } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';
import ActivityLog from "@/components/crm/ActivityLog"; 

export default function ContactDetails() {
    const { theme } = useSettings();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const contactId = searchParams.get('id');

    const { data: contact, isLoading } = useQuery({
        queryKey: ['contact', contactId],
        queryFn: async () => {
            const res = await base44.entities.Contact.list({ id: contactId });
            return res[0];
        },
        enabled: !!contactId
    });

    const { data: company } = useQuery({
        queryKey: ['contact_company', contact?.company_id],
        queryFn: async () => {
             const res = await base44.entities.Company.list({ id: contact.company_id });
             return res[0];
        },
        enabled: !!contact?.company_id
    });

    const { data: opportunities } = useQuery({
        queryKey: ['contact_opportunities', contactId],
        queryFn: () => base44.entities.Opportunity.filter({ contact_id: contactId }),
        enabled: !!contactId
    });

    if (isLoading) return <div className="p-8 text-center">Loading contact...</div>;
    if (!contact) return <div className="p-8 text-center">Contact not found</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header */}
             <div className="flex flex-col md:flex-row gap-6 items-start">
                <Button variant="ghost" size="sm" asChild className="mb-4 md:mb-0">
                    <Link to={createPageUrl('Contacts')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts</Link>
                </Button>
            </div>

            <div className={`rounded-xl border shadow-sm p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <Avatar className="w-24 h-24">
                        <AvatarFallback className="text-2xl bg-teal-100 text-teal-700">{contact.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
                            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{contact.full_name}</h1>
                            <Badge variant={contact.status === 'Active' ? 'default' : 'secondary'}>{contact.status}</Badge>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                             <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{contact.job_title}</p>
                             {company && (
                                 <>
                                    <span className="text-slate-400">•</span>
                                    <Link to={createPageUrl(`CompanyProfile?id=${company.id}`)} className="flex items-center gap-1 text-blue-500 hover:underline">
                                        <Building2 className="w-4 h-4" />
                                        {company.name}
                                    </Link>
                                 </>
                             )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-2">
                             {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-500 transition-colors">
                                    <Mail className="w-4 h-4" />
                                    {contact.email}
                                </a>
                             )}
                             {contact.phone_number && (
                                <a href={`tel:${contact.phone_number}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-500 transition-colors">
                                    <Phone className="w-4 h-4" />
                                    {contact.phone_number}
                                </a>
                             )}
                             {contact.linkedin_profile && (
                                <a href={contact.linkedin_profile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                                    <Linkedin className="w-4 h-4" />
                                    LinkedIn Profile
                                </a>
                             )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Log Activity
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Company Info */}
                <div className="space-y-6 lg:col-span-1">
                    {company ? (
                         <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                            <CardHeader>
                                <CardTitle className={`text-lg ${theme === 'dark' ? 'text-white' : ''}`}>Company Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                        {company.logo_url ? (
                                            <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Building2 className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <Link to={createPageUrl(`CompanyProfile?id=${company.id}`)} className={`font-bold hover:underline ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            {company.name}
                                        </Link>
                                        <p className="text-sm text-slate-500">{company.industry}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                                     <div className="flex items-center gap-2 text-sm text-slate-500">
                                         <MapPin className="w-4 h-4" />
                                         {company.address || 'No address'}
                                     </div>
                                     <div className="flex items-center gap-2 text-sm text-slate-500">
                                         <Globe className="w-4 h-4" />
                                         {company.website || 'No website'}
                                     </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                            <CardContent className="p-6 text-center text-slate-500">
                                No company linked to this contact.
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="activity">
                        <TabsList className="mb-4">
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="activity">
                             <div className={`rounded-xl border p-4 min-h-[400px] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                <ActivityLog contactId={contactId} />
                            </div>
                        </TabsContent>

                        <TabsContent value="opportunities">
                            <div className={`rounded-xl border p-4 min-h-[400px] space-y-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                 <div className="flex justify-between items-center mb-2">
                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Related Deals</h3>
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
                                     <div className="text-center py-10 text-slate-500">No deals linked to this contact</div>
                                 )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}