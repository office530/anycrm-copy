import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const defaultStages = [
  { id: "New (חדש)", label: "חדש", color: "bg-blue-500", light: "bg-blue-50 text-blue-700" },
  { id: "Discovery Call (שיחת בירור צרכים)", label: "בירור צרכים", color: "bg-indigo-500", light: "bg-indigo-50 text-indigo-700" },
  { id: "Meeting Scheduled (נקבעת פגישה)", label: "נקבעת פגישה", color: "bg-purple-500", light: "bg-purple-50 text-purple-700" },
  { id: "Documents Collection (איסוף מסמכים)", label: "איסוף מסמכים", color: "bg-orange-500", light: "bg-orange-50 text-orange-700" },
  { id: "Request Sent to Harel (בקשה נשלחה להראל)", label: "נשלח להראל", color: "bg-sky-500", light: "bg-sky-50 text-sky-700" },
  { id: "Closed Won (נחתם - בהצלחה)", label: "נסגר בהצלחה", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
  { id: "Closed Lost (אבוד)", label: "אבוד", color: "bg-slate-500", light: "bg-slate-50 text-slate-700" }
];

export const defaultBranding = {
  companyName: "AgentCRM",
  logoUrl: "", 
  primaryColor: "teal",
  currency: "₪"
};

export function SettingsProvider({ children }) {
  const [branding, setBranding] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_branding');
      return saved ? JSON.parse(saved) : defaultBranding;
    } catch (e) {
      return defaultBranding;
    }
  });

  const [pipelineStages, setPipelineStages] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_stages');
      return saved ? JSON.parse(saved) : defaultStages;
    } catch (e) {
      return defaultStages;
    }
  });

  useEffect(() => {
    localStorage.setItem('crm_branding', JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    localStorage.setItem('crm_stages', JSON.stringify(pipelineStages));
  }, [pipelineStages]);

  const updateBranding = (key, value) => {
    setBranding(prev => ({ ...prev, [key]: value }));
  };

  const updateStage = (index, field, value) => {
    const newStages = [...pipelineStages];
    newStages[index] = { ...newStages[index], [field]: value };
    setPipelineStages(newStages);
  };

  return (
    <SettingsContext.Provider value={{ branding, updateBranding, pipelineStages, updateStage, setPipelineStages }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);