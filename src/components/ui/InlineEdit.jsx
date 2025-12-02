import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, X, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function InlineEdit({ value, onSave, type = "text", className, placeholder, formatDisplay }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (currentValue == value) { // Loose equality to catch number vs string "100" == 100
      setIsEditing(false);
      return;
    }

    // Optimistic UI: Show loading state while saving
    setIsEditing(false);
    setIsLoading(true);
    setError(false);
    setShowSuccess(false);

    try {
      await onSave(currentValue);
      // Success
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save", err);
      setError(true);
      setCurrentValue(value || ""); // Revert
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative flex items-center w-full">
        <Input
          ref={inputRef}
          type={type === "phone" ? "tel" : type}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn("h-8 w-full text-sm px-2 py-1", className)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering row clicks if any
        setIsEditing(true);
      }}
      className={cn(
        "group flex items-center gap-2 cursor-pointer rounded px-2 py-1 -ml-2 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200/50 min-h-[32px]", 
        className
      )}
    >
      <span className={cn("truncate", !currentValue && "text-slate-400 italic text-xs")}>
        {formatDisplay ? formatDisplay(currentValue) : (currentValue || placeholder || "Click to edit")}
      </span>
      
      {/* Status Indicators */}
      {isLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
      {error && <X className="w-3 h-3 text-red-500" />}
      {showSuccess && <Check className="w-3 h-3 text-green-500" />}
      
      {!isLoading && !error && !showSuccess && (
        <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}