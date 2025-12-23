import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, DollarSign, Users, Activity, MousePointerClick } from 'lucide-react';
import { cn } from "@/lib/utils";

export function KpiCardOps({ title, value, icon: Icon, trend, trendValue, trendLabel }) {
  const isPositive = trend === 'up';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {isPositive ? (
              <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={cn("font-medium", isPositive ? "text-emerald-500" : "text-red-500")}>
              {trendValue}
            </span>
            <span className="ml-1 text-muted-foreground">{trendLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AiInsightsWidget({ insights }) {
  return (
    <Card className="h-full border-l-4 border-l-primary shadow-sm bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          AI Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {insights.length} leads require immediate attention based on recent activity signals.
        </p>
        <div className="space-y-2">
            {insights.slice(0, 2).map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-background/50 rounded-lg border">
                    <div className="min-w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                    <span>{insight}</span>
                </div>
            ))}
        </div>
        <Button className="w-full mt-2" size="sm">
          <MousePointerClick className="mr-2 h-4 w-4" />
          Review Recommended Actions
        </Button>
      </CardContent>
    </Card>
  );
}