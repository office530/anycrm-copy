import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LayoutGrid, List as ListIcon, Phone, Calendar, DollarSign, Briefcase, Trophy, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";
import { triggerConfetti } from "@/components/utils/confetti";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import OpportunityForm from "@/components/crm/OpportunityForm";
import { InlineEdit } from "@/components/ui/InlineEdit";
import moment from "moment";

export default function OpportunitiesPage() {
  const { pipelineStages, branding } = useSettings();
  const [editingOpp, setEditingOpp] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const activeStages = pipelineStages || [];
  
  // Scroll Logic
  const scrollContainerRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // RTL Logic:
      // Start is Right (scrollLeft approx 0).
      // End is Left (scrollLeft approx -max or max depending on browser).
      // Let's use Math.abs to be safe(r).
      
      const scrollAbs = Math.abs(scrollLeft);
      const maxScroll = scrollWidth - clientWidth;
      
      // If no overflow
      if (scrollWidth <= clientWidth) {
        setShowLeftArrow(false);
        setShowRightArrow(false);
        return;
      }

      // Check if at Start (Right side)
      const isAtStart = scrollAbs < 5; // Tolerance
      // Check if at End (Left side)
      const isAtEnd = scrollAbs >= maxScroll - 5;

      // In RTL:
      // Start (Right) -> Can scroll Left. Show Left Arrow.
      // End (Left) -> Can scroll Right. Show Right Arrow.
      
      setShowLeftArrow(!isAtEnd);
      setShowRightArrow(!isAtStart);
    }
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeStages, viewMode]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Approx one card width
      // In RTL, scrollLeft is usually negative for "Left" direction
      // But scrollBy({ left: -320 }) moves left.
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
      // Check after scroll (timeout for smooth scroll)
      setTimeout(checkScroll, 300);
    }
  };

  const { data: opportunities, isLoading: isLoadingOpp } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
    initialData: []
  });

  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: []
  });

  const isLoading = isLoadingOpp || isLoadingLeads;

  // Check for action=new in URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
        setEditingOpp(null);
        setShowForm(true);
        // Clean URL
        window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  // --- Statistics Logic (New!) ---
  const stats = useMemo(() => {
    const totalPipeline = opportunities.reduce((acc, o) => acc + (o.loan_amount_requested || 0), 0);
    const totalDeals = opportunities.length;
    const wonDeals = opportunities.filter(o => o.deal_stage.includes('Won')).length;
    const activeDeals = opportunities.filter(o => !o.deal_stage.includes('Won') && !o.deal_stage.includes('Lost')).length;
    
    return { totalPipeline, totalDeals, wonDeals, activeDeals };
  }, [opportunities]);

  const createOppMutation = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['opportunities']);
      setShowForm(false);
      processAutomation('Opportunity', 'create', data);
      setEditingOpp(null);
      alert("ההזדמנות נוצרה בהצלחה");
    }
  });

  const updateOppMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opportunity.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['opportunities']);
      setShowForm(false);
      processAutomation('Opportunity', 'update', data, editingOpp);
      setEditingOpp(null);
    }
  });

  const deleteOppMutation = useMutation({
    mutationFn: (id) => base44.entities.Opportunity.delete(id),
    onSuccess: () => {
        queryClient.invalidateQueries(['opportunities']);
        alert("ההזדמנות נמחקה בהצלחה");
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    const opp = opportunities.find(o => o.id === draggableId);
    
    if (opp && opp.deal_stage !== newStage) {
      updateOppMutation.mutate({
        id: draggableId,
        data: { ...opp, deal_stage: newStage }
      });

      if (newStage.includes('Closed Won')) {
          triggerConfetti();
          // Custom Toast Logic
          const toastEl = document.createElement('div');
          toastEl.className = "fixed top-1/2 left-1/2 transform -tranneutral-x-1/2 -tranneutral-y-1/2 bg-neutral-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in duration-300 flex items-center gap-3";
          toastEl.innerHTML = `<span class="text-2xl">🎉</span> <div><div class="font-bold">ברכות!</div><div class="text-sm opacity-90">עסקה נוספת נסגרה בהצלחה!</div></div>`;
          document.body.appendChild(toastEl);
          setTimeout(() => {
              toastEl.classList.add('opacity-0', 'transition-opacity');
              setTimeout(() => document.body.removeChild(toastEl), 500);
          }, 3000);
      }
    }
  };

  // Filter opportunities by search term
  const filteredOpportunities = useMemo(() => {
    if (!searchTerm.trim()) return opportunities;
    
    const term = searchTerm.toLowerCase().trim();
    return opportunities.filter(opp => {
      const leadName = (opp.lead_name || '').toLowerCase();
      const phone = (opp.phone_number || '').replace(/\D/g, '');
      const searchPhone = term.replace(/\D/g, '');
      const email = (opp.email || '').toLowerCase();
      const product = (opp.product_type || '').toLowerCase();
      
      return leadName.includes(term) || 
             phone.includes(searchPhone) || 
             email.includes(term) ||
             product.includes(term);
    });
  }, [opportunities, searchTerm]);

  const getStageOpportunities = (stageId) => filteredOpportunities.filter(o => o.deal_stage === stageId);
  const calculateTotal = (stageId) => getStageOpportunities(stageId).reduce((acc, curr) => acc + (curr.loan_amount_requested || 0), 0);

  if (isLoading) return <div className="flex justify-center h-96 items-center"><Loader2 className="animate-spin w-8 h-8 text-teal-600" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="חיפוש לקוח, טלפון, אימייל או מוצר..."
            className="pr-10 border-slate-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Header (New!) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-200 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-300 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign className="w-5 h-5"/></div>
             <div>
                 <div className="text-xs text-neutral-500">שווי צנרת כולל</div>
                 <div className="font-bold text-lg dark:text-neutral-900">{branding?.currency}{stats.totalPipeline.toLocaleString()}</div>
             </div>
          </div>
          <div className="bg-white dark:bg-neutral-200 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-300 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Briefcase className="w-5 h-5"/></div>
             <div>
                 <div className="text-xs text-neutral-500">עסקאות פעילות</div>
                 <div className="font-bold text-lg dark:text-neutral-900">{stats.activeDeals}</div>
             </div>
          </div>
          <div className="bg-white dark:bg-neutral-200 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-300 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Trophy className="w-5 h-5"/></div>
             <div>
                 <div className="text-xs text-neutral-500">נסגרו בהצלחה</div>
                 <div className="font-bold text-lg dark:text-neutral-900">{stats.wonDeals}</div>
             </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="bg-white dark:bg-neutral-200 p-1 rounded-xl border border-neutral-200 dark:border-neutral-300 shadow-sm flex gap-1 h-fit">
                <Button variant="ghost" size="sm" onClick={() => setViewMode('kanban')} className={viewMode === 'kanban' ? 'bg-neutral-100 dark:bg-neutral-300 text-neutral-900 dark:text-neutral-900 shadow-sm' : 'text-neutral-500 dark:text-neutral-600'}>
                    <LayoutGrid className="w-4 h-4 ml-2" /> לוח
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-neutral-100 dark:bg-neutral-300 text-neutral-900 dark:text-neutral-900 shadow-sm' : 'text-neutral-500 dark:text-neutral-600'}>
                    <ListIcon className="w-4 h-4 ml-2" /> רשימה
                </Button>
            </div>
          </div>
      </div>

      {viewMode === 'kanban' ? (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 relative h-full group/kanban isolate">
          {/* Scroll Hints */}
          {showRightArrow && (
            <Button 
                variant="secondary" 
                size="icon" 
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-16 w-8 rounded-l-xl rounded-r-none bg-white shadow-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-90 hover:opacity-100 transition-all"
                onClick={() => scroll('right')}
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
          )}
          
          {showLeftArrow && (
            <Button 
                variant="secondary" 
                size="icon" 
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-16 w-8 rounded-r-xl rounded-l-none bg-white shadow-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-90 hover:opacity-100 transition-all"
                onClick={() => scroll('left')}
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          <div 
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto pb-6 h-full items-start px-1 scroll-smooth"
          >
          {activeStages.map((stage) => {
            const stageOpps = getStageOpportunities(stage.id);
            const total = calculateTotal(stage.id);
            
            return (
            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col max-h-full">
              {/* Stage Header */}
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${stage.light || 'bg-neutral-100 text-neutral-700 dark:bg-neutral-300 dark:text-neutral-700'} border border-transparent`}>
                        {stage.label}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">{stageOpps.length}</span>
                </div>
                <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-300 rounded-full overflow-hidden">
                    <div className={`h-full ${stage.color || 'bg-neutral-400'}`} style={{ width: '100%' }}></div>
                </div>
                {total > 0 && <div className="text-xs font-medium text-neutral-500 dark:text-neutral-600 mt-1 text-right">{branding?.currency}{total.toLocaleString()}</div>}
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto px-1 space-y-3 min-h-[150px] transition-colors rounded-xl ${
                      snapshot.isDraggingOver ? 'bg-neutral-100/50 ring-2 ring-dashed ring-neutral-200' : ''
                    }`}
                  >
                    {stageOpps.map((opp, index) => (
                      <Draggable key={opp.id} draggableId={opp.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              cursor-grab active:cursor-grabbing hover:shadow-lg transition-all border-none shadow-sm group relative overflow-hidden
                              ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-teal-500' : 'bg-white dark:bg-neutral-200 dark:shadow-none dark:border dark:border-neutral-300'}
                            `}
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                          >
                            <div className={`absolute top-0 right-0 w-1 h-full ${stage.color || 'bg-neutral-300'}`} />
                            <CardContent className="p-5 space-y-4">
                              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if(window.confirm('האם אתה בטוח שברצונך למחוק הזדמנות זו?')) deleteOppMutation.mutate(opp.id);
                                      }}
                                  >
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                              </div>

                              {(() => {
                                const lead = leads.find(l => l.id === opp.lead_id);
                                return (
                                  <>
                                    {/* שם */}
                                    <div className="text-xl font-bold text-neutral-800 dark:text-neutral-900 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                      {opp.lead_name || "לקוח ללא שם"}
                                    </div>

                                    {/* טלפון */}
                                    {lead?.phone_number && (
                                      <div className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-800 font-medium">
                                        <Phone className="w-4 h-4 text-neutral-400" />
                                        {lead.phone_number}
                                      </div>
                                    )}

                                    {/* הערות */}
                                    {lead?.notes && (
                                      <div className="text-sm text-neutral-600 dark:text-neutral-700 bg-neutral-50 dark:bg-neutral-300/50 p-3 rounded-lg line-clamp-3 leading-relaxed">
                                        {lead.notes}
                                      </div>
                                    )}

                                    {/* שיחה אחרונה */}
                                    {lead?.last_contact_date && (
                                      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>שיחה אחרונה: {moment(lead.last_contact_date).format('DD/MM/YYYY')}</span>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
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
          )})}
        </div>
      </DragDropContext>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <div className="col-span-3 text-right">לקוח</div>
            <div className="col-span-2 text-right">טלפון</div>
            <div className="col-span-4 text-right">הערות</div>
            <div className="col-span-2 text-right">שיחה אחרונה</div>
            <div className="col-span-1 text-left pl-4">פעולות</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {filteredOpportunities.map((opp) => {
              const stage = activeStages.find(s => s.id === opp.deal_stage);
              return (
                <div key={opp.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-start hover:bg-slate-50/80 transition-colors group">
                  {(() => {
                    const lead = leads.find(l => l.id === opp.lead_id);
                    return (
                      <>
                        {/* שם */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base">
                            {opp.lead_name?.charAt(0) || '?'}
                          </div>
                          <div 
                            className="text-base font-bold text-slate-800 hover:text-purple-600 transition-colors cursor-pointer"
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                          >
                            {opp.lead_name || 'לקוח ללא שם'}
                          </div>
                        </div>
                        
                        {/* טלפון */}
                        <div className="col-span-2 text-base text-slate-700 font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {lead?.phone_number || '-'}
                        </div>
                        
                        {/* הערות */}
                        <div className="col-span-4 text-sm text-slate-600 line-clamp-2" title={lead?.notes}>
                          {lead?.notes || '-'}
                        </div>
                        
                        {/* שיחה אחרונה */}
                        <div className="col-span-2 text-sm text-slate-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {lead?.last_contact_date ? moment(lead.last_contact_date).format('DD/MM/YYYY') : '-'}
                        </div>
                        
                        {/* פעולות */}
                        <div className="col-span-1 flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                            className="h-8 px-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                            title="פתח הזדמנות"
                          >
                            <Briefcase className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              if(window.confirm('האם אתה בטוח שברצונך למחוק הזדמנות זו?')) deleteOppMutation.mutate(opp.id);
                            }} 
                            className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="מחק הזדמנות"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* טופס עריכה */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if(!open) setEditingOpp(null); }}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          {(showForm || editingOpp) && (
            <OpportunityForm 
              opportunity={editingOpp}
              onSubmit={(data) => {
                  if (editingOpp) {
                      updateOppMutation.mutate({ id: editingOpp.id, data });
                  } else {
                      createOppMutation.mutate(data);
                  }
              }}
              onCancel={() => setShowForm(false)}
              isSubmitting={updateOppMutation.isPending || createOppMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}