import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
    initialData: []
  });

  const updateOppMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      setShowForm(false);
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
        <h2 className="text-2xl font-bold text-slate-800">צנרת עסקאות (Pipeline)</h2>
      </div>

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