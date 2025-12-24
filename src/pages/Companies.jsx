import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Search, Plus, ExternalLink, MapPin, Users } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';

export default function CompaniesPage() {
  const { theme } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    initialData: []
  });

  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Companies</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Manage your B2B accounts and organizations</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Company
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          <Input 
            placeholder="Search companies..." 
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
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Company Name</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Industry</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Location</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Employees</TableHead>
              <TableHead className={theme === 'dark' ? 'text-slate-300' : ''}>Website</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
               </TableRow>
            ) : filteredCompanies.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-10 text-slate-500">No companies found</TableCell>
               </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id} className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <Building2 className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                      </div>
                      <Link to={createPageUrl(`CompanyProfile?id=${company.id}`)} className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {company.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>{company.industry || '-'}</TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                    <div className="flex items-center gap-1">
                      {company.address && <MapPin className="w-3 h-3 text-slate-400" />}
                      {company.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                    <div className="flex items-center gap-1">
                      {company.employees_count && <Users className="w-3 h-3 text-slate-400" />}
                      {company.employees_count || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-sm">
                        {company.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={createPageUrl(`CompanyProfile?id=${company.id}`)}>View</Link>
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