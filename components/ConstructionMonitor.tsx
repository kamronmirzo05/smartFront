import React, { useState, useEffect } from 'react';
import { ConstructionSite, ConstructionMission, ConstructionStage } from '../types';
import { MOCK_CONSTRUCTION_SITES } from '../constants';
import { HardHat, Hammer, Calendar, Camera, AlertTriangle, CheckCircle, Clock, Plus, Video, Eye, MoreHorizontal, History, X, Save, TrendingUp, AlertCircle, Scan, Cast, MonitorPlay, Check, Plane, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConstructionMonitor: React.FC = () => {
  const [sites, setSites] = useState<ConstructionSite[]>(MOCK_CONSTRUCTION_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(sites[0].id);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // View Mode
  const [viewMode, setViewMode] = useState<'CAMERA' | 'DRONE' | '3D'>('CAMERA');

  // Add Site Form State
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newSiteCamera, setNewSiteCamera] = useState('');
  const [newMissions, setNewMissions] = useState<{stage: ConstructionStage, date: string}[]>([
      { stage: 'KOTLOVAN', date: '' },
      { stage: 'FUNDAMENT', date: '' },
      { stage: 'KARKAS_1', date: '' },
      { stage: 'TOM_YOPISH', date: '' }
  ]);

  // Camera Test State
  const [cameraTestStatus, setCameraTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const selectedSite = sites.find(s => s.id === selectedSiteId);

  // Mock Analysis Update (Simulate AI detecting changes)
  useEffect(() => {
    const interval = setInterval(() => {
        setSites(prev => prev.map(site => {
            // Randomly update worker count to simulate live feed
            if (site.id === selectedSiteId) {
                return {
                    ...site,
                    detectedObjects: {
                        ...site.detectedObjects,
                        workers: Math.max(0, site.detectedObjects.workers + Math.floor(Math.random() * 3) - 1)
                    }
                };
            }
            return site;
        }));
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedSiteId]);

  const handleTestCamera = () => {
    if (!newSiteCamera) return;
    setCameraTestStatus('LOADING');
    const img = new Image();
    img.onload = () => setCameraTestStatus('SUCCESS');
    img.onerror = () => setCameraTestStatus('ERROR');
    img.src = newSiteCamera;
  };

  const handleAddSite = () => {
      if (!newSiteName || !newSiteAddress) return;

      const missions: ConstructionMission[] = newMissions.map((m, i) => ({
          id: `M-NEW-${i}`,
          stageName: m.stage === 'KOTLOVAN' ? 'Kotlovan qazish' : m.stage === 'FUNDAMENT' ? 'Fundament quyish' : m.stage === 'KARKAS_1' ? '1-qavat karkasi' : 'Tom yopish',
          stageType: m.stage,
          deadline: m.date || '2025-01-01',
          status: 'PENDING',
          progress: 0
      }));

      // Auto-set first mission to in-progress for demo
      if (missions.length > 0) {
          missions[0].status = 'IN_PROGRESS';
          missions[0].progress = 10;
      }

      const newSite: ConstructionSite = {
          id: `CONST-${Date.now()}`,
          name: newSiteName,
          address: newSiteAddress,
          contractorName: "Yangi Pudratchi MChJ",
          cameraUrl: newSiteCamera || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
          startDate: new Date().toISOString().split('T')[0],
          status: 'ON_TRACK',
          overallProgress: 0,
          currentAiStage: 'KOTLOVAN',
          aiConfidence: 85,
          detectedObjects: { workers: 5, cranes: 1, trucks: 1 },
          missions: missions,
          history: []
      };

      setSites([...sites, newSite]);
      setShowAddModal(false);
      setNewSiteName('');
      setNewSiteAddress('');
      setNewSiteCamera('');
      setCameraTestStatus('IDLE');
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ON_TRACK': return 'bg-emerald-500';
          case 'WARNING': return 'bg-amber-500';
          case 'CRITICAL': return 'bg-red-600';
          default: return 'bg-slate-400';
      }
  };

  const getStageLabel = (stage: ConstructionStage) => {
      switch(stage) {
          case 'KOTLOVAN': return 'Kotlovan (Yer ishlari)';
          case 'FUNDAMENT': return 'Fundament (Beton)';
          case 'KARKAS_1': return '1-Qavat Karkasi';
          case 'KARKAS_FULL': return 'To\'liq Karkas';
          case 'TOM_YOPISH': return 'Tom Yopish';
          case 'PARDOZLASH': return 'Pardozlash';
          default: return stage;
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm shrink-0 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><HardHat className="text-orange-500" /> Raqamli Qurilish Pasporti</h2>
                <p className="text-xs text-slate-500 font-medium">Qurilish obyektlari monitoringi va AI nazorati</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all">
                <Plus size={16}/> Yangi Obyekt Qo'shish
            </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
             {/* Sidebar List */}
             <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto custom-scrollbar shrink-0">
                 <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Obyektlar Ro'yxati</span>
                 </div>
                 <div className="flex-1 p-2 space-y-2">
                    {sites.map(site => (
                        <div 
                            key={site.id} 
                            onClick={() => setSelectedSiteId(site.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md flex flex-col gap-2 ${selectedSiteId === site.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">{site.name}</h4>
                                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(site.status)}`}></div>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">{site.address}</p>
                            
                            {/* Mini Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                <div className={`h-full rounded-full transition-all duration-500 ${getStatusColor(site.status)}`} style={{width: `${site.overallProgress}%`}}></div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[9px] font-bold text-slate-400">{site.contractorName}</span>
                                <span className="text-[9px] font-bold text-slate-600">{site.overallProgress}%</span>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex flex-col bg-slate-100/50 relative overflow-hidden">
                 {selectedSite ? (
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                         {/* Top Stats Row */}
                         <div className="grid grid-cols-12 gap-4 mb-4">
                             {/* Camera Feed with AI Overlay */}
                             <div className="col-span-8 bg-black rounded-2xl overflow-hidden relative shadow-lg group h-[400px]">
                                 {viewMode === 'CAMERA' && (
                                     <>
                                        <img 
                                            src={selectedSite.cameraUrl} 
                                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x600/000000/FFF?text=Camera+Signal+Lost"; }}
                                            alt="Construction Site" 
                                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* AI Overlay Layer */}
                                            <div className="absolute top-1/4 left-1/4 w-32 h-48 border-2 border-emerald-500 rounded border-dashed opacity-60">
                                                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1 absolute -top-4 left-0">KRAN (99%)</span>
                                            </div>
                                            <div className="absolute bottom-10 right-1/3 w-12 h-20 border-2 border-blue-500 rounded opacity-60">
                                                <span className="bg-blue-600 text-white text-[9px] font-bold px-1 absolute -top-4 left-0">ISHCHI</span>
                                            </div>
                                        </div>
                                     </>
                                 )}
                                 {viewMode === 'DRONE' && (
                                     <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center">
                                         <Plane size={48} className="text-slate-500 mb-2"/>
                                         <p className="text-slate-400 font-bold">Dron Parvozi Faollashtirilmagan</p>
                                     </div>
                                 )}
                                 {viewMode === '3D' && (
                                     <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center border-4 border-blue-500/20">
                                         <Box size={48} className="text-blue-500 mb-2 animate-pulse"/>
                                         <p className="text-blue-400 font-bold">BIM Model (LOD 400)</p>
                                     </div>
                                 )}

                                 {/* Stage Detection Badge */}
                                 <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white shadow-xl">
                                     <div className="flex items-center gap-2 mb-1">
                                         <Scan size={16} className="text-emerald-400 animate-pulse"/>
                                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">AI Tahlili</span>
                                     </div>
                                     <div className="text-lg font-bold leading-none mb-1">{getStageLabel(selectedSite.currentAiStage)}</div>
                                     <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                                         <span>Aniqlik: {selectedSite.aiConfidence}%</span>
                                         <span>•</span>
                                         <span>Obyektlar: {selectedSite.detectedObjects.workers + selectedSite.detectedObjects.cranes + selectedSite.detectedObjects.trucks}</span>
                                     </div>
                                 </div>

                                 {/* View Mode Switcher */}
                                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/10">
                                     <button onClick={() => setViewMode('CAMERA')} className={`p-2 rounded-lg transition-all ${viewMode === 'CAMERA' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}><Video size={16}/></button>
                                     <button onClick={() => setViewMode('DRONE')} className={`p-2 rounded-lg transition-all ${viewMode === 'DRONE' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}><Plane size={16}/></button>
                                     <button onClick={() => setViewMode('3D')} className={`p-2 rounded-lg transition-all ${viewMode === '3D' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}><Box size={16}/></button>
                                 </div>

                                 {/* Live Status */}
                                 <div className="absolute top-4 right-4 flex gap-2">
                                      <div className="bg-red-600/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse shadow-lg">
                                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                                      </div>
                                      <div className="bg-black/60 text-white px-2 py-1 rounded-lg text-[10px] font-mono border border-white/10">
                                          RTSP: {selectedSite.cameraUrl.substring(0, 15)}...
                                      </div>
                                 </div>
                             </div>

                             {/* Status & Alerts Panel */}
                             <div className="col-span-4 flex flex-col gap-4">
                                 {/* Overall Status Card */}
                                 <div className={`p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center flex-1 transition-colors ${selectedSite.status === 'ON_TRACK' ? 'bg-emerald-50 border-emerald-100' : selectedSite.status === 'WARNING' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                                     <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm ${selectedSite.status === 'ON_TRACK' ? 'bg-emerald-100 text-emerald-600' : selectedSite.status === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                         {selectedSite.status === 'ON_TRACK' ? <CheckCircle size={32}/> : <AlertTriangle size={32}/>}
                                     </div>
                                     <h3 className={`text-lg font-bold mb-1 ${selectedSite.status === 'ON_TRACK' ? 'text-emerald-800' : selectedSite.status === 'WARNING' ? 'text-amber-800' : 'text-red-800'}`}>
                                         {selectedSite.status === 'ON_TRACK' ? "Jadval Bo'yicha" : selectedSite.status === 'WARNING' ? "Kechikish Xavfi" : "Jiddiy Kechikish"}
                                     </h3>
                                     <p className="text-xs font-medium opacity-70 px-4">
                                         {selectedSite.status === 'ON_TRACK' ? "Qurilish ishlari belgilangan reja asosida ketmoqda." : selectedSite.status === 'WARNING' ? "Ishchilar soni kamligi sababli sekinlashuv kuzatildi." : "Kotlovan qazish ishlari 15 kunga kechikdi!"}
                                     </p>
                                 </div>

                                 {/* Object Detection Stats */}
                                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Eye size={14}/> Obyektlar Soni (AI)</h4>
                                     <div className="grid grid-cols-3 gap-2">
                                         <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                             <div className="text-lg font-bold text-slate-700">{selectedSite.detectedObjects.workers}</div>
                                             <div className="text-[9px] font-bold text-slate-400 uppercase">Ishchilar</div>
                                         </div>
                                         <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                             <div className="text-lg font-bold text-slate-700">{selectedSite.detectedObjects.cranes}</div>
                                             <div className="text-[9px] font-bold text-slate-400 uppercase">Kranlar</div>
                                         </div>
                                         <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                             <div className="text-lg font-bold text-slate-700">{selectedSite.detectedObjects.trucks}</div>
                                             <div className="text-[9px] font-bold text-slate-400 uppercase">Texnika</div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* Timeline / Missions */}
                         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
                             <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><Calendar size={16} className="text-blue-500"/> Qurilish Bosqichlari (Missiyalar)</h3>
                             
                             <div className="relative">
                                 {/* Vertical Line */}
                                 <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100"></div>

                                 <div className="space-y-6">
                                     {selectedSite.missions.map((mission, idx) => {
                                         const isCompleted = mission.status === 'COMPLETED';
                                         const isCurrent = mission.status === 'IN_PROGRESS';
                                         const isDelayed = mission.status === 'DELAYED';
                                         
                                         return (
                                             <div key={mission.id} className="relative flex gap-6 items-start group">
                                                 {/* Status Indicator Dot */}
                                                 <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center z-10 border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isDelayed ? 'bg-red-100 text-red-600' : isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                     {isCompleted ? <CheckCircle size={20}/> : isDelayed ? <AlertCircle size={20}/> : isCurrent ? <Clock size={20} className="animate-spin-slow"/> : <div className="w-3 h-3 bg-slate-300 rounded-full"></div>}
                                                 </div>

                                                 <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition-colors relative overflow-hidden">
                                                     {/* Progress Bar Background for Current Task */}
                                                     {isCurrent && (
                                                         <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{width: `${mission.progress}%`}}></div>
                                                     )}
                                                     
                                                     <div className="flex justify-between items-start mb-2">
                                                         <div>
                                                             <h4 className="font-bold text-slate-800 text-sm">{mission.stageName}</h4>
                                                             <p className="text-xs text-slate-500">Muddat: <span className="font-mono font-bold text-slate-700">{mission.deadline}</span></p>
                                                         </div>
                                                         <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-700' : isDelayed ? 'bg-red-100 text-red-700' : isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                                                             {isCompleted ? 'YAKUNLANDI' : isDelayed ? 'KECHIKMOQDA' : isCurrent ? `JARAYONDA (${mission.progress}%)` : 'KUTILMOQDA'}
                                                         </span>
                                                     </div>
                                                     
                                                     {/* Logic Comparison Feedback */}
                                                     {isDelayed && (
                                                         <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg mt-2">
                                                             <AlertTriangle size={12}/> Tizim taqqoslovi: Jadvalda tugash kerak edi, lekin kamerada hali ishlar yakunlanmagan.
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         </div>

                         {/* Smart Archive */}
                         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><History size={16} className="text-purple-500"/> Smart Arxiv (Time-lapse)</h3>
                                 <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Barchasini Ko'rish</button>
                             </div>
                             
                             {selectedSite.history.length > 0 ? (
                                 <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                     {selectedSite.history.map((h, i) => (
                                         <div key={i} className="min-w-[160px] h-32 rounded-xl overflow-hidden relative group cursor-pointer">
                                             <img src={h.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                                 <span className="text-[10px] font-bold text-white font-mono">{h.date}</span>
                                                 <span className="text-[9px] font-bold text-white/70 uppercase">{h.stage}</span>
                                             </div>
                                             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                     Hozircha arxiv ma'lumotlari shakllanmagan
                                 </div>
                             )}
                         </div>

                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <HardHat size={48} className="mb-4 opacity-50"/>
                         <p className="font-bold text-sm">Obyektni tanlang</p>
                     </div>
                 )}
             </div>
        </div>

        {/* Add Site Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={18} className="text-blue-500"/> Yangi Qurilish Pasporti</h3>
                        <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><X size={18}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">Asosiy Ma'lumotlar</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Obyekt Nomi</label>
                                    <input type="text" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} placeholder="Masalan: Qorasuv 5-uy" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Manzil</label>
                                    <input type="text" value={newSiteAddress} onChange={e => setNewSiteAddress(e.target.value)} placeholder="Ko'cha, MFY" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"/>
                                </div>
                                <div className="col-span-2">
                                    {/* IP CAMERA SETUP */}
                                    <div className="border-t border-slate-100 pt-4 mt-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><Video size={12} className="text-blue-500"/> IP Kamera (RTSP/HTTP)</label>
                                        <div className="bg-slate-50 rounded-[16px] p-3 border border-slate-200">
                                            <div className="relative mb-3">
                                                <Cast size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                <input 
                                                        type="text" 
                                                        value={newSiteCamera} 
                                                        onChange={(e) => { setNewSiteCamera(e.target.value); setCameraTestStatus('IDLE'); }} 
                                                        placeholder="http://192.168.1.XX:8080/video" 
                                                        className="w-full bg-white border border-slate-200 rounded-[10px] pl-9 pr-3 py-2 text-xs font-mono text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                            
                                            <div className="relative w-full h-32 bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center border border-slate-300 group">
                                                {cameraTestStatus === 'IDLE' && <div className="text-center"><Video size={24} className="mx-auto text-slate-400 mb-1"/><p className="text-[9px] text-slate-500 font-bold">Kamera ulanmagan</p></div>}
                                                {cameraTestStatus === 'LOADING' && <div className="flex flex-col items-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div><p className="text-[9px] text-blue-500 font-bold">Ulanmoqda...</p></div>}
                                                {cameraTestStatus === 'SUCCESS' && <><img src={newSiteCamera} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-bold flex items-center gap-1"><Check size={14}/> Aloqa Bor</span></div></>}
                                                {cameraTestStatus === 'ERROR' && <div className="text-center text-red-500"><AlertCircle size={24} className="mx-auto mb-1"/><p className="text-[9px] font-bold">Xatolik! Manzilni tekshiring.</p></div>}
                                            </div>

                                            <button onClick={handleTestCamera} disabled={!newSiteCamera || cameraTestStatus === 'LOADING'} className="w-full mt-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-[10px] text-[10px] font-bold transition-colors flex items-center justify-center gap-2">
                                                <MonitorPlay size={12}/> {cameraTestStatus === 'SUCCESS' ? 'Qayta Tekshirish' : 'Ulanishni Tekshirish'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><TrendingUp size={14}/> Qurilish Rejasi (Vaqt Shkalasi)</h4>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                {newMissions.map((m, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">{i + 1}</div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-700">{getStageLabel(m.stage)}</p>
                                        </div>
                                        <div>
                                            <input 
                                                type="date" 
                                                value={m.date}
                                                onChange={(e) => {
                                                    const updated = [...newMissions];
                                                    updated[i].date = e.target.value;
                                                    setNewMissions(updated);
                                                }}
                                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                        <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 transition-colors">Bekor Qilish</button>
                        <button onClick={handleAddSite} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center gap-2 transition-all active:scale-95">
                            <Save size={16}/> Saqlash
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ConstructionMonitor;