import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Trash2, Pencil, CheckCircle2, MessageCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function LeadsKanban({ leads, statuses, onStatusChange, onEdit, onDelete, onConvert, activities }) {
  
  const getLeadsByStatus = (statusValue) => {
    return leads.filter(l => l.lead_status === statusValue);
  };

  const getLastActivityDate = (leadId) => {
    if (!activities) return null;
    const leadActivities = activities.filter(a => a.lead_id === leadId);
    if (!leadActivities.length) return null;
    const sorted = leadActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0]?.date;
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);

    if (lead && lead.lead_status !== newStatus) {
      onStatusChange(lead.id, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-20 h-full items-start scrollbar-hide px-2">
        {statuses.map((status) => {
          const statusLeads = getLeadsByStatus(status.value);
          
          return (
            <div key={status.value} className="flex-shrink-0 w-[85vw] md:w-80 flex flex-col h-full max-h-[calc(100vh-200px)]">
              {/* Stage Header */}
              <div className={`mb-3 p-3 rounded-xl border-b-4 flex justify-between items-center bg-white shadow-sm border-${status.color.split(' ')[0].replace('bg-', '')}`}>
                <span className="font-bold text-slate-800">{status.label}</span>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">{statusLeads.length}</Badge>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={status.value}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto px-1 space-y-3 min-h-[150px] rounded-xl transition-colors pb-20 ${
                      snapshot.isDraggingOver ? 'bg-slate-100/50 ring-2 ring-dashed ring-slate-300' : ''
                    }`}
                  >
                    {statusLeads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              cursor-grab active:cursor-grabbing border-none shadow-sm relative overflow-hidden group
                              ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-blue-500' : 'bg-white hover:shadow-md transition-all'}
                            `}
                            onClick={() => onEdit(lead)}
                          >
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${status.color.includes('red') ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {lead.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 line-clamp-1">{lead.full_name}</h4>
                                        <p className="text-xs text-slate-500">{lead.city || 'אין כתובת'}</p>
                                        {getLastActivityDate(lead.id) && (
                                          <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                            ✓ פעילות: {new Date(getLastActivityDate(lead.id)).toLocaleDateString('he-IL')}
                                          </div>
                                        )}
                                    </div>
                                </div>
                                {lead.phone_number && (
                                    <a href={`tel:${lead.phone_number}`} onClick={(e) => e.stopPropagation()} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                              </div>
                              
                              {/* Quick Actions */}
                              <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
                                 <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" 
                                        onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                 </div>
                                 
                                 {status.value !== 'Converted' && (
                                     <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-1"
                                        onClick={(e) => { e.stopPropagation(); onConvert(lead); }}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        המר
                                     </Button>
                                 )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}