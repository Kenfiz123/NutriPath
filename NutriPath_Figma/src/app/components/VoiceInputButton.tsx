import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "../language";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface VoiceInputButtonProps {
  onTranscript(text: string): void;
  className?: string;
  title?: string;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function VoiceInputButton({ onTranscript, className = "", title }: VoiceInputButtonProps) {
  const { locale, t } = useLanguage();
  const [listening, setListening] = useState(false);
  const supported = Boolean(getSpeechRecognition());
  const resolvedTitle = title ? t(title) : t("Nhập bằng giọng nói");

  const handleClick = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition || listening) return;
    const recognition = new Recognition();
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!supported || listening}
      title={supported ? resolvedTitle : t("Trình duyệt chưa hỗ trợ nhập giọng nói")}
      className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        listening
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200"
          : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400"
      } ${className}`}
      aria-label={resolvedTitle}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
