import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MoreHorizontal } from "lucide-react";

export function HotLeadsTable({ leads }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Hot Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Win Probability</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name}`} alt={lead.name} />
                      <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={lead.status === 'Won' ? 'default' : 'secondary'} className={lead.status === 'Won' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={lead.score} className="w-[60px] h-2" />
                    <span className="text-xs text-muted-foreground">{lead.score}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}