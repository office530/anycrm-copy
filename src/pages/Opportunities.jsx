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
import { usePermissions } from '@/components/hooks/usePermissions';
import moment from "moment";

export default function OpportunitiesPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { pipelineStages, branding, theme } = useSettings();
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

      // In LTR:
      // Start (Left) -> Can scroll Right. Show Right Arrow.
      // End (Right) -> Can scroll Left. Show Left Arrow.
      
      setShowLeftArrow(!isAtStart);
      setShowRightArrow(!isAtEnd);
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
      alert("Opportunity created successfully");
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
        alert("Opportunity deleted successfully");
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
          toastEl.innerHTML = `<span class="text-2xl">🎉</span> <div><div class="font-bold">Congratulations!</div><div class="text-sm opacity-90">Another deal closed successfully!</div></div>`;
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
    <div className={`h-[calc(100vh-140px)] flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Search Bar & Actions */}
      <div className="mb-4 flex justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          <Input
            placeholder="Search client, phone, email or product..."
            className={`pl-10 rounded-lg ${
                theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-500' 
                    : 'border-slate-300 focus:border-purple-500 focus:ring-purple-500'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button 
              onClick={() => { setEditingOpp(null); setShowForm(true); }} 
              className={`text-white shadow-md ${
                  theme === 'dark' 
                      ? 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/30' 
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/10'
              }`}
          >
              <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> 
                  <span>New Opportunity</span>
              </div>
          </Button>
        )}
      </div>

      {/* Stats Header (New!) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-neutral-100'
          }`}>
             <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}><DollarSign className="w-5 h-5"/></div>
             <div>
                 <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Total Pipeline Value</div>
                 <div className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{branding?.currency}{stats.totalPipeline.toLocaleString()}</div>
             </div>
          </div>
          <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-neutral-100'
          }`}>
             <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}><Briefcase className="w-5 h-5"/></div>
             <div>
                 <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Active Deals</div>
                 <div className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{stats.activeDeals}</div>
             </div>
          </div>
          <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-neutral-100'
          }`}>
             <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}><Trophy className="w-5 h-5"/></div>
             <div>
                 <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Closed Won</div>
                 <div className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{stats.wonDeals}</div>
             </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className={`p-1 rounded-xl border shadow-sm flex gap-1 h-fit transition-colors ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-neutral-200'
            }`}>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('kanban')} className={viewMode === 'kanban' 
                    ? theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'bg-neutral-100 text-neutral-900 shadow-sm'
                    : theme === 'dark' ? 'text-slate-400 hover:text-cyan-400' : 'text-neutral-500'}>
                    <LayoutGrid className="w-4 h-4 mr-2" /> Board
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' 
                    ? theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'bg-neutral-100 text-neutral-900 shadow-sm'
                    : theme === 'dark' ? 'text-slate-400 hover:text-cyan-400' : 'text-neutral-500'}>
                    <ListIcon className="w-4 h-4 mr-2" /> List
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
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${stage.light || (theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-neutral-100 text-neutral-700')} border border-transparent`}>
                        {stage.label}
                    </span>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>{stageOpps.length}</span>
                </div>
                <div className={`h-1 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-neutral-200'}`}>
                    <div className={`h-full ${stage.color || 'bg-neutral-400'}`} style={{ width: '100%' }}></div>
                </div>
                {total > 0 && <div className={`text-xs font-medium mt-1 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>{branding?.currency}{total.toLocaleString()}</div>}
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto px-1 space-y-3 min-h-[150px] transition-colors rounded-xl ${
                      snapshot.isDraggingOver 
                        ? theme === 'dark' ? 'bg-slate-800/50 ring-2 ring-dashed ring-slate-600' : 'bg-neutral-100/50 ring-2 ring-dashed ring-neutral-200' 
                        : ''
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
                              ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-teal-500' : theme === 'dark' ? 'bg-slate-800 border border-slate-700 shadow-none' : 'bg-white shadow-sm'}
                            `}
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                          >
                            <div className={`absolute top-0 right-0 w-1 h-full ${stage.color || 'bg-neutral-300'}`} />
                            <CardContent className="p-5 space-y-4">
                              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if(window.confirm('Are you sure you want to delete this opportunity?')) deleteOppMutation.mutate(opp.id);
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
                                    <div className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white group-hover:text-teal-400' : 'text-neutral-800 group-hover:text-teal-600'}`}>
                                      {opp.lead_name || "Unnamed Client"}
                                    </div>

                                    {/* טלפון */}
                                    {lead?.phone_number && (
                                      <div className={`flex items-center gap-2 text-base font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>
                                        <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`} />
                                        {lead.phone_number}
                                      </div>
                                    )}

                                    {/* הערות */}
                                    {lead?.notes && (
                                      <div className={`text-sm p-3 rounded-lg line-clamp-3 leading-relaxed ${theme === 'dark' ? 'text-slate-400 bg-slate-900/50' : 'text-neutral-600 bg-neutral-50'}`}>
                                        {lead.notes}
                                      </div>
                                    )}

                                    {/* שיחה אחרונה */}
                                    {lead?.last_contact_date && (
                                      <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-500'}`}>
                                        <Calendar className="w-4 h-4" />
                                        <span>Last Contact: {moment(lead.last_contact_date).format('DD/MM/YYYY')}</span>
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
        </div>
      </DragDropContext>
      ) : (
        <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className={`grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-bold uppercase tracking-wide transition-colors ${
            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="col-span-3 text-left">Client</div>
            <div className="col-span-2 text-left">Phone</div>
            <div className="col-span-4 text-left">Notes</div>
            <div className="col-span-2 text-left">Last Contact</div>
            <div className="col-span-1 text-right pr-4">Actions</div>
          </div>
          
          <div className={`divide-y transition-colors ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'}`}>
            {filteredOpportunities.map((opp) => {
              const stage = activeStages.find(s => s.id === opp.deal_stage);
              return (
                <div key={opp.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-start transition-colors group ${
                  theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/80'
                }`}>
                  {(() => {
                    const lead = leads.find(l => l.id === opp.lead_id);
                    return (
                      <>
                        {/* שם */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base ${
                            theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {opp.lead_name?.charAt(0) || '?'}
                          </div>
                          <div 
                            className={`text-base font-bold transition-colors cursor-pointer ${
                              theme === 'dark' ? 'text-white hover:text-purple-400' : 'text-slate-800 hover:text-purple-600'
                            }`}
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                          >
                            {opp.lead_name || 'Unnamed Client'}
                          </div>
                        </div>
                        
                        {/* טלפון */}
                        <div className={`col-span-2 text-base font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                          {lead?.phone_number || '-'}
                        </div>
                        
                        {/* הערות */}
                        <div className={`col-span-4 text-sm line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} title={lead?.notes}>
                          {lead?.notes || '-'}
                        </div>
                        
                        {/* שיחה אחרונה */}
                        <div className={`col-span-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                          {lead?.last_contact_date ? moment(lead.last_contact_date).format('DD/MM/YYYY') : '-'}
                        </div>
                        
                        {/* פעולות */}
                        <div className="col-span-1 flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                            className={`h-8 px-2 ${theme === 'dark' ? 'text-slate-500 hover:text-purple-400 hover:bg-purple-900/20' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                            title={canEdit ? "Open Opportunity" : "View Opportunity"}
                          >
                            <Briefcase className="w-4 h-4" />
                          </Button>
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if(window.confirm('האם אתה בטוח שברצונך למחוק הזדמנות זו?')) deleteOppMutation.mutate(opp.id);
                              }} 
                              className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete Opportunity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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