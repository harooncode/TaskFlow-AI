import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { badge, btn, btnDanger, btnPrimary, btnSmall, card, field } from "../ui";
import type { AIChatMessage, SubtaskItem, Task } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  focusedTask: Task | null;
  onClearFocusedTask: () => void;
  onSubtasksCreated?: () => void;
}

export default function AICopilotDrawer({
  isOpen,
  onClose,
  focusedTask,
  onClearFocusedTask,
  onSubtasksCreated,
}: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **TaskFlow AI Copilot**.\n\nI am grounded in your live tasks and deadlines. You can ask me to **plan your day**, **audit bottlenecks**, or **guide you** through executing any task.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [addingSubtasks, setAddingSubtasks] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Setup Web Speech Recognition (100% Free Browser Native)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
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
        setMessages((prev) => [...prev, botMsg]);
        if (voiceEnabled) speakText(res.reply);
      } catch (err) {
        console.error("AI Guidance error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskGuidance();
  }, [focusedTask, isOpen]);

  // Text to Speech (100% Free Browser Native)
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Clean markdown symbols for cleaner pronunciation
    const cleanText = text
      .replace(/[*_#`~]/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[.*?\]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

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
      const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.aiChat({
        message: text,
        focusedTaskId: focusedTask?._id,
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#07131b]/95 shadow-2xl backdrop-blur-2xl">
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
                TaskFlow AI Copilot
              </h2>
              <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-fog">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                Groq 70B · Context-Aware
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

                <div className="whitespace-pre-wrap">{m.content}</div>

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
              title={isListening ? "Listening... click to stop" : "Speak to AI"}
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

            <input
              className={`${field} py-2 text-sm`}
              placeholder={isListening ? "Listening to your voice..." : "Ask your AI Copilot..."}
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
