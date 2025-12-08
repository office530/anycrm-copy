import React from "react";
import { Clock, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function LastTouchInfo({ entity, entityType = "Lead" }) {
    const { data: updatedByUser } = useQuery({
        queryKey: ['user', entity?.updated_by],
        queryFn: async () => {
            if (!entity?.updated_by) return null;
            const users = await base44.entities.User.list();
            return users.find(u => u.email === entity.updated_by);
        },
        enabled: !!entity?.updated_by
    });

    if (!entity?.updated_date) return null;

    const displayName = updatedByUser?.full_name || entity?.updated_by || "Unknown";
    const timeAgo = moment(entity.updated_date).fromNow();
    const fullDate = moment(entity.updated_date).format("DD/MM/YYYY HH:mm");

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <div className="text-xs text-slate-500 font-medium">Last Touch</div>
                    <div className="text-sm font-bold text-slate-800">{timeAgo}</div>
                    <div className="text-[10px] text-slate-400">{fullDate}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 font-medium flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3" />
                    {displayName}
                </Badge>
            </div>
        </div>
    );
}