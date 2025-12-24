import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Check, ChevronsUpDown, Contact, Plus, Loader2 } from "lucide-react";
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

export default function ContactPicker({ value, onChange, onContactCreated }) {
  const { theme } = useSettings();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts_picker'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries(['contacts_picker']);
      queryClient.invalidateQueries(['contacts']);
      onChange(newContact.id);
      if (onContactCreated) onContactCreated(newContact);
      setShowCreateDialog(false);
      setNewContactName("");
      setNewContactEmail("");
      setOpen(false);
    }
  });

  const selectedContact = contacts.find((c) => c.id === value);

  const handleCreate = () => {
      if (!newContactName.trim()) return;
      createContactMutation.mutate({ 
          full_name: newContactName,
          email: newContactEmail
      });
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
                <Contact className="w-4 h-4 opacity-50 shrink-0" />
                {selectedContact ? selectedContact.full_name : "Select contact..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-[300px] p-0 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}`}>
          <Command className={theme === 'dark' ? 'bg-slate-800' : ''}>
            <CommandInput placeholder="Search contact..." className={theme === 'dark' ? 'text-white' : ''} />
            <CommandList>
                <CommandEmpty>
                    <div className="p-2 text-center text-sm">
                        <p className="text-muted-foreground mb-2">No contact found.</p>
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
                <CommandGroup heading="Contacts">
                {contacts.map((contact) => (
                    <CommandItem
                    key={contact.id}
                    value={contact.full_name}
                    onSelect={() => {
                        onChange(contact.id === value ? "" : contact.id);
                        setOpen(false);
                    }}
                    className={theme === 'dark' ? 'data-[selected=true]:bg-slate-700 text-slate-200' : ''}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === contact.id ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {contact.full_name}
                    </CommandItem>
                ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                    <CommandItem onSelect={() => setShowCreateDialog(true)} className="cursor-pointer text-blue-500">
                        <Plus className="mr-2 h-4 w-4" />
                        Create new contact
                    </CommandItem>
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className={theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : ''}>
            <DialogHeader>
                <DialogTitle>Create New Contact</DialogTitle>
                <DialogDescription>Add a new person to your network.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                        value={newContactName} 
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                        value={newContactEmail} 
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createContactMutation.isPending || !newContactName.trim()}>
                    {createContactMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Contact
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}