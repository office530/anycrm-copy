import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Contact, Search, Plus, Mail, Phone, Building2 } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';

export default function ContactsPage() {
  const { theme } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const contactsList = await base44.entities.Contact.list();
      return contactsList;
    },
    initialData: []
  });
  
  const { data: companies } = useQuery({
      queryKey: ['companies_lookup'],
      queryFn: () => base44.entities.Company.list(),
      initialData: []
  });

  const getCompanyName = (id) => {
      return companies.find(c => c.id === id)?.name || "Unknown Company";
  };

  const filteredContacts = contacts.filter(contact => 
    contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Contacts</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Directory of all people in your network</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Contact
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          <Input 
            placeholder="Search contacts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
          />
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Table>
          <TableHeader className={theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}>
            <TableRow className={theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Name</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Title</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Company</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Email</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
               </TableRow>
            ) : filteredContacts.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-10 text-slate-500">No contacts found</TableCell>
               </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id} className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>
                        {contact.full_name?.charAt(0) || <Contact className="w-4 h-4" />}
                      </div>
                      <Link to={createPageUrl(`ContactDetails?id=${contact.id}`)} className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {contact.full_name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>{contact.job_title || '-'}</TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                      <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {contact.company_id ? (
                              <Link to={createPageUrl(`CompanyProfile?id=${contact.company_id}`)} className="hover:underline">
                                  {getCompanyName(contact.company_id)}
                              </Link>
                          ) : '-'}
                      </div>
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                     <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {contact.email}
                     </div>
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                     {contact.phone_number && (
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {contact.phone_number}
                        </div>
                     )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={createPageUrl(`ContactDetails?id=${contact.id}`)}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}