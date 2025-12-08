import React, { useState } from 'react';
import NotificationSettings from '@/components/notifications/NotificationSettings';
// import OrganizationSettings from '@/components/settings/OrganizationSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PipelineSettings from '@/components/settings/PipelineSettings';
import TagSettings from '@/components/settings/TagSettings';
import TeamSettings from '@/components/settings/TeamSettings';
import CustomFieldSettings from '@/components/settings/CustomFieldSettings';
import IntegrationSettings from '@/components/settings/IntegrationSettings';
import AuditLogSettings from '@/components/settings/AuditLogSettings';
import UserManagement from '@/components/settings/UserManagement';
import { useSettings } from '@/components/context/SettingsContext';
import { usePermissions } from '@/components/hooks/usePermissions';
import { 
    Building2, GitMerge, Tags, Bell, User, Shield, 
    Database, Users, Puzzle, Activity, PenTool, Lock
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { theme } = useSettings();
  const { isAdmin } = usePermissions();

  const menuGroups = [
    {
        title: "General",
        items: [
            // { id: "organization", label: "Organization Settings", icon: Building2 },
            { id: "team", label: "Team & Users", icon: Users },
            { id: "audit", label: "Audit Log", icon: Activity },
            ...(isAdmin ? [{ id: "user_management", label: "Permissions", icon: Lock }] : []),
        ]
    },
    {
        title: "System Settings",
        items: [
            { id: "pipeline", label: "Pipeline Stages", icon: GitMerge },
            { id: "tags", label: "System Tags", icon: Tags },
            { id: "custom_fields", label: "Custom Fields", icon: PenTool },
            { id: "integrations", label: "Integrations", icon: Puzzle },
        ]
    },
    {
        title: "Personal",
        items: [
            { id: "profile", label: "My Profile", icon: User },
            { id: "notifications", label: "Notifications", icon: Bell },
        ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20" dir="ltr">
        {/* Header */}
        <div className="mb-8">
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400' : 'text-slate-900'}`}>System Settings</h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Advanced configuration for organization and users</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* Sidebar Menu */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <nav className="flex flex-col gap-6">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            <h3 className={`px-2 text-xs font-semibold uppercase tracking-wider mb-2 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                                {group.title}
                            </h3>
                            <div className="flex flex-col gap-1">
                                {group.items.map((item) => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                                                ${isActive 
                                                    ? theme === 'dark'
                                                        ? "bg-slate-700 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold"
                                                        : "bg-white text-slate-900 shadow-sm border border-slate-200 font-bold"
                                                    : theme === 'dark'
                                                        ? "text-slate-100 hover:bg-slate-800 hover:text-cyan-400"
                                                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                                }`}
                                        >
                                            <item.icon className={`w-4 h-4 ${isActive ? (theme === 'dark' ? 'text-cyan-400' : 'text-slate-900') : (theme === 'dark' ? 'text-slate-200' : 'text-slate-600')}`} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
                
                <div className={`mt-8 mx-2 p-4 rounded-xl border ${theme === 'dark' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
                    <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-900'}`}>
                        <Shield className="w-4 h-4" />
                        Security
                    </div>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-purple-200/70' : 'text-purple-700/80'}`}>
                        All setting changes are logged in the audit log and backed up automatically.
                    </p>
                </div>
            </aside>

            {/* Content Area */}
            <main className={`flex-1 rounded-xl shadow-sm border p-1 md:p-6 min-h-[500px] transition-colors ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}>
                {/* {activeTab === "organization" && <OrganizationSettings />} */}
                {activeTab === "profile" && <ProfileSettings />}
                {activeTab === "pipeline" && <PipelineSettings />}
                {activeTab === "tags" && <TagSettings />}
                {activeTab === "custom_fields" && <CustomFieldSettings />}
                {activeTab === "integrations" && <IntegrationSettings />}
                {activeTab === "team" && <TeamSettings />}
                {activeTab === "audit" && <AuditLogSettings />}
                {activeTab === "notifications" && <NotificationSettings />}
                {activeTab === "user_management" && isAdmin && <UserManagement />}
            </main>
        </div>
    </div>
  );
}