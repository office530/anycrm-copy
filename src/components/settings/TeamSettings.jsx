import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, UserPlus, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useSettings } from '@/components/context/SettingsContext';

export default function TeamSettings() {
    const { theme } = useSettings();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Users
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
        initialData: []
    });

    // Fetch Invites
    const { data: invites, isLoading: invitesLoading } = useQuery({
        queryKey: ['invites'],
        queryFn: () => base44.entities.Invite.list(),
        initialData: []
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Team & User Management</CardTitle>
                        <CardDescription>View system users and manage permissions</CardDescription>
                    </div>
                    <Button onClick={() => setIsInviteOpen(true)} className="bg-slate-900 text-white">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite User
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</TableHead>
                                    <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Email</TableHead>
                                    <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Role</TableHead>
                                    <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Status</TableHead>
                                    <TableHead className={`text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Join Date</TableHead>
                                    <TableHead className="text-right w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                                                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                                                </div>
                                                <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>{user.full_name || 'No Name'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50">
                                                {user.role === 'admin' ? 'System Admin' : 'User'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm dark:text-slate-400">
                                            {user.created_date ? format(new Date(user.created_date), 'MM/dd/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                     if(confirm('Are you sure you want to remove this user?')) {
                                                         base44.entities.User.delete(user.id)
                                                            .then(() => queryClient.invalidateQueries(['users']))
                                                            .catch(err => alert("Error deleting user: " + err.message));
                                                     }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {invites.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Pending Invites</h3>
                            <div className={`rounded-md border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50'}`}>
                                <Table>
                                    <TableBody>
                                        {invites.map((invite) => (
                                            <TableRow key={invite.id}>
                                                <TableCell className="font-medium text-slate-600">{invite.email}</TableCell>
                                                <TableCell>{invite.role === 'admin' ? 'Admin' : 'User'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            if(confirm('Cancel invitation?')) {
                                                                base44.entities.Invite.delete(invite.id).then(() => queryClient.invalidateQueries(['invites']));
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
        </div>
    );
}

function InviteUserDialog({ open, onOpenChange }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // 1. Create Invite Record
            await base44.entities.Invite.create({
                email,
                role,
                status: 'pending',
                invited_by: (await base44.auth.me())?.email
            });

            // 2. Ideally send an email here using an integration
            // await base44.integrations.SendEmail.send(...)

            queryClient.invalidateQueries(['invites']);
            onOpenChange(false);
            setEmail("");
            // alert("Invitation sent successfully");
        } catch (error) {
            console.error(error);
            // alert("Error sending invitation");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input 
                            type="email" 
                            required 
                            placeholder="user@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>System Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="bg-slate-900">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                            Send Invitation
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}