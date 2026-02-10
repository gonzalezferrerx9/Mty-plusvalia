import React, { useState, useRef, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface HistoryChatProps {
  history: any[];
  onClose: () => void;
  setHistory?: React.Dispatch<React.SetStateAction<any[]>>; 
}

// --- List Item Component ---
const AnalysisItem = ({ item, idx, onSelect, onDelete }: any) => {
    // Score-based color logic
    const scoreColor = item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div 
            className="bg-white p-3 rounded-xl border-l-2 border-t-2 border-r-4 border-b-4 border-slate-200 hover:border-blue-400 hover:border-r-blue-600 hover:border-b-blue-600 transition-colors cursor-pointer group mb-2 relative"
        >
            <div className="pr-8" onClick={() => onSelect(item)}>
                <div className="flex justify-between items-start mb-1">
                     <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-black/10 ${scoreColor}`}>
                        {item.score}/100
                     </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                </div>
                
                {/* Updated to English Keys */}
                <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-blue-600">{item.zone_name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 text-justify">{item.business_recommendation?.type}</p>
            </div>

            {/* Delete Button */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Are you sure you want to delete this analysis?")) {
                        onDelete(item);
                    }
                }}
                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                title="Delete analysis"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    );
};


const HistoryChat: React.FC<HistoryChatProps> = ({ history, onClose, setHistory }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  
  const handleSelectAnalysis = (item: any) => {
      onClose(); 
      window.dispatchEvent(new CustomEvent('SHOW_ANALYSIS_ON_MAP', { detail: item }));
  };

  const handleDeleteAnalysis = (itemToDelete: any) => {
      if (setHistory) {
          setHistory(prevHistory => prevHistory.filter(item => item !== itemToDelete));
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-white w-full max-w-md h-[80vh] rounded-2xl overflow-hidden flex flex-col relative border-l-4 border-t-4 border-r-[12px] border-b-[12px] border-slate-900">
            
            {/* HEADER */}
            <div className="p-4 border-b-4 border-slate-900 flex justify-between items-center bg-white shrink-0">
                <h3 className="font-black text-slate-800 tracking-tight text-lg uppercase">Saved Analyses ({history.length})</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>

            {/* LIST AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                         <div className="text-4xl mb-4">📂</div>
                         <p className="text-sm font-bold text-slate-500">No saved analyses</p>
                         <p className="text-xs text-slate-400 mt-2">Explore the map and request an analysis to see it here.</p>
                    </div>
                )}
                
                {history.map((item, idx) => (
                    <AnalysisItem 
                        key={idx} 
                        item={item} 
                        idx={idx} 
                        onSelect={handleSelectAnalysis}
                        onDelete={handleDeleteAnalysis}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

export default HistoryChat;