import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

// ברירת מחדל - סטטוסים של לידים
export const defaultLeadStatuses = [
  { value: "New", label: "חדש", color: "bg-red-100 text-red-800 border border-red-200 font-medium" },
  { value: "Attempting Contact", label: "בטיפול", color: "bg-neutral-200 text-neutral-800 border border-neutral-300 font-medium" },
  { value: "Contacted - Qualifying", label: "בירור צרכים", color: "bg-neutral-200 text-neutral-800 border border-neutral-300 font-medium" },
  { value: "Sales Ready", label: "בשל למכירה", color: "bg-neutral-800 text-white border border-neutral-900 font-medium" },
  { value: "Converted", label: "הומר להזדמנות", color: "bg-red-700 text-white border border-red-800 font-medium shadow-sm" },
  { value: "Lost / Unqualified", label: "לא רלוונטי", color: "bg-neutral-100 text-neutral-500 border border-neutral-200" }
];

// ברירת מחדל - שלבי הזדמנויות
export const defaultPipelineStages = [
  { id: "New (חדש)", label: "חדש", color: "bg-red-400", light: "bg-red-50 text-red-700" },
  { id: "Discovery Call (שיחת בירור צרכים)", label: "בירור צרכים", color: "bg-orange-400", light: "bg-orange-50 text-orange-700" },
  { id: "Meeting Scheduled (נקבעת פגישה)", label: "נקבעת פגישה", color: "bg-amber-400", light: "bg-amber-50 text-amber-700" },
  { id: "Documents Collection (איסוף מסמכים)", label: "איסוף מסמכים", color: "bg-stone-400", light: "bg-stone-50 text-stone-700" },
  { id: "Request Sent to Harel (בקשה נשלחה להראל)", label: "נשלח להראל", color: "bg-neutral-400", light: "bg-neutral-50 text-neutral-700" },
  { id: "Closed Won (נחתם - בהצלחה)", label: "נסגר בהצלחה", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
  { id: "Closed Lost (אבוד)", label: "אבוד", color: "bg-neutral-300", light: "bg-neutral-50 text-neutral-500" }
];

export const defaultStages = defaultPipelineStages;

export const defaultBranding = {
  companyName: "Gishers",
  logoUrl: "", 
  primaryColor: "red",
  currency: "₪"
};

export function SettingsProvider({ children }) {
  // טעינת הגדרות מ-localStorage או שימוש בברירת מחדל
  const [branding, setBranding] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_branding')) || defaultBranding; } catch { return defaultBranding; }
  });

  const [leadStatuses, setLeadStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_lead_statuses')) || defaultLeadStatuses; } catch { return defaultLeadStatuses; }
  });

  const [pipelineStages, setPipelineStages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_pipeline_stages')) || defaultPipelineStages; } catch { return defaultPipelineStages; }
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_theme');
      return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });

  // אפקטים לשמירה ושינוי Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  useEffect(() => localStorage.setItem('crm_branding', JSON.stringify(branding)), [branding]);
  useEffect(() => localStorage.setItem('crm_lead_statuses', JSON.stringify(leadStatuses)), [leadStatuses]);
  useEffect(() => localStorage.setItem('crm_pipeline_stages', JSON.stringify(pipelineStages)), [pipelineStages]);

  // פונקציות עדכון
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const updateBranding = (key, value) => setBranding(prev => ({ ...prev, [key]: value }));
  
  return (
    <SettingsContext.Provider value={{ 
      branding, updateBranding, 
      leadStatuses, setLeadStatuses, 
      pipelineStages, setPipelineStages, 
      theme, toggleTheme 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);