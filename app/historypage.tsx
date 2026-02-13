"use client";

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase'; // Ensure the path is correct
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchAnalyses(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAnalyses = async (userId: string) => {
    try {
      // Simple query: Fetch only THIS user's analyses
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date (newest to oldest) on the client
      // to avoid complex index errors in Firestore for now
      data.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAnalyses(data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- STATE RENDERS ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-600">
        <span className="animate-pulse font-bold text-lg">Loading your history...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🔒 Access Required</h2>
          <p className="text-gray-500 mb-6">You need to log in to view your saved analyses.</p>
          {/* You could put a button here to go to login or open the popup */}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">📂 My Analyses</h1>
            <p className="text-gray-500 text-sm">History of saved investment opportunities.</p>
          </div>
          <div className="text-right">
             <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
               {analyses.length} Analyses found
             </span>
          </div>
        </header>
        
        {analyses.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-bold text-gray-700">You don't have any saved analyses yet</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
              Go to the map, search for an area, and generate an AI analysis. They will be saved here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                     <span className="text-xl">📍</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-black ${
                    item.score >= 80 ? 'bg-green-100 text-green-700' : 
                    item.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    SCORE: {item.score}/100
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1 line-clamp-2">
                  {item.zona_nombre || "Unnamed Zone"}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date'}
                </p>

                {/* Key Details */}
                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl flex-grow">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Business:</span>
                    <span className="font-semibold text-gray-800 text-right">{item.recomendacion_negocio?.giro || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Investment:</span>
                    <span className="font-semibold text-blue-700">{item.finanzas?.inversion_total_estimada || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ROI:</span>
                    <span className="font-semibold text-green-700">{item.finanzas?.roi_retorno || "N/A"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 mt-auto">
                  <button className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    VIEW FULL DETAILS →
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}