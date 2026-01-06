"use client"

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  Send, User as UserIcon, Loader2, MoreVertical, 
  Trash2, Edit3, X, Check, Wifi, WifiOff, Eye, MessageSquare, ShieldCheck, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { themeColors } from "@/lib/themeColors";

// Optimized Background
const StarConstellation = memo(function StarConstellation() {
  const [stars, setStars] = useState<Array<{x: number, y: number, size: number}>>([])
  useEffect(() => {
    const newStars = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg className="w-full h-full opacity-20">
        {stars.map((star, i) => (
          <circle key={i} cx={`${star.x}%`} cy={`${star.y}%`} r={star.size} fill="rgb(59 130 246)" className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </svg>
    </div>
  )
})

export default function CommunicationPage() {
  const { isDarkMode: themeDarkMode } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(themeDarkMode)
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDarkMode(themeDarkMode)
  }, [themeDarkMode])

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setIsDarkMode(e.detail.mode === 'dark')
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  const fetchMessages = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('admin_messages')
      .select(`
        *, 
        profiles:admin_profiles!sender_id(full_name, avatar_url),
        message_reads(
          user_id, 
          read_at, 
          profiles:admin_profiles!user_id(full_name)
        )
      `)
      .order('created_at', { ascending: true });
    
    if (!error) setMessages(data || []);
    setLoading(false);
  }, []);

  const markAsSeen = async (messageId: string) => {
    if (!currentUser || messageId.toString().startsWith('optimistic')) return;
    await supabase.from('message_reads').upsert({ 
      message_id: messageId, 
      user_id: currentUser.id 
    }, { onConflict: 'message_id,user_id' });
  };

  useEffect(() => {
    let channel: any;

    const setupChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setCurrentUser(session.user);
      fetchMessages();

      await supabase.removeAllChannels();
      channel = supabase.channel('matrix_v20_ultra_fast', {
        config: { presence: { key: session.user.id } }
      });

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => {
          fetchMessages();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads' }, () => {
          fetchMessages();
        })
        .subscribe(async (status: string) => {
          const live = status === 'SUBSCRIBED';
          setIsConnected(live);
          if (status === 'TIMED_OUT') {
            setTimeout(() => setupChat(), 1500);
          }
        });
      setIsConnected(true); 
    };

    setupChat();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    
    if (messages.length > 0 && currentUser) {
      const lastMsg = messages[messages.length - 1];
      const alreadyRead = lastMsg.message_reads?.some((r: any) => r.user_id === currentUser.id);
      if (!alreadyRead && lastMsg.sender_id !== currentUser.id && !lastMsg.id.toString().startsWith('optimistic')) {
        markAsSeen(lastMsg.id);
      }
    }
  }, [messages, currentUser]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    const content = newMessage.trim();
    setNewMessage("");

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: any = {
      id: optimisticId,
      content,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      profiles: { 
        full_name: currentUser.user_metadata?.full_name || "Admin Staff", 
        avatar_url: currentUser.user_metadata?.avatar_url || null 
      },
      message_reads: []
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    const { error } = await supabase.from('admin_messages').insert([{ content, sender_id: currentUser.id }]);
    if (error) {
        toast.error("Handshake failed.");
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setNewMessage(content);
    }
  }, [newMessage, currentUser]);

  const deleteMessage = useCallback(async (id: string) => {
    await supabase.from('admin_messages').delete().eq('id', id);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editContent.trim() || !editingId) return;
    const { error } = await supabase.from('admin_messages').update({ content: editContent }).eq('id', editingId);
    if (!error) setEditingId(null);
  }, [editingId, editContent]);

  const startEditing = useCallback((msg: any) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  }, []);

  if (loading || !currentUser) return (
    <div className="h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Logs Link...</p>
    </div>
  );

  return (
    <div 
      className="relative h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-700 transition-colors duration-500"
    >
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); }
      `}</style>
      <StarConstellation />
      
      {/* HEADER NODES */}
      <div 
        className="flex flex-col md:flex-row items-start md:items-end justify-between backdrop-blur-xl p-8 rounded-[40px] border shadow-2xl transition-colors duration-500"
        style={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)' }}
      >
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none italic" style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}>Enrollment Messenger</h1>
          <p className="font-medium italic mt-2 text-sm flex items-center gap-2" style={{ color: isDarkMode ? themeColors.dark.text.secondary : themeColors.light.text.secondary }}>
            <ShieldCheck size={14} className="text-blue-500" />
            Administrative Chat
          </p>
        </div>

        <div 
          className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-colors duration-500 shadow-lg",
            isConnected 
              ? 'text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10' 
              : 'text-red-600 dark:text-red-400 shadow-red-500/10'
          )}
          style={isConnected ? {
            backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.1)' : '#ffffff',
            borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgb(187 247 208)'
          } : {
            backgroundColor: isDarkMode ? 'rgba(153, 27, 27, 0.1)' : 'rgb(254 242 242)',
            borderColor: isDarkMode ? 'rgba(185, 28, 28, 0.2)' : 'rgb(254 202 202)'
          }}
        >
          {isConnected ? <Wifi size={16} className="animate-pulse" /> : <WifiOff size={16} />}
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isConnected ? 'System Live' : 'Link Offline'}</span>
        </div>
      </div>

      {/* CHAT TERMINAL */}
      <Card 
        className="flex-1 rounded-[48px] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col relative transition-colors duration-500"
        style={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgb(241 245 249)' }}
      >
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <MessageSquare size={48} className="mb-4 text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listening for Transmissions...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem
                key={msg.id}
                msg={msg}
                currentUser={currentUser}
                isDarkMode={isDarkMode}
                editingId={editingId}
                editContent={editContent}
                setEditContent={setEditContent}
                onSaveEdit={saveEdit}
                onStartEdit={startEditing}
                onCancelEdit={() => setEditingId(null)}
                onDelete={deleteMessage}
              />
            ))
          )}
        </div>

        {/* INPUT COMMANDER */}
        <form onSubmit={sendMessage} 
          className="p-6 md:p-10 border-t flex gap-4 items-center relative z-20 transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? 'rgb(2, 6, 23)' : 'rgb(241, 245, 249)', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgb(226, 232, 240)' }}
        >
          <div className="relative flex-1 group">
            <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 transition-colors group-focus-within:text-blue-500" size={20} />
            <Input 
              placeholder="Message..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              className="h-16 rounded-[28px] border-slate-200 dark:border-white/10 font-black pl-14 pr-8 focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all text-sm shadow-inner" 
              style={{ backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#ffffff', color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}
            />
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="h-16 w-16 rounded-[28px] bg-blue-600 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 shrink-0 active:scale-90 transition-all group"
          >
            <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

const MessageItem = memo(({ msg, currentUser, isDarkMode, editingId, editContent, setEditContent, onSaveEdit, onStartEdit, onCancelEdit, onDelete }: any) => {
  const isMe = String(msg.sender_id) === String(currentUser?.id);
  const isOptimistic = msg.id.toString().startsWith('optimistic');
  const displayName = msg.profiles?.full_name || "Admin Staff";
  const readers = msg.message_reads?.filter((r: any) => r.user_id !== msg.sender_id);

  return (
    <div className={cn(
      "flex gap-4 group animate-in slide-in-from-bottom-2 duration-500",
      isMe ? 'flex-row-reverse' : 'flex-row',
      isOptimistic && 'opacity-40 grayscale blur-[1px]'
    )}>
      <div className="relative shrink-0 self-end mb-2">
        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-800 overflow-hidden shadow-md transition-transform group-hover:scale-110">
          {msg.profiles?.avatar_url ? (
            <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><UserIcon size={18} className="text-slate-400" /></div>
          )}
        </div>
      </div>

      <div className={cn("flex flex-col max-w-[75%] md:max-w-[60%]", isMe ? 'items-end' : 'items-start')}>
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase mb-2 tracking-widest leading-none px-2 italic">
          {displayName} • {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : 'Syncing'}
        </span>

        <div className="flex items-center gap-2 w-full group/controls">
          {editingId === msg.id ? (
            <div 
              className="flex items-center gap-2 p-2 rounded-[24px] border border-blue-500/50 shadow-2xl animate-in zoom-in-95 w-full"
              style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
            >
              <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="h-10 rounded-xl border-none text-sm font-bold" style={{ backgroundColor: isDarkMode ? 'rgb(15 23 42)' : 'rgb(241 245 249)', color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }} autoFocus />
              <button onClick={onSaveEdit} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Check size={14}/></button>
              <button onClick={onCancelEdit} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl hover:scale-110 transition-transform"><X size={14}/></button>
            </div>
          ) : (
            <div className={cn(
              "p-5 rounded-[32px] text-[13px] font-bold leading-relaxed shadow-sm transition-[background-color,border-color,box-shadow,color] duration-300 group-hover:shadow-md relative overflow-hidden border",
              isMe 
                ? 'bg-slate-900 text-white rounded-tr-none shadow-blue-500/10' 
                : 'rounded-tl-none'
            )}
            style={isMe ? 
              { backgroundColor: isDarkMode ? themeColors.dark.primary : 'rgb(37, 99, 235)', border: 'none' } : 
              { backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface, color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary, borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border }
            }>
              {msg.content}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-20 transition-opacity">
                <Sparkles size={12} />
              </div>
            </div>
          )}

          {isMe && !editingId && !isOptimistic && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 opacity-0 group-hover:opacity-100">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={isMe ? "end" : "start"} 
                className="rounded-2xl p-2 shadow-2xl min-w-[150px] z-[100] transition-colors duration-500"
                style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgb(241 245 249)' }}
              >
                <DropdownMenuItem onClick={() => onStartEdit(msg)} className="gap-3 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  <Edit3 size={14} className="text-blue-500" /> Edit Node
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:!text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 px-4 py-3 rounded-xl cursor-pointer transition-colors">
                  <Trash2 size={14} /> Purge Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isMe && readers?.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity animate-in fade-in">
            <Eye size={10} className="text-blue-500" />
            <span className="text-[8px] font-black uppercase tracking-tighter dark:text-slate-400">
              Seen by {readers.map((r: any) => `${r.profiles?.full_name?.split(' ')[0] || "Staff"}`).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
MessageItem.displayName = "MessageItem";