import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Trash2, Pencil, CheckCircle2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useSettings } from "@/components/context/SettingsContext";

export default function LeadsKanban({ leads, statuses, onStatusChange, onEdit, onDelete, onConvert, activities }) {
  const { theme } = useSettings();
  
  // Scroll Logic
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const scrollAbs = Math.abs(scrollLeft);
      const maxScroll = scrollWidth - clientWidth;
      
      if (scrollWidth <= clientWidth) {
        setShowLeftArrow(false);
        setShowRightArrow(false);
        return;
      }

      const isAtStart = scrollAbs < 5;
      const isAtEnd = scrollAbs >= maxScroll - 5;

      // LTR: Start (Left) -> Can scroll Right (Show Right Arrow)
      // End (Right) -> Can scroll Left (Show Left Arrow)
      setShowLeftArrow(!isAtStart);
      setShowRightArrow(!isAtEnd);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [leads, statuses]); // Re-check when data changes

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
      setTimeout(checkScroll, 300);
    }
  };

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
      <div className="relative h-full group/kanban isolate">
         {/* Custom Scrollbar Styles */}
         <style>{`
            .kanban-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .kanban-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .kanban-scrollbar::-webkit-scrollbar-thumb {
                background: ${theme === 'dark' ? '#1E293B' : '#cbd5e1'};
                border-radius: 10px;
            }
            .kanban-scrollbar::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'dark' ? '#334155' : '#94a3b8'};
            }
         `}</style>

         {/* Scroll Hints */}
         {showRightArrow && (
            <Button 
                variant="secondary" 
                size="icon" 
                className={`absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-16 w-8 rounded-l-xl rounded-r-none shadow-lg border transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => scroll('right')}
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
          )}
          
          {showLeftArrow && (
            <Button 
                variant="secondary" 
                size="icon" 
                className={`absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-16 w-8 rounded-r-xl rounded-l-none shadow-lg border transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => scroll('left')}
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-20 h-full items-start scrollbar-hide px-2 scroll-smooth"
      >
        {statuses.map((status) => {
          const statusLeads = getLeadsByStatus(status.value);
          
          return (
            <div key={status.value} className="flex-shrink-0 w-[40vw] sm:w-[40vw] md:w-48 lg:w-52 flex flex-col h-full max-h-[calc(100vh-200px)]">
              {/* Stage Header */}
              <div className={`mb-3 p-3 rounded-xl border-b-4 flex justify-between items-center shadow-sm transition-colors ${
                  // Use the text color (neon) for the border to match
                  status.color.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'border-') || 'border-slate-200'
              } ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{status.label}</span>
                <Badge variant="secondary" className={`${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{statusLeads.length}</Badge>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={status.value}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto px-1 space-y-3 min-h-[150px] rounded-xl transition-colors pb-20 kanban-scrollbar ${
                      snapshot.isDraggingOver 
                        ? theme === 'dark' ? 'bg-[#151E32]/50 ring-2 ring-dashed ring-[#1E293B]' : 'bg-slate-100/50 ring-2 ring-dashed ring-slate-300' 
                        : ''
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
                              cursor-grab active:cursor-grabbing border-none shadow-sm relative overflow-hidden group transition-all
                              ${snapshot.isDragging 
                                ? 'shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-blue-500' 
                                : theme === 'dark' ? 'bg-slate-800 hover:shadow-md hover:bg-slate-700/80' : 'bg-white hover:shadow-md'}
                            `}
                            onClick={() => onEdit(lead)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                      theme === 'dark' 
                                        ? status.color.includes('red') ? 'bg-red-900/50 text-red-200' : 'bg-slate-700 text-slate-300'
                                        : status.color.includes('red') ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {lead.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lead.full_name}</h4>
                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{lead.city || 'No address'}</p>
                                        {getLastActivityDate(lead.id) && (
                                          <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                            ✓ Activity: {new Date(getLastActivityDate(lead.id)).toLocaleDateString('en-US')}
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
                              <div className={`flex justify-between items-center pt-2 border-t mt-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-50'}`}>
                                 <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className={`h-7 w-7 hover:text-red-600 ${theme === 'dark' ? 'text-slate-500 hover:bg-slate-700' : 'text-slate-400'}`}
                                        onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                 </div>
                                 
                                 {status.value !== 'Converted' && (
                                     <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-1"
                                        onClick={(e) => { e.stopPropagation(); onConvert(lead); }}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        Convert
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
      </div>
    </DragDropContext>
  );
}