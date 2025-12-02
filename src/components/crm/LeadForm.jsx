import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LeadForm({ lead, onSubmit, onCancel, isSubmitting }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: lead || {
      full_name: "",
      phone_number: "",
      age: "",
      city: "",
      source_year: "2024",
      original_status_color: "Green",
      lead_status: "New",
      last_contact_date: new Date().toISOString().split('T')[0],
      notes: ""
    }
  });

  const leadStatus = watch("lead_status");

  // Handle select changes manually since Select component doesn't integrate directly with register
  const handleSelectChange = (field, value) => {
    setValue(field, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-lg border border-slate-100"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {lead ? "Edit Lead" : "Add New Lead"}
        </h2>
        <p className="text-slate-500">Enter client details below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input {...register("full_name", { required: "Name is required" })} placeholder="e.g. David Cohen" />
            {errors.full_name && <span className="text-red-500 text-sm">{errors.full_name.message}</span>}
          </div>
          
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input {...register("phone_number", { required: "Phone is required" })} placeholder="050-0000000" />
          </div>

          <div className="space-y-2">
            <Label>Age</Label>
            <Input type="number" {...register("age", { valueAsNumber: true })} placeholder="e.g. 68" />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Input {...register("city")} placeholder="e.g. Tel Aviv" />
          </div>

          <div className="space-y-2">
            <Label>Source Year</Label>
            <Select 
              defaultValue={lead?.source_year || "2024"} 
              onValueChange={(val) => handleSelectChange("source_year", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Original Status Color (Legacy)</Label>
            <Select 
              defaultValue={lead?.original_status_color || "Green"} 
              onValueChange={(val) => handleSelectChange("original_status_color", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Green">Green</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="Yellow">Yellow</SelectItem>
                <SelectItem value="Orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lead Status</Label>
            <Select 
              defaultValue={lead?.lead_status || "New"} 
              onValueChange={(val) => handleSelectChange("lead_status", val)}
            >
              <SelectTrigger className={leadStatus === 'Converted to Opportunity' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : ''}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contact Attempt 1">Contact Attempt 1</SelectItem>
                <SelectItem value="Contact Attempt 2">Contact Attempt 2</SelectItem>
                <SelectItem value="Nurturing">Nurturing</SelectItem>
                <SelectItem value="Unqualified">Unqualified</SelectItem>
                <SelectItem value="Converted to Opportunity" className="text-emerald-600 font-bold">Converted to Opportunity</SelectItem>
              </SelectContent>
            </Select>
            {leadStatus === 'Converted to Opportunity' && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                ✨ Saving this will prompt to create a new Opportunity
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Last Contact Date</Label>
            <Input type="date" {...register("last_contact_date")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} placeholder="Any important details..." className="h-24" />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {lead ? "Update Lead" : "Create Lead"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}