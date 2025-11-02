import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  addEventListener: (event: string, callback: (event: Event) => void) => void;
  removeEventListener: (event: string, callback: (event: Event) => void) => void;
  start: () => void;
  stop: () => void;
}

interface RecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface RecognitionErrorEvent extends Event {
  error: string;
}

type RecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    webkitSpeechRecognition?: RecognitionConstructor;
    SpeechRecognition?: RecognitionConstructor;
  }
}

export const useSpeechToText = () => {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      setIsSupported(true);
      const instance = new Recognition();
      instance.lang = 'ja-JP';
      instance.continuous = false;
      instance.interimResults = false;
      recognitionRef.current = instance;
    }
  }, []);

  const listen = useCallback((onResult: (text: string) => void, onError?: (message: string) => void) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const handleResult = (event: Event) => {
      const speechEvent = event as RecognitionResultEvent;
      const transcript = Array.from(speechEvent.results)
        .map((result) => result[0].transcript)
        .join('');
      onResult(transcript);
      cleanup();
    };

    const handleError = (event: Event) => {
      const errorEvent = event as RecognitionErrorEvent;
      onError?.(errorEvent.error);
      cleanup();
    };

    const cleanup = () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.stop();
      setIsListening(false);
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    setIsListening(true);
    recognition.start();

    return cleanup;
  }, []);

  return { isSupported, isListening, listen };
};
