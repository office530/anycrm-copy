import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from "lucide-react";

const SettingsContext = createContext();

// Defaults
export const defaultLeadStatuses = [
  { value: "New", label: "New", color: "bg-red-100 text-red-800 border border-red-200 font-medium" },
  { value: "Attempting Contact", label: "In Progress", color: "bg-neutral-200 text-neutral-800 border border-neutral-300 font-medium" },
  { value: "Contacted - Qualifying", label: "Qualifying", color: "bg-neutral-200 text-neutral-800 border border-neutral-300 font-medium" },
  { value: "Sales Ready", label: "Sales Ready", color: "bg-neutral-800 text-white border border-neutral-900 font-medium" },
  { value: "Converted", label: "Converted", color: "bg-red-700 text-white border border-red-800 font-medium shadow-sm" },
  { value: "Lost / Unqualified", label: "Lost / Unqualified", color: "bg-neutral-100 text-neutral-500 border border-neutral-200" }
];

export const defaultPipelineStages = [
  { 
    id: "New", 
    label: "New", 
    color: "bg-blue-400", 
    light: "bg-blue-50 text-blue-700",
    checklist: [{ id: "c1", text: "Verify Lead Details" }]
  },
  { 
    id: "Discovery", 
    label: "Discovery", 
    color: "bg-indigo-400", 
    light: "bg-indigo-50 text-indigo-700",
    checklist: [{ id: "c2", text: "Identify Needs" }]
  },
  { 
    id: "Proposal", 
    label: "Proposal", 
    color: "bg-purple-400", 
    light: "bg-purple-50 text-purple-700",
    checklist: [{ id: "c3", text: "Send Proposal" }]
  },
  { 
    id: "Negotiation", 
    label: "Negotiation", 
    color: "bg-amber-400", 
    light: "bg-amber-50 text-amber-700",
    checklist: []
  },
  { 
    id: "Closed Won", 
    label: "Closed Won", 
    color: "bg-emerald-500", 
    light: "bg-emerald-50 text-emerald-700",
    checklist: []
  },
  { 
    id: "Closed Lost", 
    label: "Closed Lost", 
    color: "bg-slate-300", 
    light: "bg-slate-50 text-slate-500",
    checklist: []
  }
];

export const defaultBranding = {
  companyName: "AnyCRM",
  logoUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69360168d7acf9f690aed166/e39b37d5e_Gemini_Generated_Image_lcefpdlcefpdlcef.png", 
  primaryColor: "red",
  currency: "₪"
};

export function SettingsProvider({ children }) {
  const queryClient = useQueryClient();

  // 1. Fetch Organization Settings from DB
  const { data: orgSettings, isLoading } = useQuery({
    queryKey: ['organization_settings'],
    queryFn: async () => {
      const res = await base44.entities.OrganizationSettings.list();
      if (res && res.length > 0) return res[0];
      
      // If no settings exist, create default
      const defaultSettings = {
        company_name: defaultBranding.companyName,
        logo_url: defaultBranding.logoUrl,
        primary_color: defaultBranding.primaryColor,
        currency: defaultBranding.currency,
        pipeline_stages: defaultPipelineStages,
        lead_statuses: defaultLeadStatuses,
        system_tags: ["VIP", "Hot Lead", "Referral", "Investor"]
      };
      
      try {
        const newSettings = await base44.entities.OrganizationSettings.create(defaultSettings);
        return newSettings;
      } catch (e) {
        console.error("Failed to init settings", e);
        return defaultSettings; // Fallback
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // 2. Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (newData) => {
        if (orgSettings?.id) {
            return base44.entities.OrganizationSettings.update(orgSettings.id, newData);
        }
        return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['organization_settings']);
    }
  });

  // 3. Derived State (for compatibility with existing components)
  const branding = {
    companyName: orgSettings?.company_name || defaultBranding.companyName,
    logoUrl: orgSettings?.logo_url || defaultBranding.logoUrl,
    primaryColor: orgSettings?.primary_color || defaultBranding.primaryColor,
    currency: orgSettings?.currency || defaultBranding.currency
  };

  const pipelineStages = orgSettings?.pipeline_stages || defaultPipelineStages;
  const leadStatuses = orgSettings?.lead_statuses || defaultLeadStatuses;
  const systemTags = orgSettings?.system_tags || [];

  // 4. Update Functions
  const updateBranding = (key, value) => {
    // Map frontend keys to DB keys
    const dbKeys = {
        companyName: 'company_name',
        logoUrl: 'logo_url',
        primaryColor: 'primary_color',
        currency: 'currency'
    };
    if (dbKeys[key]) {
        updateSettingsMutation.mutate({ [dbKeys[key]]: value });
    }
  };

  const setPipelineStages = (newStages) => {
    updateSettingsMutation.mutate({ pipeline_stages: newStages });
  };

  const setLeadStatuses = (newStatuses) => {
    updateSettingsMutation.mutate({ lead_statuses: newStatuses });
  };
  
  const updateStage = (index, field, value) => {
    const newStages = [...pipelineStages];
    newStages[index][field] = value;
    setPipelineStages(newStages);
  };

  const updateSystemTags = (newTags) => {
    updateSettingsMutation.mutate({ system_tags: newTags });
  };

  // Theme is still local for now as it's per user/device preference often, but could be moved to user settings
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <SettingsContext.Provider value={{ 
      branding, updateBranding, 
      leadStatuses, setLeadStatuses, 
      pipelineStages, setPipelineStages, updateStage,
      systemTags, updateSystemTags,
      theme, toggleTheme,
      isLoading,
      saveSettings: updateSettingsMutation.mutate
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);