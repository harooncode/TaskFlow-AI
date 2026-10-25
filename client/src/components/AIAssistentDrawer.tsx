import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { badge, btn, btnDanger, btnPrimary, btnSmall, card, field } from "../ui";
import type { AIChatMessage, SubtaskItem, Task } from "../types";

// ─── Chat history persistence ────────────────────────────────────────────────
// Each context gets its own localStorage key:
//   "tf_chat_general"        → opened from the top-right AI button (no task)
//   "tf_chat_<taskId>"       → opened from a specific task card
const STORAGE_PREFIX = "tf_chat_";

const WELCOME_MSG: AIChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I am your **TaskFlow AI Assistant**.\n\nI am grounded in your live tasks and deadlines. You can ask me to **plan your day**, **audit bottlenecks**, or **guide you** through executing any task.",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

function storageKey(focusedTaskId: string | null): string {
  return STORAGE_PREFIX + (focusedTaskId ?? "general");
}

function loadHistory(focusedTaskId: string | null): AIChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(focusedTaskId));
    if (!raw) return [{ ...WELCOME_MSG, id: "welcome" }];
    const parsed = JSON.parse(raw) as AIChatMessage[];
    return parsed.length > 0 ? parsed : [{ ...WELCOME_MSG, id: "welcome" }];
  } catch {
    return [{ ...WELCOME_MSG, id: "welcome" }];
  }
}

function saveHistory(focusedTaskId: string | null, messages: AIChatMessage[]): void {
  try {
    localStorage.setItem(storageKey(focusedTaskId), JSON.stringify(messages));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function clearHistory(focusedTaskId: string | null): AIChatMessage[] {
  localStorage.removeItem(storageKey(focusedTaskId));
  return [{ ...WELCOME_MSG, id: "welcome", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  focusedTask: Task | null;
  onClearFocusedTask: () => void;
  onSubtasksCreated?: () => void;
}

export default function AIAssistentDrawer({
  isOpen,
  onClose,
  focusedTask,
  onClearFocusedTask,
  onSubtasksCreated,
}: Props) {
  // Load initial history for the "general" context (no focused task)
  const [messages, setMessages] = useState<AIChatMessage[]>(() => loadHistory(null));
  // Track which context the current messages belong to ("general" or a task _id)
  const currentContextRef = useRef<string>("general");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [addingSubtasks, setAddingSubtasks] = useState(false);
  const [speechLang, setSpeechLang] = useState<"ur-PK" | "en-US">("ur-PK");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  // Load voices into a ref. We keep two pinned voices — one for Urdu/South Asian,
  // one for English — both always female. We re-evaluate if a better voice appears
  // (voices load asynchronously in Chrome/Edge) but never downgrade.
  const pinnedUrduVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const pinnedEnVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isSpeakingRef = useRef(false); // guard against concurrent speak calls

  // Load voices and pin the best female voice for each language category.
  // We run this every time the voice list changes (Chrome loads voices async)
  // so we always upgrade to the most appropriate voice as soon as it's available.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const isMale = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      return (
        n.includes("male") || n.includes("david") || n.includes("mark") ||
        n.includes("george") || n.includes("ravi") || n.includes("asif") ||
        n.includes("hemant") || n.includes("prabhat") || n.includes("guy") ||
        n.includes("stefan") || n.includes("pablo") || n.includes("richard") ||
        n.includes("james") || n.includes("michael") || n.includes("daniel") ||
        n.includes("sean") || n.includes("brian") || n.includes("eric")
      );
    };

    const pickVoices = (list: SpeechSynthesisVoice[]) => {
      const females = list.filter((v) => !isMale(v));

      // ── Urdu / South Asian female ─────────────────────────────────────────
      const urduPick =
        females.find((v) => v.lang.toLowerCase() === "ur-pk") ||
        females.find((v) => v.lang.toLowerCase() === "en-pk") ||
        females.find((v) => {
          const n = v.name.toLowerCase();
          return (
            n.includes("heera") || n.includes("neerja") || n.includes("swara") ||
            n.includes("aditi") || n.includes("kalpana") || n.includes("veena") ||
            n.includes("priya")
          );
        }) ||
        females.find((v) => v.lang.toLowerCase() === "en-in") ||
        females.find((v) => v.lang.toLowerCase().startsWith("hi")) ||
        females.find((v) => v.lang.toLowerCase().startsWith("ur"));

      // ── English female ────────────────────────────────────────────────────
      const enPick =
        females.find((v) => {
          const n = v.name.toLowerCase();
          return (
            n.includes("zira") || n.includes("jenny") || n.includes("aria") ||
            n.includes("samantha") || n.includes("victoria") || n.includes("karen")
          );
        }) ||
        females.find((v) => v.lang.toLowerCase() === "en-us") ||
        females.find((v) => v.lang.toLowerCase().startsWith("en")) ||
        females[0];

      if (urduPick) pinnedUrduVoiceRef.current = urduPick;
      if (enPick) pinnedEnVoiceRef.current = enPick;
    };

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) pickVoices(list);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Update speech recognition language when speechLang changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang;
    }
  }, [speechLang]);

  // Switch to the correct chat context whenever focusedTask changes or drawer opens.
  // Saves the previous context's messages before switching.
  useEffect(() => {
    const newContextId = focusedTask?._id ?? null;

    // Only switch if the context actually changed
    if (currentContextRef.current === (newContextId ?? "general")) return;

    // Save whatever was in the previous context
    const prevKey = currentContextRef.current === "general" ? null : currentContextRef.current;
    if (prevKey !== undefined) saveHistory(prevKey, messages);

    currentContextRef.current = newContextId ?? "general";
    setMessages(loadHistory(newContextId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedTask?._id, isOpen]);

  // Save history to localStorage whenever messages change
  useEffect(() => {
    const contextId = currentContextRef.current === "general" ? null : currentContextRef.current;
    saveHistory(contextId, messages);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Setup Web Speech Recognition — continuous mode so pauses don't auto-submit.
  // Transcript is written into the input field only; the user sends it manually.
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;      // keep listening through natural pauses
    recognition.interimResults = true;  // show words appearing live in the input box
    recognition.lang = speechLang;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      // "no-speech" is normal when the user is quiet — don't log it as an error
      if (e.error !== "no-speech") console.warn("Speech recognition error:", e.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      // Concatenate all results (both interim and final) into one transcript string
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Only update the input field — NEVER auto-send
      setInput(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  // When focusedTask changes, trigger guidance
  useEffect(() => {
    if (!focusedTask || !isOpen) return;

    const fetchTaskGuidance = async () => {
      setLoading(true);
      try {
        const res = await api.aiGuideTask(focusedTask._id);
        const botMsg: AIChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: res.reply,
          suggestedSubtasks: res.suggestedSubtasks,
          isDescriptionMissing: res.isDescriptionMissing,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => {
          // Only speak the guidance auto-reply if the user hasn't sent any messages yet
          // (prevents guidance voice from overlapping with a chat reply already speaking)
          const hasUserMessages = prev.some((m) => m.role === "user");
          if (voiceEnabled && !hasUserMessages) speakText(res.reply);
          return [...prev, botMsg];
        });
      } catch (err) {
        console.error("AI Guidance error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskGuidance();
  }, [focusedTask, isOpen]);

  // Text to Speech — voice chosen by the user's active language (speechLang), not by text detection.
  // isSpeakingRef prevents two concurrent calls from overlapping.
  const speakText = (text: string, lang?: "ur-PK" | "en-US") => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }

    // 1. Strip code blocks, markdown symbols, emojis, and Urdu/Arabic script
    //    (no browser TTS voice can speak Urdu script — AI replies in Roman Urdu anyway)
    // 2. Replace newlines with ". " so the TTS pauses naturally between lines
    //    instead of merging "date 25 August" and "status high" into one breath
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_~`]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[\u0600-\u06FF]+/g, "")   // strip Urdu/Arabic script — unreadable by TTS
      .replace(/\n+/g, ". ")              // newlines → pause so lines don't merge
      .replace(/\.\s*\.\s*/g, ". ")       // collapse accidental double dots
      .trim();

    if (!cleanText) return;

    // Use the explicitly passed lang, or fall back to current speechLang state
    const activeLang = lang ?? speechLang;
    const isUrdu = activeLang === "ur-PK";

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (isUrdu) {
      const urduVoice = pinnedUrduVoiceRef.current;
      if (urduVoice) {
        utterance.voice = urduVoice;
        utterance.lang = urduVoice.lang.toLowerCase().startsWith("ur") ? "ur-PK" : "hi-IN";
      } else {
        // No South Asian voice on this device — fall back to English voice
        const enVoice = pinnedEnVoiceRef.current;
        if (enVoice) { utterance.voice = enVoice; utterance.lang = enVoice.lang; }
        else utterance.lang = "en-US";
      }
    } else {
      const enVoice = pinnedEnVoiceRef.current;
      if (enVoice) {
        utterance.voice = enVoice;
        utterance.lang = enVoice.lang;
      } else {
        utterance.lang = "en-US";
      }
    }

    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    utterance.onstart = () => { isSpeakingRef.current = true; setIsSpeaking(true); };
    utterance.onend = () => { isSpeakingRef.current = false; setIsSpeaking(false); };
    utterance.onerror = () => { isSpeakingRef.current = false; setIsSpeaking(false); };
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      // Stop listening — transcript already in the input box, user sends it manually
      recognitionRef.current.stop();
    } else {
      stopSpeaking(); // cancel any ongoing TTS before listening
      try {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    // Stop mic and TTS before sending
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    stopSpeaking();
    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 10-message window covers the full 6-step task-creation flow without losing early context
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.aiChat({
        message: text,
        focusedTaskId: focusedTask?._id,
        replyLang: speechLang,
        history,
      });

      const botMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.reply,
        suggestedSubtasks: res.suggestedSubtasks,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Refresh the Kanban board if the AI moved or deleted a task
      if (res.boardUpdated && onSubtasksCreated) onSubtasksCreated();

      if (voiceEnabled) speakText(res.reply);
    } catch (err) {
      const errorMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Error: ${(err as Error).message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleAddSubtasksToBoard = async (subtasks: SubtaskItem[]) => {
    setAddingSubtasks(true);
    try {
      for (const st of subtasks) {
        await api.createTask({
          title: st.title,
          priority: st.priority || "medium",
          status: st.status || "todo",
        });
      }
      if (onSubtasksCreated) onSubtasksCreated();

      const confirmMsg: AIChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Successfully added **${subtasks.length} subtasks** onto your Kanban board!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, confirmMsg]);
      if (voiceEnabled) speakText(`Added ${subtasks.length} subtasks to your board.`);
    } catch (err) {
      alert(`Failed to add subtasks: ${(err as Error).message}`);
    } finally {
      setAddingSubtasks(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#07131b]/98 shadow-2xl backdrop-blur-2xl">
        {/* Drawer Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-mint to-[#18c48c] text-ink shadow-mint">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <h2 className="font-display text-base font-bold tracking-tight text-cream">
                TaskFlow AI Assistant
              </h2>
              <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-fog">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                Groq AI · Context-Aware
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Toggle */}
            <button
              type="button"
              title={voiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
              className={`rounded-lg p-2 text-xs transition ${
                voiceEnabled
                  ? "bg-mint/15 text-mint border border-mint/30"
                  : "bg-white/5 text-fog border border-white/10"
              }`}
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setVoiceEnabled(!voiceEnabled);
              }}
            >
              {voiceEnabled ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Clear Chat History */}
            <button
              type="button"
              title="Clear this chat history"
              className="rounded-lg p-2 text-fog transition hover:bg-rose-500/15 hover:text-rose-400 border border-white/10 hover:border-rose-400/30"
              onClick={() => {
                if (!confirm("Clear this chat history?")) return;
                stopSpeaking();
                const contextId = currentContextRef.current === "general" ? null : currentContextRef.current;
                setMessages(clearHistory(contextId));
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="rounded-lg p-2 text-fog transition hover:bg-white/10 hover:text-cream"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* Focused Task Banner */}
        {focusedTask && (
          <div className="flex items-center justify-between border-b border-mint/20 bg-mint/10 px-4 py-2 text-xs">
            <span className="flex items-center gap-1.5 truncate text-mint">
              <strong className="shrink-0 font-bold">Focusing:</strong>
              <span className="truncate">{focusedTask.title}</span>
            </span>
            <button
              type="button"
              className="ml-2 shrink-0 font-bold text-fog hover:text-cream"
              onClick={onClearFocusedTask}
            >
              Clear
            </button>
          </div>
        )}

        {/* Quick Action Chips */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/5 bg-[#061017]/50 p-2.5 text-xs">
          <button
            type="button"
            className="whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-cream/90 transition hover:border-mint/40 hover:bg-mint/10"
            onClick={() => handleSend("Plan my day based on my current tasks and priorities.")}
          >
            ⚡ Plan My Day
          </button>
          <button
            type="button"
            className="whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-cream/90 transition hover:border-warn/40 hover:bg-warn/10"
            onClick={() => handleSend("Audit my board: which tasks are high risk or overdue?")}
          >
            🚨 Risk Check
          </button>
          <button
            type="button"
            className="whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-cream/90 transition hover:border-sky/40 hover:bg-sky/10"
            onClick={() => handleSend("Help me break down my largest task into actionable subtasks.")}
          >
            🪄 Break Down Task
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-gradient-to-r from-mint/20 to-mint/35 border border-mint/30 text-cream"
                    : "rounded-bl-sm border border-white/10 bg-[#0d212e]/85 text-[#dbe8ef] shadow-md backdrop-blur-md"
                }`}
              >
                {/* Description Missing Warning */}
                {m.isDescriptionMissing && (
                  <div className="mb-2.5 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong className="block font-bold">Description Missing</strong>
                      This task currently has no description. Tell the AI what you want to achieve!
                    </div>
                  </div>
                )}

                <FormattedMessage content={m.content} />

                {/* Suggested Subtasks Block */}
                {m.suggestedSubtasks && m.suggestedSubtasks.length > 0 && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-mint">Suggested Subtasks ({m.suggestedSubtasks.length})</span>
                    </div>
                    <ul className="mb-3 space-y-1.5 text-xs">
                      {m.suggestedSubtasks.map((st, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 p-2">
                          <span className="truncate">{st.title}</span>
                          <span className={badge[st.priority] ?? badge.medium}>{st.priority}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={addingSubtasks}
                      className={`${btnPrimary} w-full py-1.5 text-xs font-bold`}
                      onClick={() => handleAddSubtasksToBoard(m.suggestedSubtasks!)}
                    >
                      {addingSubtasks ? "Adding to board..." : "⚡ Add All to Board"}
                    </button>
                  </div>
                )}
              </div>
              <span className="mt-1 px-1 text-[0.68rem] text-fog/60">{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d212e]/85 px-4 py-3 text-sm text-fog">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-mint/20 border-t-mint" />
              Thinking with task context...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="flex items-center justify-between border-t border-mint/20 bg-mint/10 px-4 py-1.5 text-xs text-mint">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mint animate-ping" />
              Speaking response...
            </span>
            <button type="button" className="font-bold underline" onClick={stopSpeaking}>
              Stop
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#08151f] p-3">
          <div className="flex items-center gap-2">
            {/* Free Web Speech Microphone Button */}
            <button
              type="button"
              title={isListening ? "Listening — click to stop, then press ➤ to send" : "Click to speak"}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${
                isListening
                  ? "border-rose-400 bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse"
                  : "border-white/10 bg-white/5 text-fog hover:border-mint/40 hover:text-cream"
              }`}
              onClick={toggleMic}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Speech Language Switcher (Urdu / English) */}
            <button
              type="button"
              title="Click to switch microphone language between Urdu and English"
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition ${
                speechLang === "ur-PK"
                  ? "border-mint/50 bg-mint/15 text-mint shadow-[0_0_12px_rgba(46,230,166,0.2)]"
                  : "border-sky/50 bg-sky/15 text-sky shadow-[0_0_12px_rgba(76,195,255,0.2)]"
              }`}
              onClick={() => {
                const nextLang = speechLang === "ur-PK" ? "en-US" : "ur-PK";
                setSpeechLang(nextLang);
                if (recognitionRef.current) {
                  recognitionRef.current.lang = nextLang;
                }
              }}
            >
              <span>{speechLang === "ur-PK" ? "🇵🇰" : "🇬🇧"}</span>
              <span>{speechLang === "ur-PK" ? "Urdu" : "English"}</span>
            </button>

            <input
              className={`${field} py-2 text-sm`}
              placeholder={
                isListening
                  ? speechLang === "ur-PK"
                    ? "Urdu sun raha hoon... (Listening)"
                    : "Listening in English..."
                  : speechLang === "ur-PK"
                  ? "Urdu mein bolein ya likhein..."
                  : "Ask in English or type..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`${btnPrimary} h-10 px-3 py-2 text-sm font-bold`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-cream">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-[#b5cbda]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[0.82em] text-mint border border-mint/20"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function FormattedMessage({ content }: { content: string }) {
  const cleaned = content.replace(/\r\n/g, "\n");
  const blocks = cleaned.split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check if block starts with header hashtags: #, ##, ###
        if (/^#{1,4}\s+/.test(trimmed)) {
          const headerText = trimmed.replace(/^#{1,4}\s+/, "");
          return (
            <h4
              key={idx}
              className="font-display text-sm font-bold tracking-tight text-mint pt-1"
            >
              {renderInline(headerText)}
            </h4>
          );
        }

        // Check if block is a list (numbered 1. or bullet - )
        const lines = trimmed.split("\n");
        const isList = lines.every((line) => /^(\d+\.|\-|\*)\s+/.test(line.trim()));

        if (isList) {
          return (
            <ul key={idx} className="flex flex-col gap-2 pl-0.5 my-1">
              {lines.map((line, lIdx) => {
                const itemMatch = line.trim().match(/^(\d+\.|\-|\*)\s+(.*)/);
                const bullet = itemMatch ? itemMatch[1] : "•";
                const itemContent = itemMatch ? itemMatch[2] : line;
                const isNum = /^\d+\./.test(bullet);

                return (
                  <li key={lIdx} className="flex items-start gap-2 text-xs md:text-sm">
                    <span
                      className={`shrink-0 font-bold ${
                        isNum
                          ? "rounded-md bg-mint/15 px-1.5 py-0.5 text-[0.7rem] text-mint"
                          : "mt-1.5 h-1.5 w-1.5 rounded-full bg-mint"
                      }`}
                    >
                      {isNum ? bullet : null}
                    </span>
                    <span className="flex-1 leading-snug">{renderInline(itemContent)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-xs md:text-sm leading-relaxed text-[#dbe8ef]">
            {lines.map((l, lIdx) => (
              <span key={lIdx}>
                {renderInline(l)}
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
