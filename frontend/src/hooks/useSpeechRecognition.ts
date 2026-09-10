"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: "aborted" | "audio-capture" | "network" | "no-speech" | "not-allowed" | "service-not-allowed" | string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(onTranscript?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(() =>
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [offline, setOffline] = useState(() =>
    typeof navigator !== "undefined" && !navigator.onLine
  );
  const [error, setError] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => {
      setOffline(true);
      recognitionRef.current?.stop();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      recognitionRef.current?.stop();
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (offline) {
      setError("Voice input needs an internet connection.");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      const cleanTranscript = transcript.trim();
      if (cleanTranscript) onTranscriptRef.current?.(cleanTranscript);
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "audio-capture": "No microphone was found. Connect a microphone and try again.",
        network: "The browser voice service is unavailable. Check your connection or try Chrome/Safari.",
        "no-speech": "No speech was detected. Try speaking closer to the microphone.",
        "not-allowed": "Microphone permission was denied. Allow microphone access in your browser settings.",
        "service-not-allowed": "The browser voice service is not allowed for this page.",
      };
      if (event.error !== "aborted") setError(messages[event.error] ?? `Voice input failed (${event.error}). Try again.`);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Voice input could not start. Check microphone permission and try again.");
      setIsListening(false);
    }
  }, [offline]);

  return {
    error,
    isListening,
    offline,
    supported,
    startListening,
    stopListening,
  };
}
