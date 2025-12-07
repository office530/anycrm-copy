import React, { useState } from 'react';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PipelineSettings from '@/components/settings/PipelineSettings';
import TagSettings from '@/components/settings/TagSettings';
import { 
    Building2, GitMerge, Tags, Bell, User, Shield, 
    Database
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");

  const menuGroups = [
    {
        title: "כללי",
        items: [
            { id: "organization", label: "הגדרות ארגון", icon: Building2 },
        ]
    },
    {
        title: "הגדרות מערכת",
        items: [
            { id: "pipeline", label: "תהליכי מכירה", icon: GitMerge },
            { id: "tags", label: "תגיות ונתונים", icon: Tags },
        ]
    },
    {
        title: "אישי",
        items: [
            { id: "profile", label: "הפרופיל שלי", icon: User },
            { id: "notifications", label: "התראות", icon: Bell },
        ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20" dir="rtl">
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">הגדרות מערכת</h1>
            <p className="text-slate-500 mt-2">ניהול הגדרות מתקדם עבור הארגון והמשתמשים</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* Sidebar Menu */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <nav className="flex flex-col gap-6">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                {group.title}
                            </h3>
                            <div className="flex flex-col gap-1">
                                {group.items.map((item) => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-right
                                                ${isActive 
                                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-bold" 
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                }`}
                                        >
                                            <item.icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
                
                <div className="mt-8 mx-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-2">
                        <Shield className="w-4 h-4" />
                        אבטחת מידע
                    </div>
                    <p className="text-xs text-blue-600/80 leading-relaxed">
                        כל השינויים בהגדרות נרשמים ביומן הפעילות של המערכת ומגובים אוטומטית.
                    </p>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-1 md:p-6 min-h-[500px]">
                {activeTab === "organization" && <OrganizationSettings />}
                {activeTab === "profile" && <ProfileSettings />}
                {activeTab === "pipeline" && <PipelineSettings />}
                {activeTab === "tags" && <TagSettings />}
                {activeTab === "notifications" && <NotificationSettings />}
            </main>
        </div>
    </div>
  );
}