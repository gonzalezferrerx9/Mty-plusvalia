import React, { useState, useEffect, useRef } from 'react';

interface TutorialGuideProps {
  step: number;
  setStep: (step: number) => void;
  onClose: () => void;
  reportData?: any;
  isTour?: boolean; 
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ step, setStep, onClose, reportData, isTour = true }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<string | null>(null);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAnalysisText, setShowAnalysisText] = useState(false);
  const [analysisFinished, setAnalysisFinished] = useState(false); 
  
  // 🚩 WELCOME
  const [introFinished, setIntroFinished] = useState(false);

  // STOP WELCOME
  const isSkippedRef = useRef(false);
  const lastSpokenReportRef = useRef<any>(null);

  const cleanTextForSpeech = (text: string) => {
      if (!text) return "";
      return text
          .replace(/\$/g, "") 
          .replace(/USD/g, "dollars") 
          .replace(/m2/g, "square meters")
          .replace(/ROI/g, "return on investment")
          .replace(/\//g, " per ") 
          .replace(/"/g, "")
          .trim();
  };
  
  let analysisBody = "";
  let analysisClosing = "And that's it! Here is your full report. Now click Continue to see how the platform menu works.";

  if (reportData) {
      const zone = reportData.zona_nombre || "the selected area";
      const giro = reportData.recomendacion_negocio?.giro || "a profitable business";
      const justification = reportData.recomendacion_negocio?.justification || "";
      const demographics = reportData.analisis_demografico || "";
      const competition = reportData.analisis_competencia || "";
      const avgCost = reportData.finanzas?.costo_m2_promedio || "not available";
      const roi = reportData.finanzas?.roi_retorno || "pending";
      const pros = reportData.pros ? reportData.pros.join(". ") : "";
      const contras = reportData.contras ? reportData.contras.join(". ") : "";

      analysisBody = `
        Analysis finished for ${zone}. My suggestion is: ${giro}. ${justification}. 
        Regarding the financials, the average cost per square meter is ${avgCost} and the projected return on investment is ${roi}. 
        In my detailed analysis, I found that ${demographics}. Also, concerning the competition: ${competition}. 
        The key advantages are: ${pros}. Please take into account these considerations: ${contras}.
      `;
  }

  const steps = [
      {
          title: "Hello! Welcome",
          desc: "I'm your real estate AI expert. Welcome to Mty Plusvalia platform, here you will find the best investment opportunities in Monterrey metropolitan area.",
          spokenText: "Hello! I'm Bricky, your real estate AI expert. Welcome to MTY PLUSVALÍA platform, here you will find the best investment opportunities in Monterrey metropolitan area . To start, click the blue button.",
          buttonText: "Start"
      },
      {
          title: "1. Explore the Map",
          desc: "Navigate through the city. Click on any point you want to investigate so I can perform my analysis. Avoid uninhabitable zones like highways or protected natural areas.",
          buttonText: null 
      },
      {
          title: "2. Full Analysis",
          desc: analysisClosing, 
          spokenText: "", 
          buttonText: analysisFinished ? "Continue" : null 
      },
      {
          title: "3. Menu Tour",
          desc: "In the MTY PLUSVALÍA button, you'll find the platform menu. You can check your saved analyses, manage your account, or change settings. If you need this tutorial again, you can find me in the Settings section.",
          spokenText: "In the MTY PLUSVALÍA button, you will find the platform menu. There, you can consult your saved reports and modify your settings. If you ever need this interactive tutorial again, you can find me in the Settings section.",
          buttonText: "Got it"
      }
  ];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
        if (isSkippedRef.current) return resolve();

        if (loopTimerRef.current) {
            clearTimeout(loopTimerRef.current);
            loopTimerRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();
        
        setIsSpeaking(true);

        const cleanText = cleanTextForSpeech(text);

        const onComplete = () => {
            setIsSpeaking(false);
            if (step === 0 && !isSkippedRef.current) setIntroFinished(true);
            resolve();
        };

        try {
            const res = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText }) 
            });
            
            if (!res.ok) throw new Error("API Failed");

            const data = await res.json();
            
            if (isSkippedRef.current) {
                setIsSpeaking(false);
                resolve();
                return;
            }

            if (data.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                audioRef.current = audio;
                
                audio.onended = () => {
                    onComplete();
                    if(step === 0 && isTour && !isSkippedRef.current) handleAudioEnd();
                };
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        setIsSpeaking(false);
                        if (!isSkippedRef.current) setPendingAudio(text);
                        resolve(); 
                    });
                }
                return; 
            }
        } catch (e) {
            console.warn("FALLBACK ACTIVATED:", e);
            if (!isSkippedRef.current) speakBrowserFallback(cleanText, onComplete);
        }
    });
  };

  const speakBrowserFallback = (text: string, onComplete: () => void) => {
    if (isSkippedRef.current) return; 

    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        setTimeout(() => speakBrowserFallback(text, onComplete), 100);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
        onComplete();
        if(step === 0 && isTour && !isSkippedRef.current) handleAudioEnd();
    };
    utterance.onerror = () => onComplete();

    const englishVoice = voices.find(v => (v.name.includes('Google') && v.name.includes('English')) || v.name.includes('Samantha') || v.name.includes('Zira'));

    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    utterance.pitch = 1.8; 
    utterance.rate = 1.05; 
    
    window.speechSynthesis.speak(utterance);
  };

  const handleAudioEnd = () => {
      if (step === 0 && !isSkippedRef.current) {
          loopTimerRef.current = setTimeout(() => {
              const currentStep = steps[0];
              const textToSpeak = (currentStep as any).spokenText || currentStep.desc;
              speak(textToSpeak);
          }, 10000); 
      }
  };

  useEffect(() => {
      const unlockAudio = () => {
          if (pendingAudio && !isSkippedRef.current) {
              speak(pendingAudio);
              setPendingAudio(null);
          }
      };
      if (pendingAudio) {
          window.addEventListener('click', unlockAudio, { once: true });
          window.addEventListener('touchstart', unlockAudio, { once: true });
      }
      return () => {
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
      };
  }, [pendingAudio]);

  useEffect(() => {
     if (typeof window !== 'undefined') window.speechSynthesis.getVoices(); 
     if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
     
     if (step === 0) {
        isSkippedRef.current = false;
        setIntroFinished(false); 
     }

     if (step === 2) {
         setShowAnalysisText(false);
         setAnalysisFinished(false); 
     } else {
         setShowAnalysisText(true);
     }

     const runStepAudio = async () => {
         if (isSkippedRef.current) return;

         const currentStep = steps[step];
         
         if (step === 2) {
             if (analysisBody) {
                 if (lastSpokenReportRef.current !== reportData) {
                    await speak(analysisBody);
                    lastSpokenReportRef.current = reportData;
                    if (!isTour) {
                        setTimeout(() => setStep(4), 1000); 
                    }
                 }
                 setShowAnalysisText(true);
                 if (isTour) await speak(analysisClosing);
                 setAnalysisFinished(true); 
             }
         } else if (currentStep) {
             const textToSpeak = (currentStep as any)?.spokenText || currentStep?.desc;
             if (textToSpeak && textToSpeak !== "Analyzing...") {
                 speak(textToSpeak);
             }
         }
     };

     const t = setTimeout(runStepAudio, 50);
     
     return () => clearTimeout(t);
  }, [step, reportData, isTour]); 


  const handleNext = () => {
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      if (step === 2) {
          setStep(3);
      } else if (step === 3) {
          onClose(); 
      } else {
          setStep(step + 1);
      }
  };

  const handleSkip = () => {
      isSkippedRef.current = true;
      setPendingAudio(null);
      setIntroFinished(true); 
      
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
      }
      
      window.speechSynthesis.cancel();
      
      setIsSpeaking(false);
      setStep(4); 
      onClose(); 
  };

  const currentStep = steps[step]; 
  const isWelcome = step === 0;
  
  const isResultShown = step === 2; 
  const isChatMode = step === 3; 
  
  // LÓGIC
  const showButton = isWelcome 
        ? introFinished 
        : (currentStep && currentStep.buttonText && (!isSpeaking || step === 2 || step === 3));

  const isBubbleVisible = !!currentStep && (step === 2 ? isTour : true);
  const showDescription = isBubbleVisible;
  const displayStep = step;

  if (!currentStep && step >= steps.length && !isWelcome) {
      return null;
  }

  return (
    <>
        <div 
            className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-md transition-opacity duration-700 ${isWelcome ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden="true"
        />

        <div 
            className={`
                z-[60] flex flex-col transition-all duration-1000 ease-in-out
                ${isWelcome 
                    ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center scale-110' 
                    : isResultShown
                        ? 'fixed top-24 right-[440px] items-end scale-90 origin-top-right'
                    : isChatMode
                        ? 'fixed top-44 left-64 items-start scale-75 origin-top-left' 
                        : 'absolute bottom-24 left-2 md:left-1/2 md:-translate-x-1/2 items-end pointer-events-none'
                }
            `}
        >
          <div className={`relative w-40 h-40 shrink-0 transition-all duration-1000 
              ${isWelcome ? 'mb-8' : ''}
              ${!isWelcome && !isResultShown && !isChatMode ? 'scale-[0.6] origin-bottom-left -mb-6 md:-mb-2' : ''}
              ${isResultShown ? 'scale-[0.8] origin-bottom-right mb-0' : ''}
          `}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/10 rounded-full blur-sm transition-all duration-300"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-24 bg-[#FEF3C7] border-l-2 border-t-2 border-r-[8px] border-b-[8px] border-slate-900 rounded-xl z-10 overflow-hidden">
                    <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full opacity-50"></div>
                    <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-50"></div>
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-36 h-0 border-l-[10px] border-r-[10px] border-b-[30px] border-l-transparent border-r-transparent border-b-[#F87171] z-20 drop-shadow-[0_4px_0px_rgba(15,23,42,1)]">
                    <div className="absolute top-2 left-[-20px] w-full h-[2px] bg-black/10 rotate-1"></div>
                    <div className="absolute top-4 left-[-10px] w-full h-[2px] bg-black/10 rotate-1"></div>
            </div>
            <div className="absolute top-2 right-8 w-5 h-8 bg-slate-200 border-l-2 border-t-2 border-r-[6px] border-b-[6px] border-slate-900 z-0">
                <div className="absolute -top-6 right-0 w-8 h-8 flex justify-center items-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-20"></span>
                </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-12 z-30 flex flex-col items-center">
                <div className="flex gap-1 items-center">
                    <div className="w-8 h-8 bg-white border-[3px] border-slate-900 rounded-full flex items-center justify-center relative overflow-hidden">
                            <div className="w-2 h-2 bg-slate-900 rounded-full animate-blink"></div>
                    </div>
                    <div className="w-2 h-1 bg-slate-900"></div>
                    <div className="w-8 h-8 bg-white border-[3px] border-slate-900 rounded-full flex items-center justify-center relative overflow-hidden">
                            <div className="w-2 h-2 bg-slate-900 rounded-full animate-blink"></div>
                    </div>
                </div>
                <div className={`w-4 h-3 bg-slate-900 rounded-b-full mt-1 ${isSpeaking ? 'animate-mouth-talk' : ''}`}></div>
            </div>
            <svg className="absolute bottom-6 -left-4 w-12 h-12 z-20 text-slate-900 animate-left-arm" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 10 Q 10 20 10 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-12 -right-6 w-12 h-1 bg-slate-900 rotate-[-45deg] z-20 animate-arm-pointing origin-bottom-left rounded-full shadow-sm"></div>
          </div>

          <div className={`
                pointer-events-auto bg-white border-l-2 border-t-2 border-r-[8px] border-b-[8px] border-slate-900 
                p-4 rounded-2xl relative transition-all duration-500
                ${isWelcome ? 'max-w-lg text-center' : ''} 
                ${!isWelcome && !isResultShown && !isChatMode ? 'max-w-[280px] rounded-bl-none mb-10' : ''}
                ${isResultShown ? 'max-w-[200px] text-xs rounded-tr-none mr-4 mt-2 border-slate-900' : ''}
                ${isChatMode ? 'max-w-[250px] rounded-tl-none ml-20 mt-4' : ''}
                ${!isBubbleVisible ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
          `}>
            
            {currentStep && (
                <>
                    {!isWelcome && !isResultShown && !isChatMode && (
                        <div className="absolute bottom-[-8px] -left-2 w-4 h-4 bg-white transform rotate-45 translate-x-1 translate-y-[1px] -z-10 border-l-2 border-b-[8px] border-slate-900"></div>
                    )}
                    {isResultShown && isBubbleVisible && (
                        <div className="absolute top-4 -right-[10px] w-4 h-4 bg-white transform rotate-45 translate-x-1 -z-10 border-r-[8px] border-t-2 border-slate-900"></div>
                    )}
                    {isChatMode && (
                        <div className="absolute top-4 -left-2 w-4 h-4 bg-white transform rotate-45 -translate-x-1 -z-10 border-l-2 border-b-2 border-slate-900"></div>
                    )}

                    <div className={`flex items-start mb-2 ${isWelcome ? 'justify-center' : 'justify-between'}`}>
                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-wider bg-yellow-300 px-2 rounded-sm inline-block">AI Advisor</h4>
                        {!isWelcome && <span className="text-[10px] font-bold text-slate-400">{displayStep}/3</span>}
                    </div>
                    
                    <div key={step} className="animate-in fade-in zoom-in duration-300">
                        <h3 className={`font-bold text-slate-900 leading-tight mb-1 ${isWelcome ? 'text-2xl' : 'text-xs'}`}>
                            {currentStep.title}
                        </h3>
                        
                        {showDescription && (
                            <p className={`text-slate-600 font-medium leading-relaxed mb-2 text-justify ${isWelcome ? 'text-base' : 'text-[10px]'} animate-in fade-in`}>
                            {currentStep.desc}
                            </p>
                        )}
                        
                        <div className="flex gap-2 justify-end mt-2">
                            {isWelcome && (
                                <button
                                    onClick={handleSkip}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-sm px-3 py-2 transition-colors"
                                >
                                    Skip Tutorial
                                </button>
                            )}

                            {showButton && (
                                <button 
                                    onClick={handleNext}
                                    className={`
                                        bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all active:translate-y-1 animate-in fade-in zoom-in duration-500
                                        border-l-2 border-t-2 border-r-4 border-b-4 border-blue-900 active:border-b-0 active:border-r-0 active:border-2
                                        ${isWelcome ? 'px-6 py-2 text-lg' : 'text-[9px] px-2 py-1 ml-auto block'}
                                    `}
                                >
                                    {currentStep.buttonText}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
          </div>
        </div>
    </>
  );
};

export default TutorialGuide;