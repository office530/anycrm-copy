import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InlineEdit - Smart inline editing component
 * Supports text, number, and Select inputs
 */
export function InlineEdit({ 
  value, 
  onSave, 
  type = "text", 
  options = [], // for type="select"
  className, 
  placeholder, 
  formatDisplay 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && type !== 'select') {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

  const handleSave = async (newValue) => {
    const valToSave = newValue !== undefined ? newValue : currentValue;

    // If no change, cancel
    if (valToSave == value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(valToSave); // Server call
      setIsLoading(false);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setIsLoading(false);
      setIsEditing(false);
      setCurrentValue(value); // Revert
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>שומר...</span>
      </div>
    );
  }

  // Editing state
  if (isEditing) {
    if (type === 'select') {
      return (
        <div className="w-full min-w-[120px]" onClick={(e) => e.stopPropagation()}>
           <Select 
            value={currentValue} 
            onValueChange={(val) => {
                setCurrentValue(val);
                handleSave(val); // Auto-save on select
            }}
            open={true} 
            onOpenChange={(open) => !open && setIsEditing(false)}
           >
            <SelectTrigger className="h-8 text-sm border-teal-500 ring-1 ring-teal-500">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          type={type === "phone" ? "tel" : type}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={() => handleSave()}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm w-full border-teal-500 focus-visible:ring-teal-500"
          placeholder={placeholder}
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button onMouseDown={() => handleSave()} className="bg-teal-500 text-white rounded-full p-0.5 hover:bg-teal-600">
                <Check className="w-3 h-3" />
            </button>
        </div>
      </div>
    );
  }

  // Normal display state
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={cn(
        "group relative flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 -ml-2 transition-all border border-transparent hover:bg-white hover:shadow-sm hover:border-slate-200 min-h-[32px]", 
        className
      )}
    >
      <span className={cn("truncate block w-full", !currentValue && "text-slate-400 italic text-xs")}>
        {formatDisplay ? formatDisplay(currentValue) : (currentValue || placeholder || "לחץ לעריכה")}
      </span>
      
      {showSuccess && <Check className="w-3 h-3 text-teal-500 animate-in fade-in zoom-in" />}
      
      <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute left-1" />
    </div>
  );
}