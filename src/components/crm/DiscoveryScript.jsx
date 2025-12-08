import React from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, FileCheck, Users, Home, Wallet, ClipboardList } from "lucide-react";

export default function DiscoveryScript({ leadId }) {
  const queryClient = useQueryClient();

  // Fetch existing discovery data
  const { data: existingData, isLoading: isFetching } = useQuery({
    queryKey: ['discovery', leadId],
    queryFn: async () => {
      const res = await base44.entities.DiscoveryData.filter({ lead_id: leadId });
      return res[0] || null;
    },
    enabled: !!leadId
  });

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingData?.id) {
        return base44.entities.DiscoveryData.update(existingData.id, data);
      } else {
        return base44.entities.DiscoveryData.create({ ...data, lead_id: leadId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['discovery', leadId]);
    }
  });

  if (isFetching) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return <DiscoveryFormContent initialData={existingData} onSubmit={saveMutation.mutate} isSaving={saveMutation.isPending} />;
}

function DiscoveryFormContent({ initialData, onSubmit, isSaving }) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: initialData || {
      borrower_names: "",
      age_borrower_1: "",
      age_borrower_2: "",
      marital_status: "",
      health_status: "",
      children_count: "",
      children_details: "",
      children_awareness: "",
      property_after_120: "",
      heirs_notes: "",
      property_address: "",
      property_estimated_value: "",
      property_type: "",
      registration_status: "",
      existing_mortgage: false,
      mortgage_balance_to_clear: "",
      loan_purpose: "",
      requested_amount: "",
      payment_preference: "",
      documents_collected: []
    }
  });

  const docs = [
  "ID / Company Reg.",
  "Property Ownership Docs",
  "Debt / Loan Details",
  "Bank Statements (3 months)",
  "Account Ownership Cert.",
  "Income Proof"];


  const currentDocs = watch("documents_collected") || [];

  const handleDocToggle = (doc) => {
    const newDocs = currentDocs.includes(doc) ?
    currentDocs.filter((d) => d !== doc) :
    [...currentDocs, doc];
    setValue("documents_collected", newDocs);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-1" dir="ltr">
      
      {/* 1. Personal Details */}
      <Card>
        <CardHeader className="bg-slate-50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
            <Users className="w-5 h-5" />
            1. Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label className="text-slate-700">Client Name(s)</Label>
            <Input {...register("borrower_names")} placeholder="Full names" />
          </div>
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label className="text-slate-700">Marital Status</Label>
            <Select onValueChange={(v) => setValue("marital_status", v)} defaultValue={initialData?.marital_status}>
              <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Single">Single</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Main Client Age</Label>
              <Input type="number" {...register("age_borrower_1", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Secondary Client Age</Label>
              <Input type="number" {...register("age_borrower_2", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2 col-span-2">
            <Label className="text-slate-700">Personal Notes / Legal Status</Label>
            <Textarea {...register("health_status")} placeholder="Relevant details, power of attorney, special notes..." className="h-20 text-left placeholder:text-left" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Family / Structure */}
      <Card>
        <CardHeader className="bg-slate-50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
            <Users className="w-5 h-5" />
            2. Family / Organizational Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Number of Stakeholders / Beneficiaries</Label>
              <Input type="number" {...register("children_count", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Process Involvement</Label>
              <Select onValueChange={(v) => setValue("children_awareness", v)} defaultValue={initialData?.children_awareness}>
                <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Know and Support">Aware and Supportive</SelectItem>
                  <SelectItem value="Don't Know">Not Involved</SelectItem>
                  <SelectItem value="Pushed for Process">Initiated Process</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Additional Stakeholders Details</Label>
            <Textarea
              {...register("children_details")}
              placeholder={`Names, roles, or relevant relatives details...`}
              className="h-32 font-mono text-sm" />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Long-term Goals</Label>
              <Select onValueChange={(v) => setValue("property_after_120", v)} defaultValue={initialData?.property_after_120}>
                <SelectTrigger><SelectValue placeholder="Future Plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Keep Property">Keep Property/Business</SelectItem>
                  <SelectItem value="Sell Immediately">Sell/Exit</SelectItem>
                  <SelectItem value="Unknown">Unknown / Undecided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Special Notes</Label>
              <Input {...register("heirs_notes")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Property */}
      <Card>
        <CardHeader className="bg-slate-50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
            <Home className="w-5 h-5" />
            3. Assets & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Address / Location</Label>
              <Input {...register("property_address")} placeholder="City + Street" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Estimated Value (₪)</Label>
              <Input type="number" {...register("property_estimated_value", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Property Type</Label>
              <Select onValueChange={(v) => setValue("property_type", v)} defaultValue={initialData?.property_type}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Private House">Private House</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                  <SelectItem value="Financial">Financial Portfolio</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Legal Status</Label>
              <Select onValueChange={(v) => setValue("registration_status", v)} defaultValue={initialData?.registration_status}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private Tabu">Full Ownership</SelectItem>
                  <SelectItem value="Hevra Meshakenet/Minhal">Lease / Admin</SelectItem>
                  <SelectItem value="Warnings Exist">Restrictions / Notes</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                checked={watch("existing_mortgage")}
                onCheckedChange={(v) => setValue("existing_mortgage", v)}
                id="mortgage" />

              <Label htmlFor="mortgage" className="font-medium text-slate-700">Any existing debts or liens?</Label>
            </div>
            
            {watch("existing_mortgage") &&
            <div className="space-y-2 animate-in fade-in">
                <Label className="text-red-600">Total Liabilities (₪)</Label>
                <Input type="number" {...register("mortgage_balance_to_clear", { valueAsNumber: true })} />
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* 4. Needs & Goals */}
      <Card>
        <CardHeader className="bg-slate-50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
            <Wallet className="w-5 h-5" />
            4. Financial Needs & Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-6 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
             <Label className="text-slate-700">Funding Purpose</Label>
             <Input {...register("loan_purpose")} placeholder="Help children / Living expenses / Debt consolidation..." />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Requested Amount (₪)</Label>
            <Input type="number" {...register("requested_amount", { valueAsNumber: true })} className="text-lg font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Payment Preference</Label>
            <Select onValueChange={(v) => setValue("payment_preference", v)} defaultValue={initialData?.payment_preference}>
              <SelectTrigger><SelectValue placeholder="Select Preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pay Interest Monthly">Monthly Interest Payment</SelectItem>
                <SelectItem value="Full Balloon (No Payment)">Deferred Payment (Balloon)</SelectItem>
                <SelectItem value="Partial">Flexible / Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 5. Documents Checklist */}
      <Card className="border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <ClipboardList className="w-5 h-5" />
            5. Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) =>
            <div key={doc} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Checkbox
                id={doc}
                checked={currentDocs.includes(doc)}
                onCheckedChange={() => handleDocToggle(doc)} />

                <Label htmlFor={doc} className="cursor-pointer flex-1 text-slate-700">{doc}</Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-6 z-10 flex justify-end">
        <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-xl" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Discovery Script
        </Button>
      </div>

    </form>);

}