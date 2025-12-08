import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickTaskCreator({ leadId, leadName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const handleCreateTask = async () => {
    if (!taskData.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    setIsCreating(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Task.create({
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.due_date || null,
        status: "todo",
        assigned_to: user.email,
        related_lead_id: leadId,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        setTaskData({ title: "", description: "", due_date: "" });
      }, 1500);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Error creating task");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 border-t border-slate-200 pt-6 mt-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        {!isOpen ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="w-full bg-white hover:bg-blue-50 border-blue-300 text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Follow-up Task
          </Button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  New Task - {leadName}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Task Title *</Label>
                  <Input
                    value={taskData.title}
                    onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                    placeholder="e.g., Call back regarding offer"
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Description (Optional)</Label>
                  <Textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    placeholder="More details..."
                    className="border-slate-300 focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Due Date</Label>
                  <Input
                    type="date"
                    value={taskData.due_date}
                    onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={isCreating || showSuccess}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {showSuccess && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {showSuccess ? "Created Successfully!" : "Create Task"}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}