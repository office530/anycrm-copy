import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Shield, ShieldAlert, User } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";

export default function UserManagement() {
    const { theme } = useSettings();
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['users_management'],
        queryFn: () => base44.entities.User.list(),
        initialData: []
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users_management']);
        }
    });

    const handleApprove = (user) => {
        updateUserMutation.mutate({
            id: user.id,
            data: { 
                access_level: 'editor',
                requested_access_upgrade: false
            }
        });
    };

    const handleReject = (user) => {
        updateUserMutation.mutate({
            id: user.id,
            data: { 
                requested_access_upgrade: false
                // Optional: keep them as viewer
            }
        });
    };

    const handleDemote = (user) => {
        if (window.confirm(`Make Demo User a viewer only?`)) {
            updateUserMutation.mutate({
                id: user.id,
                data: { access_level: 'viewer' }
            });
        }
    };

    if (isLoading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>User Permissions</h2>
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Total Users: {users.length}
                </div>
            </div>

            <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <Table>
                    <TableHeader className={theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}>
                        <TableRow className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}>
                            <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>User</TableHead>
                            <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Email</TableHead>
                            <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Role</TableHead>
                            <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>App Permission</TableHead>
                            <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Request Status</TableHead>
                            <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            const isSystemAdmin = user.role === 'admin';
                            const isEditor = user.access_level === 'editor';
                            
                            return (
                                <TableRow key={user.id} className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {'D'}
                                            </div>
                                            <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Demo User</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{user.email}</TableCell>
                                    <TableCell>
                                        {isSystemAdmin ? 
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">Admin</Badge> : 
                                            <Badge variant="outline" className={theme === 'dark' ? 'border-slate-600 text-slate-400' : 'text-slate-500'}>User</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {isSystemAdmin ? 
                                            <span className="text-xs text-purple-500 font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> All</span> :
                                            isEditor ? 
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Editor</Badge> :
                                            <Badge variant="secondary" className={theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}>Viewer</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {user.requested_access_upgrade && !isEditor && !isSystemAdmin && (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                                                Requesting Edit
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-left">
                                        {!isSystemAdmin && (
                                            <div className="flex items-center justify-start gap-2">
                                                {user.requested_access_upgrade && !isEditor ? (
                                                    <>
                                                        <Button size="sm" onClick={() => handleApprove(user)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                                                            <Check className="w-3 h-3 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleReject(user)} className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50">
                                                            <X className="w-3 h-3 mr-1" /> Reject
                                                        </Button>
                                                    </>
                                                ) : (
                                                    isEditor ? (
                                                        <Button size="sm" variant="ghost" onClick={() => handleDemote(user)} className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            Make Viewer
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" onClick={() => handleApprove(user)} className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                            Make Editor
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}