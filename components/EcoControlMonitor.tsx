import React, { useState } from 'react';
import { EcoViolation } from '../types';
import { Eye, MapPin, AlertCircle, FileText, ScanLine, Trash2, Search, CheckCircle, Clock, Video, XCircle, Siren, UserCheck, Shield, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EcoControlMonitorProps {
  violations: EcoViolation[];
}

const EcoControlMonitor: React.FC<EcoControlMonitorProps> = ({ violations }) => {
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');

  const selectedViolation = violations.find(v => v.id === selectedViolationId);

  // Filter only unprocessed violations for the main list unless archive
  const displayViolations = violations.filter(v => activeTab === 'NEW' ? !processedIds.has(v.id) : processedIds.has(v.id));

  const handleProcess = (id: string, action: 'FINE' | 'WARN' | 'REJECT') => {
      // Mock API call simulation
      setProcessedIds(prev => new Set(prev).add(id));
      setSelectedViolationId(null);
      
      const messages = {
          'FINE': "Qoidabuzarlik tasdiqlandi. Jarima (MJtK 91-modda) IIB bazasiga yuborildi.",
          'WARN': "Ogohlantirish yuborildi. Hudud inspektoriga xabar berildi.",
          'REJECT': "Signal rad etildi. Tizim xatolik sifatida belgiladi."
      };
      
      // In a real app, we would use a toast notification here
      console.log(messages[action]);
  };

  // Mock AI Logic Timeline generator based on timestamp
  const getAiTimeline = (timestamp: string) => {
      const [hours, minutes] = timestamp.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 15); // detected at :15 seconds
      
      const formatTime = (d: Date) => d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });

      return [
          { time: formatTime(date), label: "Obyekt Aniqlandi (Odam + Yuk)", status: 'done', icon: Eye },
          { time: formatTime(new Date(date.getTime() + 7000)), label: "Ajralish (Yuk qoldirildi)", status: 'done', icon: Trash2 },
          { time: formatTime(new Date(date.getTime() + 10000)), label: "Tark Etish (Odam uzoqlashdi)", status: 'done', icon: UserCheck },
          { time: formatTime(new Date(date.getTime() + 30000)), label: "XAVF SIGNALI (>30s harakatsizlik)", status: 'alert', icon: Siren }
      ];
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm shrink-0 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Eye className="text-emerald-600" /> Eko-Nazorat Markazi</h2>
                <p className="text-xs text-slate-500 font-medium">Noqonuniy chiqindi tashlash (Drop & Leave) AI Tahlili</p>
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setActiveTab('NEW')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    Yangi Signallar <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">{violations.length - processedIds.size}</span>
                 </button>
                 <button onClick={() => setActiveTab('ARCHIVE')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ARCHIVE' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    Arxiv <span className="ml-1 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px]">{processedIds.size}</span>
                 </button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Incidents List */}
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto custom-scrollbar shrink-0">
                <div className="p-3 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input type="text" placeholder="Manzil yoki ID bo'yicha qidirish..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"/>
                    </div>
                </div>
                <div className="flex-1 p-3 space-y-2">
                    {displayViolations.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500"/>
                            <p className="text-xs font-bold text-slate-500">{activeTab === 'NEW' ? "Barcha qoidabuzarliklar ko'rib chiqildi" : "Arxiv bo'sh"}</p>
                        </div>
                    ) : (
                        displayViolations.map(violation => (
                            <div 
                                key={violation.id} 
                                onClick={() => setSelectedViolationId(violation.id)}
                                className={`p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${selectedViolationId === violation.id ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                        <Clock size={10} /> {violation.timestamp}
                                    </span>
                                    {!processedIds.has(violation.id) && (
                                        <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg animate-pulse border border-red-100">AI SIGNAL</span>
                                    )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 mb-1 leading-tight group-hover:text-emerald-700 transition-colors">{violation.locationName}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                    <MapPin size={10} /> {violation.mfy}
                                </div>
                                
                                {/* Mini Proof */}
                                <div className="h-16 rounded-lg overflow-hidden relative">
                                    <img src={violation.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 rounded backdrop-blur-sm">
                                        {violation.confidence}% Aniq
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Center & Right Panel: Evidence & Actions */}
            <div className="flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col">
                {selectedViolation ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                         <div className="grid grid-cols-12 gap-6 h-full">
                             
                             {/* CENTER: Main Evidence Scene */}
                             <div className="col-span-8 flex flex-col gap-6">
                                 {/* Video Player Mockup */}
                                 <div className="bg-black rounded-3xl overflow-hidden relative shadow-2xl group border-4 border-white aspect-video">
                                     <img src={selectedViolation.imageUrl} alt="Violation Evidence" className="w-full h-full object-cover"/>
                                     
                                     {/* AI Simulation Overlay */}
                                     <div className="absolute inset-0 pointer-events-none">
                                         {/* Timecode */}
                                         <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md text-white font-mono text-sm px-3 py-1 rounded-lg border border-white/10">
                                             REC • {selectedViolation.timestamp} • CAM-04
                                         </div>

                                         {/* Bounding Box: Load */}
                                         <div className="absolute bottom-1/4 right-1/4 w-32 h-32 border-2 border-red-500 border-dashed rounded-lg bg-red-500/10 flex items-center justify-center">
                                             <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded absolute -top-3 left-0 shadow-sm">
                                                 CHIQINDI (DROP)
                                             </div>
                                             <div className="text-white font-mono text-[10px] font-bold animate-pulse">
                                                 32s
                                             </div>
                                         </div>

                                         {/* Tracking Line */}
                                         <svg className="absolute inset-0 w-full h-full">
                                             <path d="M 400 400 Q 500 300 600 200" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                                             <circle cx="600" cy="200" r="4" fill="red" />
                                         </svg>

                                         {/* Alert Banner */}
                                         <div className="absolute top-6 left-6 flex gap-2">
                                             <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                                                 <AlertCircle size={14} /> NOQONUNIY TASHLAHQ
                                             </div>
                                         </div>
                                     </div>

                                     {/* Controls */}
                                     <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <div className="flex gap-4 text-white text-xs font-bold">
                                             <button className="hover:text-emerald-400"><Video size={16}/></button>
                                             <span>00:32 / 00:45</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* AI Logic Timeline */}
                                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                                     <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><ScanLine size={14}/> AI Algoritm Ketma-ketligi</h3>
                                     <div className="flex items-center justify-between relative">
                                         {/* Line */}
                                         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
                                         
                                         {getAiTimeline(selectedViolation.timestamp).map((step, idx) => (
                                             <div key={idx} className="flex flex-col items-center gap-2 bg-white px-2">
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.status === 'alert' ? 'bg-red-50 border-red-500 text-red-500' : 'bg-emerald-50 border-emerald-500 text-emerald-500'} shadow-sm`}>
                                                     <step.icon size={14} />
                                                 </div>
                                                 <div className="text-center">
                                                     <p className="text-[9px] font-bold text-slate-400 font-mono mb-0.5">{step.time}</p>
                                                     <p className={`text-[10px] font-bold ${step.status === 'alert' ? 'text-red-600' : 'text-slate-700'}`}>{step.label}</p>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>

                             {/* RIGHT: Face Capture & Actions */}
                             <div className="col-span-4 flex flex-col gap-4">
                                 {/* BEST SHOT CARD */}
                                 <div className="bg-white p-1 rounded-3xl shadow-lg border border-slate-200 overflow-hidden relative">
                                     <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-white/20">
                                         <ScanLine size={12} className="text-emerald-400" /> BEST SHOT
                                     </div>
                                     
                                     {/* Face Crop Image */}
                                     <div className="h-64 rounded-[20px] overflow-hidden relative bg-slate-900">
                                         <img 
                                            src={selectedViolation.offender?.faceImageUrl || selectedViolation.imageUrl} 
                                            alt="Face Crop" 
                                            className={`w-full h-full object-cover ${!selectedViolation.offender?.faceImageUrl ? 'scale-[2.5] object-top filter contrast-125' : ''}`}
                                         />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                         
                                         {/* ID Info */}
                                         <div className="absolute bottom-4 left-4 right-4">
                                             <div className="flex justify-between items-end">
                                                 <div>
                                                     <p className="text-[10px] text-emerald-400 font-bold mb-1">FACE ID MATCHED</p>
                                                     <h3 className="text-lg font-bold text-white leading-none">{selectedViolation.offender?.name || "Noma'lum Shaxs"}</h3>
                                                     <p className="text-xs text-slate-300 font-mono mt-1">ID: {selectedViolation.offender?.faceId}</p>
                                                 </div>
                                                 <div className="text-right">
                                                     <div className="text-2xl font-bold text-emerald-400">{selectedViolation.offender?.matchScore}%</div>
                                                     <p className="text-[9px] text-slate-400">ANIQLIK</p>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Details */}
                                 <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                                     <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><FileText size={14}/> Protokol Ma'lumotlari</h3>
                                     
                                     <div className="space-y-4 flex-1">
                                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                             <span className="text-xs font-bold text-slate-500">Lokatsiya</span>
                                             <span className="text-xs font-bold text-slate-800">{selectedViolation.locationName}</span>
                                         </div>
                                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                             <span className="text-xs font-bold text-slate-500">Huquqbuzarlik</span>
                                             <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Chiqindi Tashlash</span>
                                         </div>
                                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                             <span className="text-xs font-bold text-slate-500">Shaxsiy Ma'lumot</span>
                                             <div className="text-right">
                                                 <p className="text-xs font-bold text-slate-800">{selectedViolation.offender?.estimatedAge} yosh, {selectedViolation.offender?.gender === 'MALE' ? 'Erkak' : 'Ayol'}</p>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Action Buttons */}
                                     {!processedIds.has(selectedViolation.id) ? (
                                         <div className="space-y-3 mt-6">
                                             <button onClick={() => handleProcess(selectedViolation.id, 'FINE')} className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                                 <Shield size={16} /> JARIMA YOZISH (IIB)
                                             </button>
                                             <div className="grid grid-cols-2 gap-3">
                                                 <button onClick={() => handleProcess(selectedViolation.id, 'WARN')} className="py-3 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs hover:bg-amber-200 active:scale-95 transition-all">
                                                     EKO-INSPEKSIYA
                                                 </button>
                                                 <button onClick={() => handleProcess(selectedViolation.id, 'REJECT')} className="py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-200 active:scale-95 transition-all">
                                                     YOLG'ON SIGNAL
                                                 </button>
                                             </div>
                                         </div>
                                     ) : (
                                         <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                             <CheckCircle size={24} className="mx-auto text-emerald-500 mb-2" />
                                             <p className="text-xs font-bold text-emerald-700">Holat bo'yicha chora ko'rilgan</p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                         <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                             <Eye size={48} className="text-slate-400" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-600 mb-2">Eko-Nazorat Tizimi</h3>
                         <p className="text-sm font-medium text-slate-400 text-center max-w-xs">Batafsil tahlil va chora ko'rish uchun ro'yxatdan qoidabuzarlikni tanlang</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default EcoControlMonitor;