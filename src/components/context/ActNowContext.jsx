import React, { createContext, useContext, useState, useRef } from 'react';

const ActNowContext = createContext();

export function ActNowProvider({ children }) {
  const [suggestions, setSuggestions] = useState([]);
  const timeoutRef = useRef(null);

  const updateSuggestions = (newSuggestions) => {
    setSuggestions(newSuggestions);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to clear suggestions after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setSuggestions([]);
    }, 30000); // 30 seconds
  };

  return (
    <ActNowContext.Provider value={{ suggestions, setSuggestions: updateSuggestions }}>
      {children}
    </ActNowContext.Provider>
  );
}

export const useActNow = () => useContext(ActNowContext);