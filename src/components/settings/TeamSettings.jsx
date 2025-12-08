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
                        <CardTitle>ניהול צוות ומשתמשים</CardTitle>
                        <CardDescription>צפייה במשתמשי המערכת וניהול הרשאות</CardDescription>
                    </div>
                    <Button onClick={() => setIsInviteOpen(true)} className="bg-slate-900 text-white">
                        <UserPlus className="w-4 h-4 mr-2" />
                        הזמן משתמש
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>שם מלא</TableHead>
                                    <TableHead className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>אימייל</TableHead>
                                    <TableHead className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>תפקיד</TableHead>
                                    <TableHead className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>סטטוס</TableHead>
                                    <TableHead className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>תאריך הצטרפות</TableHead>
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
                                                {user.full_name || 'ללא שם'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50">
                                                {user.role === 'admin' ? 'מנהל מערכת' : 'משתמש'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">פעיל</Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm dark:text-slate-400">
                                            {user.created_date ? format(new Date(user.created_date), 'dd/MM/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                     if(confirm('האם אתה בטוח שברצונך להסיר משתמש זה?')) {
                                                         base44.entities.User.delete(user.id)
                                                            .then(() => queryClient.invalidateQueries(['users']))
                                                            .catch(err => alert("שגיאה במחיקת המשתמש: " + err.message));
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
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">הזמנות ממתינות</h3>
                            <div className={`rounded-md border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50'}`}>
                                <Table>
                                    <TableBody>
                                        {invites.map((invite) => (
                                            <TableRow key={invite.id}>
                                                <TableCell className="font-medium text-slate-600">{invite.email}</TableCell>
                                                <TableCell>{invite.role === 'admin' ? 'מנהל' : 'משתמש'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">ממתין</Badge>
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            if(confirm('לבטל את ההזמנה?')) {
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
            // alert("ההזמנה נשלחה בהצלחה");
        } catch (error) {
            console.error(error);
            // alert("שגיאה בשליחת ההזמנה");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>הזמנת משתמש חדש</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>כתובת אימייל</Label>
                        <Input 
                            type="email" 
                            required 
                            placeholder="user@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>תפקיד במערכת</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">משתמש (User)</SelectItem>
                                <SelectItem value="admin">מנהל (Admin)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit" disabled={isLoading} className="bg-slate-900">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                            שלח הזמנה
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}