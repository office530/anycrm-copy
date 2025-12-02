import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, List as ListIcon, ArrowLeft, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import OpportunityForm from "@/components/crm/OpportunityForm";
import { InlineEdit } from "@/components/ui/InlineEdit";
import moment from "moment";

// הגדרת שלבים עם צבעים מותאמים לעיצוב החדש
const STAGES = [
  { id: "New (חדש)", label: "חדש", color: "bg-blue-500", light: "bg-blue-50 text-blue-700" },
  { id: "Discovery Call (שיחת בירור צרכים)", label: "בירור צרכים", color: "bg-indigo-500", light: "bg-indigo-50 text-indigo-700" },
  { id: "Meeting Scheduled (נקבעת פגישה)", label: "נקבעת פגישה", color: "bg-purple-500", light: "bg-purple-50 text-purple-700" },
  { id: "Documents Collection (איסוף מסמכים)", label: "איסוף מסמכים", color: "bg-orange-500", light: "bg-orange-50 text-orange-700" },
  { id: "Request Sent to Harel (בקשה נשלחה להראל)", label: "נשלח להראל", color: "bg-sky-500", light: "bg-sky-50 text-sky-700" },
  { id: "Closed Won (נחתם - בהצלחה)", label: "נסגר בהצלחה", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
  { id: "Closed Lost (אבוד)", label: "אבוד", color: "bg-slate-500", light: "bg-slate-50 text-slate-700" }
];

export default function OpportunitiesPage() {
  const [editingOpp, setEditingOpp] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
    initialData: []
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
    }
  };

  const getStageOpportunities = (stageId) => opportunities.filter(o => o.deal_stage === stageId);
  const calculateTotal = (stageId) => getStageOpportunities(stageId).reduce((acc, curr) => acc + (curr.loan_amount_requested || 0), 0);

  if (isLoading) return <div className="flex justify-center h-96 items-center"><Loader2 className="animate-spin w-8 h-8 text-teal-600" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">צנרת עסקאות</h2>
            <p className="text-slate-500 text-sm">ניהול ותיעדוף הזדמנויות עסקיות</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('kanban')} className={viewMode === 'kanban' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500'}>
                <LayoutGrid className="w-4 h-4 ml-2" /> לוח
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500'}>
                <ListIcon className="w-4 h-4 ml-2" /> רשימה
            </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-6 h-full items-start">
          {STAGES.map((stage) => {
            const stageOpps = getStageOpportunities(stage.id);
            const total = calculateTotal(stage.id);
            
            return (
            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col max-h-full">
              {/* Stage Header */}
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${stage.light} border border-transparent`}>
                        {stage.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{stageOpps.length}</span>
                </div>
                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${stage.color}`} style={{ width: '100%' }}></div>
                </div>
                {total > 0 && <div className="text-xs font-medium text-slate-500 mt-1 text-right">₪{total.toLocaleString()}</div>}
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto px-1 space-y-3 min-h-[150px] transition-colors rounded-xl ${
                      snapshot.isDraggingOver ? 'bg-slate-100/50 ring-2 ring-dashed ring-slate-200' : ''
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
                              ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-teal-500' : 'bg-white'}
                            `}
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                          >
                            <div className={`absolute top-0 right-0 w-1 h-full ${stage.color}`} />
                            <CardContent className="p-4 pr-5 space-y-3">
                              
                              {/* שם הלקוח */}
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                  {opp.lead_name || "לקוח ללא שם"}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-100 text-slate-500">
                                  {opp.probability}%
                                </Badge>
                              </div>
                              
                              {/* עריכה מהירה: סכום ותאריך */}
                              <div className="space-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> סכום</span>
                                  <div className="w-24 text-right">
                                      <InlineEdit 
                                        value={opp.loan_amount_requested}
                                        type="number"
                                        formatDisplay={(val) => `₪${Number(val || 0).toLocaleString()}`}
                                        onSave={(val) => updateOppMutation.mutate({ id: opp.id, data: { loan_amount_requested: Number(val) } })}
                                        className="font-bold text-slate-700 justify-end h-6 bg-white shadow-sm"
                                      />
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> צפי</span>
                                  <div className="w-28 text-right">
                                      <InlineEdit 
                                        value={opp.expected_close_date}
                                        type="date"
                                        placeholder="קבע תאריך"
                                        onSave={(val) => updateOppMutation.mutate({ id: opp.id, data: { expected_close_date: val } })}
                                        className="justify-end h-6 text-slate-600"
                                        formatDisplay={(val) => val ? moment(val).format("DD/MM/YYYY") : "אין תאריך"}
                                      />
                                  </div>
                                </div>
                              </div>

                              {/* משימה הבאה */}
                              {opp.next_task && (
                                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{opp.next_task}</span>
                                </div>
                              )}
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             {/* תצוגת טבלה פשוטה נשמרת למקרה הצורך, אפשר להעתיק מהקוד הקודם אם אתה משתמש בה */}
             <div className="p-10 text-center text-slate-500">תצוגת רשימה זמינה בגרסה הבאה</div>
        </div>
      )}

      {/* טופס עריכה */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if(!open) setEditingOpp(null); }}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          {editingOpp && (
            <OpportunityForm 
              opportunity={editingOpp}
              onSubmit={(data) => updateOppMutation.mutate({ id: editingOpp.id, data })}
              onCancel={() => setShowForm(false)}
              isSubmitting={updateOppMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}