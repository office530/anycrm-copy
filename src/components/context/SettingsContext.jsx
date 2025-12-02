import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

// ברירת מחדל - סטטוסים של לידים
export const defaultLeadStatuses = [
  { value: "New", label: "חדש", color: "bg-blue-100 text-blue-700" },
  { value: "Attempting Contact", label: "בטיפול", color: "bg-yellow-100 text-yellow-700" },
  { value: "Contacted - Qualifying", label: "בירור צרכים", color: "bg-orange-100 text-orange-700" },
  { value: "Sales Ready", label: "בשל למכירה", color: "bg-purple-100 text-purple-700" },
  { value: "Converted", label: "הומר להזדמנות", color: "bg-emerald-100 text-emerald-700" },
  { value: "Lost / Unqualified", label: "לא רלוונטי", color: "bg-gray-100 text-gray-600" }
];

// ברירת מחדל - שלבי הזדמנויות
export const defaultPipelineStages = [
  { id: "New (חדש)", label: "חדש", color: "bg-blue-500", light: "bg-blue-50 text-blue-700" },
  { id: "Discovery Call (שיחת בירור צרכים)", label: "בירור צרכים", color: "bg-indigo-500", light: "bg-indigo-50 text-indigo-700" },
  { id: "Meeting Scheduled (נקבעת פגישה)", label: "נקבעת פגישה", color: "bg-purple-500", light: "bg-purple-50 text-purple-700" },
  { id: "Documents Collection (איסוף מסמכים)", label: "איסוף מסמכים", color: "bg-orange-500", light: "bg-orange-50 text-orange-700" },
  { id: "Request Sent to Harel (בקשה נשלחה להראל)", label: "נשלח להראל", color: "bg-sky-500", light: "bg-sky-50 text-sky-700" },
  { id: "Closed Won (נחתם - בהצלחה)", label: "נסגר בהצלחה", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
  { id: "Closed Lost (אבוד)", label: "אבוד", color: "bg-slate-500", light: "bg-slate-50 text-slate-700" }
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