"use client";

// =================================================================================================
// IMPORTS AND CONFIGURATION / IMPORTACIONES Y CONFIGURACIÓN
// =================================================================================================

import React, { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import TutorialGuide from '../components/TutorialGuide';
import HistoryChat from '../components/HistoryChat';

// --- FIREBASE IMPORTS ---
import { auth, googleProvider, db } from '../lib/firebase'; // 🚩 Agregamos db
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // 🚩 Para guardar

// =================================================================================================
// USER INTERFACE / INTERFAZ DE USUARIO
// =================================================================================================
const LoadingOverlay = () => (
  <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
    <div className="bg-white/10 p-6 rounded-2xl border-l-4 border-t-4 border-r-[8px] border-b-[8px] border-white/20 backdrop-blur-md flex flex-col items-center">
        <div className="text-4xl font-black tracking-tighter mb-4 animate-pulse text-white">MTY+</div>
        <div className="w-48 h-1 bg-gray-500 overflow-hidden rounded-full">
            <div className="h-full bg-white animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-gray-300">Analyzing with Gemini...</p>
    </div>
  </div>
);

const AnalysisResultCard = ({ data, onClose }: { data: any, onClose: () => void }) => {
  if (!data) return null;
  return (
    <div className="absolute top-20 right-4 w-[400px] max-w-[90vw] max-h-[80vh] bg-white rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500 z-30 border-l-4 border-t-4 border-r-[12px] border-b-[12px] border-slate-900">
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar relative">
            <button 
                onClick={onClose}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
                ✕
            </button>
            <div className="mb-4">
                 <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border-l-2 border-t-2 border-r-4 border-b-4 border-blue-900">
                    {data.recomendacion_negocio?.giro || "Business"}
                </span>
            </div>
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl font-bold leading-tight text-slate-900 w-2/3">{data.zona_nombre}</h2>
                <div className="text-right">
                    <span className="block text-4xl font-black text-slate-900 leading-none">{data.score}</span>
                    <span className="text-[10px] font-bold text-gray-400">SCORE</span>
                </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-6 border-l-4 border-blue-500 pl-3 text-justify">
                {data.recomendacion_negocio?.justificacion || "No justification available."}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border-l-2 border-t-2 border-r-4 border-b-4 border-slate-200">
                    <span className="text-[9px] text-gray-400 uppercase block mb-1">Avg. Cost per m2</span>
                    <span className="font-bold text-[10px] text-slate-900 leading-tight block whitespace-pre-wrap">
                        {data.finanzas?.costo_m2_promedio || data.finanzas?.renta_mensual_estimada || "N/A"}
                    </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border-l-2 border-t-2 border-r-4 border-b-4 border-slate-200">
                    <span className="text-[9px] text-gray-400 uppercase block mb-1">Proj. ROI</span>
                    <span className="font-bold text-sm text-green-600">{data.finanzas?.roi_retorno || "N/A"}</span>
                </div>
            </div>
            <div className="space-y-4 mb-6">
                <div>
                    <h4 className="font-bold text-xs uppercase mb-2 text-slate-400 tracking-wider">Analysis</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2 text-justify">{data.analisis_demografico}</p>
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border-l-2 border-t-2 border-r-4 border-b-4 border-slate-100">"{data.analisis_competencia}"</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                      {data.pros?.slice(0,2).map((p:string, i:number) => (
                          <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                             <span className="text-green-500 font-bold mt-0.5">✓</span>{p}
                          </div>
                      ))}
                      {data.contras?.slice(0,1).map((c:string, i:number) => (
                          <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                             <span className="text-red-400 font-bold mt-0.5">⚠</span>{c}
                          </div>
                      ))}
                </div>
            </div>
            <div className="border-t-2 border-slate-100 pt-4 text-center">
                 <p className="text-[9px] text-slate-400 font-mono tracking-tight">
                     • Powered by Gemini • <br/>
                    <span className="text-[8px] opacity-70">Gemini can make mistakes, verify the information.</span>
                 </p>
            </div>
        </div>
    </div>
  );
};

// =================================================================================================
// MAIN LOGIC OF THE PAGE /  LÓGICA PRINCIPAL DE LA PÁGINA
// =================================================================================================

export default function Home() {
  const [reportData, setReportData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mapType, setMapType] = useState('roadmap'); 
  const [showConfig, setShowConfig] = useState(false); 

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
      });
      return () => unsubscribe();
  }, []);

  const handleLogin = async (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (error: any) {
          console.error("Error al iniciar sesión:", error);
          alert("Login error: " + error.message);
      }
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
      } catch (error) {
          console.error("Error al cerrar sesión:", error);
      }
  };

  useEffect(() => {
      const handleShowAnalysis = (event: CustomEvent) => {
          const item = event.detail;
          setReportData(item);
          setTutorialStep(4);
      };
      window.addEventListener('SHOW_ANALYSIS_ON_MAP' as any, handleShowAnalysis);
      return () => window.removeEventListener('SHOW_ANALYSIS_ON_MAP' as any, handleShowAnalysis);
  }, []);

  const handleStartAnalysis = async (lat: number, lng: number, address: string) => {
    setLoading(true);
    setReportData(null); 
    
    try {
      const res = await fetch('/api/analyze-plaza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: { lat, lng }, addressContext: address }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
           throw new Error(data.error || `Server Error: ${res.status}`);
      }

      if (data.result) {
        setReportData(data.result);
        setHistory(prev => [data.result, ...prev]); 
        
        if (auth.currentUser) {
            try {
                await addDoc(collection(db, "users", auth.currentUser.uid, "analyses"), {
                    ...data.result,
                    createdAt: serverTimestamp() 
                });
                console.log("Analysis saved to user account.");
            } catch (saveError) {
                console.error("Failed to save analysis to history:", saveError);
            }
        }

        setTutorialStep(2); 
        
      } else {
        throw new Error("API responded but no results were found.");
      }
    } catch (e: any) {
      alert(`⚠️ ANALYSIS FAILED:\n\n${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isMapDisabled = !!reportData || isMenuOpen || showHistoryList;

// =================================================================================================
// RENDERING AND VISUAL INTERFACE / RENDERIZADO E INTERFAZ VISUAL
// =================================================================================================
  return (
    <main className="h-screen w-full bg-slate-900 relative overflow-hidden font-sans text-slate-900">
      
      <div className="absolute inset-0 z-0">
         <MapComponent 
           onLocationSelect={handleStartAnalysis} 
           mapType={mapType} 
           interactionsDisabled={isMapDisabled} 
         />
         
         {loading && <LoadingOverlay />}

         {!loading && (
             <TutorialGuide 
               step={tutorialStep} 
               setStep={setTutorialStep} 
               onClose={() => setShowTutorial(false)} 
               reportData={reportData}
               isTour={showTutorial} 
             />
         )}

         {reportData && !loading && !showHistoryList && (
             <AnalysisResultCard 
               data={reportData} 
               onClose={() => setReportData(null)}
             />
         )}

         {showHistoryList && (
             <HistoryChat 
               history={history} 
               onClose={() => {
                   setShowHistoryList(false);
                   if (tutorialStep === 3) setShowTutorial(false);
               }}
             />
         )}

         {!showHistoryList && (
             <div className="absolute top-24 left-4 z-20 flex flex-col gap-2">
                <button 
                    onClick={() => {
                        if (tutorialStep === 3) {
                            setIsMenuOpen(true); 
                            setTutorialStep(4);
                        } else {
                            setIsMenuOpen(!isMenuOpen);
                        }
                    }}
                    className={`bg-white/95 backdrop-blur px-4 py-2 rounded-xl border-l-2 border-t-2 border-r-4 border-b-4 border-slate-900 flex items-center gap-2 hover:bg-slate-50 transition-all active:translate-y-1 active:border-b-2 active:border-r-2 ${tutorialStep === 3 ? 'ring-4 ring-blue-400 ring-opacity-50 animate-pulse' : ''}`}
                >
                    <span className="text-xl font-black text-slate-900 tracking-tighter">MTY<span className="font-light text-slate-600">PLUSVALÍA</span></span>
                    <span className="text-slate-400 text-xs transform transition-transform duration-300" style={{ rotate: isMenuOpen ? '180deg' : '0deg' }}>▼</span>
                </button>

                {isMenuOpen && (
                    <div className="bg-white rounded-xl border-l-2 border-t-2 border-r-[8px] border-b-[8px] border-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col min-w-[220px]">

                        <button 
                            onClick={() => { setShowHistoryList(true); setIsMenuOpen(false); }}
                            className={`px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 border-b-2 border-slate-100 transition-colors ${tutorialStep === 4 ? 'animate-pulse ring-2 ring-blue-400 ring-inset bg-blue-50' : ''}`}
                        >
                            <div className="relative w-5 h-5 shrink-0 scale-75 origin-center">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#FEF3C7] border-2 border-slate-900 rounded-md overflow-hidden"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#F87171]"></div>
                            </div>
                            <span className="flex-1">Saved Analyses</span>
                            {history.length > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full">{history.length}</span>}
                        </button>

                         <div className="border-b-2 border-slate-100">
                            {!user ? (
                                <button 
                                    onClick={handleLogin}
                                    className={`w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors`} 
                                >
                                     <svg className="text-blue-600 fill-blue-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                                     {/* 🚩 TEXTO CAMBIADO A "Account" */}
                                     <span>Account</span>
                                </button>
                            ) : (
                                <div className="px-4 py-3 bg-slate-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        {user.photoURL && (
                                            <img 
                                                src={user.photoURL} 
                                                alt="Profile" 
                                                className="w-8 h-8 rounded-full border-2 border-slate-900"
                                            />
                                        )}
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="text-[10px] text-red-500 font-bold hover:underline w-full text-left"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className={`bg-slate-50/50`}> 
                            <button 
                                onClick={() => setShowConfig(!showConfig)} 
                                className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors justify-between"
                            >
                                <div className="flex items-center gap-3">
                                     <svg className="text-slate-400 fill-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                     <span>Settings</span>
                                </div>
                                <span className="text-[10px] text-slate-400">{showConfig ? '▲' : '▼'}</span>
                            </button>
                            
                            {showConfig && (
                                <div className="px-4 pb-3 pt-1 space-y-3 animate-in fade-in slide-in-from-top-1 bg-white border-t-2 border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Map Type</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setMapType('roadmap')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold rounded border-l-2 border-t-2 border-r-4 border-b-4 transition-all active:border-b-2 active:border-r-2 active:translate-y-1 ${mapType === 'roadmap' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                Normal
                                            </button>
                                            <button 
                                                onClick={() => setMapType('satellite')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold rounded border-l-2 border-t-2 border-r-4 border-b-4 transition-all active:border-b-2 active:border-r-2 active:translate-y-1 ${mapType === 'satellite' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                Satellite
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Support</p>
                                        <button 
                                            onClick={() => {
                                                setReportData(null);
                                                setShowTutorial(true);
                                                setTutorialStep(0);
                                                setIsMenuOpen(false);
                                                setShowConfig(false);
                                            }}
                                            className="w-full py-1.5 text-[10px] font-bold rounded border-l-2 border-t-2 border-r-4 border-b-4 border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all active:border-b-2 active:border-r-2 active:translate-y-1"
                                        >
                                            Repeat Interactive Guide
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
         )}
      </div>
    </main>
  );
}