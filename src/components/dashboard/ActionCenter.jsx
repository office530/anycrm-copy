import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock } from "lucide-react";

export function ActionCenter({ tasks }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Action Center</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6 pb-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Today's Agenda
              </h4>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="text-xs font-medium text-muted-foreground w-16 pt-1">
                      {task.time}
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.subtitle}</p>
                    </div>
                    <Badge variant={task.priority === 'High' ? 'destructive' : 'outline'} className="text-[10px]">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}