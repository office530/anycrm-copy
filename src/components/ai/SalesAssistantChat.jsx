import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSettings } from '@/components/context/SettingsContext';

function MessageBubble({ message, isUser, theme }) {
    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2`}>
            {!isUser && (
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                }`}>
                    <Bot className="h-5 w-5" />
                </div>
            )}
            
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                isUser 
                    ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white')
                    : (theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white border border-slate-100 text-slate-800')
            }`}>
                <ReactMarkdown 
                    className={`text-sm prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0`}
                    components={{
                        p: ({children}) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>

            {isUser && (
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    );
}

export default function SalesAssistantChat() {
    const { theme } = useSettings();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState(null);
    const scrollRef = useRef(null);

    // Initialize conversation
    useEffect(() => {
        const initChat = async () => {
            try {
                // Check for existing recent conversation or create new
                // For simplicity in this demo, we'll create a new one or use a fixed ID logic if we had persistence
                const newConv = await base44.agents.createConversation({
                    agent_name: "SalesAssistant",
                    metadata: { name: "Sales Help" }
                });
                setConversation(newConv);
                
                // Initial greeting
                setMessages([{
                    role: 'assistant',
                    content: "Hi! I'm your AI Sales Assistant. I can help you write emails, analyze your pipeline, or suggest next steps for your deals. How can I help you today?"
                }]);
            } catch (error) {
                console.error("Failed to init chat:", error);
            }
        };
        initChat();
    }, []);

    // Subscribe to updates
    useEffect(() => {
        if (!conversation?.id) return;

        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            if (data.messages && data.messages.length > 0) {
                 setMessages(data.messages);
            }
        });

        return () => unsubscribe();
    }, [conversation?.id]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !conversation) return;

        const userMsg = input;
        setInput('');
        setIsLoading(true);

        try {
            await base44.agents.addMessage(conversation, {
                role: "user",
                content: userMsg
            });
            // The subscription will update the state with the new message and the AI response
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                        <Sparkles className="h-12 w-12 text-indigo-400" />
                        <p>Start a conversation...</p>
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <MessageBubble 
                        key={i} 
                        message={msg} 
                        isUser={msg.role === 'user'} 
                        theme={theme} 
                    />
                ))}
                
                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-white'}`}>
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me to draft an email or check your pipeline..."
                        className={`flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                        autoFocus
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}