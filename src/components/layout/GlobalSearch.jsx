import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Briefcase, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '@/components/context/SettingsContext';

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { branding } = useSettings();
  
  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Search Query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['globalSearch', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { leads: [], opportunities: [] };
      
      // We'll fetch all and filter in memory for this example as the SDK filter is exact match usually
      // Ideally we'd have a search endpoint, but listing and filtering is okay for small datasets
      const [leads, opportunities] = await Promise.all([
        base44.entities.Lead.list(),
        base44.entities.Opportunity.list()
      ]);

      const lowerTerm = searchTerm.toLowerCase();
      
      const filteredLeads = leads.filter(l => 
        l.full_name?.toLowerCase().includes(lowerTerm) || 
        l.phone_number?.includes(lowerTerm)
      ).slice(0, 5);

      const filteredOpps = opportunities.filter(o => 
        o.lead_name?.toLowerCase().includes(lowerTerm) ||
        o.product_type?.toLowerCase().includes(lowerTerm)
      ).slice(0, 5);

      return { leads: filteredLeads, opportunities: filteredOpps };
    },
    enabled: searchTerm.length >= 2,
    staleTime: 60000 // 1 min cache
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length >= 2) setIsOpen(true);
    else setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  const focusRing = `focus:ring-${branding?.primaryColor || 'teal'}-500/20`;

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      <div className="relative group">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none" />
        <input 
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          className={`bg-slate-50 dark:bg-slate-800 border-none rounded-full py-2.5 pr-10 pl-10 text-sm w-64 focus:w-80 transition-all focus:ring-2 ${focusRing} focus:bg-white dark:focus:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm`}
          placeholder="חיפוש לידים, עסקאות..."
        />
        {searchTerm && (
            <button onClick={clearSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
            </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (searchTerm.length >= 2) && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> מחפש...
            </div>
          ) : (
            <>
              {searchResults?.leads?.length === 0 && searchResults?.opportunities?.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                    לא נמצאו תוצאות עבור "{searchTerm}"
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto py-2">
                    {searchResults?.leads?.length > 0 && (
                        <div className="mb-2">
                            <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800/50 uppercase tracking-wider">
                                לידים
                            </div>
                            {searchResults.leads.map(lead => (
                                <Link 
                                    key={lead.id} 
                                    to={createPageUrl(`LeadDetails?leadId=${lead.id}`)}
                                    onClick={clearSearch}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{lead.full_name}</div>
                                        <div className="text-xs text-slate-500 truncate">{lead.phone_number}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    
                    {searchResults?.opportunities?.length > 0 && (
                        <div>
                            <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800/50 uppercase tracking-wider">
                                הזדמנויות
                            </div>
                            {searchResults.opportunities.map(opp => (
                                <Link 
                                    key={opp.id} 
                                    to={createPageUrl('Opportunities')} // Ideally should link to detail, but standard page is list
                                    onClick={clearSearch}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{opp.lead_name || 'עסקה ללא שם'}</div>
                                        <div className="text-xs text-slate-500 truncate">{opp.product_type} • {opp.deal_stage?.split('(')[0]}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}