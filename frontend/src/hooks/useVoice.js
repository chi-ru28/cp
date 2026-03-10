import { useState, useRef, useCallback } from 'react';

// Maps our lang code to browser SpeechRecognition locale
const LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

const useVoice = (lang = 'en') => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const browserLang = LANG_MAP[lang] || 'en-IN';

  const startListening = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = browserLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      console.warn('STT error:', e.error);
      setListening(false);
    };
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      if (onResult) onResult(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [browserLang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // Text-to-Speech using Web Speech API
  const speak = useCallback((text, overrideLang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop any current speech

    // Strip markdown characters for cleaner speech
    const cleanText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .substring(0, 500); // limit to 500 chars

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = overrideLang || browserLang;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [browserLang]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { listening, transcript, startListening, stopListening, speak, cancelSpeech };
};

export default useVoice;
