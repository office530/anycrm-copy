import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, AlertCircle, LayoutGrid, List as ListIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import OpportunityForm from "@/components/crm/OpportunityForm";

const STAGES = [
  { id: "Discovery Call (שיחת בירור צרכים)", label: "בירור צרכים", color: "border-blue-500" },
  { id: "Simulation Sent (נשלחה סימולציה)", label: "נשלחה סימולציה", color: "border-purple-500" },
  { id: "Negotiation (משא ומתן)", label: "משא ומתן", color: "border-yellow-500" },
  { id: "Underwriting (חיתום/תהליך בבנק)", label: "תהליך בבנק/חיתום", color: "border-orange-500" },
  { id: "Closed Won (נחתם - בהצלחה)", label: "נסגר בהצלחה", color: "border-green-500" },
  { id: "Closed Lost (אבוד)", label: "אבוד", color: "border-red-500" }
];

const productLabels = {
  "Reverse Mortgage": "משכנתא הפוכה",
  "Savings/Insurance": "חיסכון/ביטוח",
  "Loan": "הלוואה",
  "Other": "אחר"
};

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
      // We can pass editingOpp as 'previousData' if we want change detection
      // But editingOpp might be stale if updates happened elsewhere? 
      // For drag and drop, 'editingOpp' is null usually (it's set on click).
      // But for form edit, it is set.
      // For drag and drop, we don't have the previous data easily available in 'onSuccess' 
      // unless we captured it before mutation.
      // But 'processAutomation' handles missing previousData by just checking current state.
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

  const getStageOpportunities = (stageId) => {
    return opportunities.filter(o => o.deal_stage === stageId);
  };

  const calculateTotal = (stageId) => {
    return getStageOpportunities(stageId)
      .reduce((acc, curr) => acc + (curr.loan_amount_requested || 0), 0);
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
            {viewMode === 'kanban' ? 'צנרת עסקאות (Pipeline)' : 'מאגר הזדמנויות'}
        </h2>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode('kanban')}
                className={`${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <LayoutGrid className="w-4 h-4 ml-2" />
                לוח
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode('list')}
                className={`${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ListIcon className="w-4 h-4 ml-2" />
                רשימה
            </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 h-full">
          {STAGES.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-100/50 rounded-xl p-2">
              <div className={`flex flex-col gap-1 mb-3 px-2 border-r-4 ${stage.color} bg-white p-3 rounded shadow-sm`}>
                <h3 className="font-bold text-slate-700 text-sm truncate" title={stage.label}>
                  {stage.label}
                </h3>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{getStageOpportunities(stage.id).length} עסקאות</span>
                  <span className="font-medium">₪{calculateTotal(stage.id).toLocaleString()}</span>
                </div>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto px-1 space-y-3 transition-colors rounded-lg ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {getStageOpportunities(stage.id).map((opp, index) => (
                      <Draggable key={opp.id} draggableId={opp.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => { setEditingOpp(opp); setShowForm(true); }}
                            className={`
                              cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-slate-200
                              ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105' : ''}
                            `}
                          >
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-sm text-slate-800 line-clamp-1">
                                  {opp.lead_name || "לקוח לא ידוע"}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                  {opp.probability}%
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-slate-500 space-y-1">
                                <div className="flex justify-between">
                                  <span>מוצר:</span>
                                  <span className="font-medium">{productLabels[opp.product_type] || opp.product_type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>סכום:</span>
                                  <span className="font-medium text-slate-900">₪{opp.loan_amount_requested?.toLocaleString()}</span>
                                </div>
                              </div>

                              {opp.next_task && (
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-1 rounded">
                                  <AlertCircle className="w-3 h-3" />
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
          ))}
        </div>
      </DragDropContext>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="text-right">לקוח</TableHead>
                        <TableHead className="text-right">מוצר</TableHead>
                        <TableHead className="text-right">שלב</TableHead>
                        <TableHead className="text-right">סכום</TableHead>
                        <TableHead className="text-right">הסתברות</TableHead>
                        <TableHead className="text-right">משימה הבאה</TableHead>
                        <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {opportunities.map((opp) => (
                        <TableRow key={opp.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium">{opp.lead_name || "לקוח לא ידוע"}</TableCell>
                            <TableCell>{productLabels[opp.product_type] || opp.product_type}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`${STAGES.find(s => s.id === opp.deal_stage)?.color.replace('border-', 'text-')}`}>
                                    {STAGES.find(s => s.id === opp.deal_stage)?.label || opp.deal_stage}
                                </Badge>
                            </TableCell>
                            <TableCell>₪{opp.loan_amount_requested?.toLocaleString() || '-'}</TableCell>
                            <TableCell>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 w-24">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${opp.probability}%` }}></div>
                                </div>
                                <span className="text-xs text-slate-500">{opp.probability}%</span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 truncate max-w-[200px]">{opp.next_task || '-'}</TableCell>
                            <TableCell className="text-left">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingOpp(opp); setShowForm(true); }}>
                                    ערוך
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {opportunities.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                אין הזדמנויות פעילות
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingOpp(null);
      }}>
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