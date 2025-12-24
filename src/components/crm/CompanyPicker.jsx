import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Check, ChevronsUpDown, Building2, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/components/context/SettingsContext";

export default function CompanyPicker({ value, onChange, onCompanyCreated }) {
  const { theme } = useSettings();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies_picker'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (name) => base44.entities.Company.create({ name }),
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries(['companies_picker']);
      queryClient.invalidateQueries(['companies']);
      onChange(newCompany.id);
      if (onCompanyCreated) onCompanyCreated(newCompany);
      setShowCreateDialog(false);
      setNewCompanyName("");
      setOpen(false);
    }
  });

  const selectedCompany = companies.find((c) => c.id === value);

  const handleCreate = () => {
      if (!newCompanyName.trim()) return;
      createCompanyMutation.mutate(newCompanyName);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-300'}`}
          >
            <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 opacity-50 shrink-0" />
                {selectedCompany ? selectedCompany.name : "Select company..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-[300px] p-0 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}`}>
          <Command className={theme === 'dark' ? 'bg-slate-800' : ''}>
            <CommandInput placeholder="Search company..." className={theme === 'dark' ? 'text-white' : ''} />
            <CommandList>
                <CommandEmpty>
                    <div className="p-2 text-center text-sm">
                        <p className="text-muted-foreground mb-2">No company found.</p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setShowCreateDialog(true)}
                        >
                            <Plus className="w-3 h-3 mr-2" />
                            Create new
                        </Button>
                    </div>
                </CommandEmpty>
                <CommandGroup heading="Companies">
                {companies.map((company) => (
                    <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => {
                        onChange(company.id === value ? "" : company.id);
                        setOpen(false);
                    }}
                    className={theme === 'dark' ? 'data-[selected=true]:bg-slate-700 text-slate-200' : ''}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === company.id ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {company.name}
                    </CommandItem>
                ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                    <CommandItem onSelect={() => setShowCreateDialog(true)} className="cursor-pointer text-blue-500">
                        <Plus className="mr-2 h-4 w-4" />
                        Create new company
                    </CommandItem>
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className={theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : ''}>
            <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>Add a new organization to your CRM.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                        value={newCompanyName} 
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createCompanyMutation.isPending || !newCompanyName.trim()}>
                    {createCompanyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Company
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}