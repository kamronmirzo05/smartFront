import React, { useState, useEffect } from 'react';
import { SOSColumn } from '../types';
import { ShieldAlert, Video, MapPin, Mic, Activity, Siren, PhoneCall, AlertTriangle, Eye, Volume2, ShieldCheck, Zap, Plus, X, Cast, MonitorPlay, Check, AlertCircle, Grid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SecurityMonitorProps {
  columns: SOSColumn[];
  activeMFY?: string;
  onTriggerSOS: (id: string, type: 'BUTTON' | 'AI') => void;
  onResolveSOS: (id: string) => void;
  onAddColumn?: (col: SOSColumn) => void;
}

const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ columns, activeMFY = 'ALL', onTriggerSOS, onResolveSOS, onAddColumn }) => {
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'FOCUS' | 'GRID'>('FOCUS');
  
  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMfy, setNewMfy] = useState('');
  
  // Camera Test State
  const [newCameraUrl, setNewCameraUrl] = useState('');
  const [cameraTestStatus, setCameraTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const filteredColumns = activeMFY === 'ALL' ? columns : columns.filter(c => c.mfy === activeMFY);
  const activeIncident = columns.find(c => c.status === 'ACTIVE');

  useEffect(() => {
    if (activeIncident) {
        setActiveIncidentId(activeIncident.id);
        setViewMode('FOCUS'); // Switch to focus if alert comes
    }
  }, [activeIncident]);

  const activeColumn = columns.find(c => c.id === activeIncidentId);

  // Simulation handlers
  const handleSimulateButton = (id: string) => {
      onTriggerSOS(id, 'BUTTON');
  };

  const handleSimulateAI = (id: string) => {
      onTriggerSOS(id, 'AI');
  };

  const handleTestCamera = () => {
    if (!newCameraUrl) return;
    setCameraTestStatus('LOADING');
    const img = new Image();
    img.onload = () => setCameraTestStatus('SUCCESS');
    img.onerror = () => setCameraTestStatus('ERROR');
    img.src = newCameraUrl;
  };

  const handleCreateColumn = () => {
    if (!newName || !onAddColumn) return;
    
    const newCol: SOSColumn = {
        id: `SOS-${Date.now()}`,
        name: newName,
        location: { lat: 40.3734, lng: 71.7978 }, // Mock default location
        mfy: newMfy || "Yangi MFY",
        status: 'IDLE',
        cameraUrl: newCameraUrl || "https://images.unsplash.com/photo-1555616635-640b71bd185e?w=800&q=80",
        lastTest: "Hozir",
        deviceHealth: { batteryLevel: 100, signalStrength: 100, lastPing: 'Hozir', firmwareVersion: 'v1.0', isOnline: true }
    };
    
    onAddColumn(newCol);
    setShowAddModal(false);
    setNewName('');
    setNewMfy('');
    setNewCameraUrl('');
    setCameraTestStatus('IDLE');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm shrink-0 flex justify-between items-center">
          <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><ShieldAlert className="text-red-600" /> Shahar Xavfsizlik Qalqoni</h2>
              <p className="text-xs text-slate-500 font-medium">SOS Ustunlar va AI Monitoring Tizimi</p>
          </div>
          <div className="flex gap-4 items-center">
              {/* View Switcher */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                  <button onClick={() => setViewMode('FOCUS')} className={`p-1.5 rounded-md transition-all ${viewMode === 'FOCUS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Fokus Rejimi"><List size={16}/></button>
                  <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Kamera Panjarasi"><Grid size={16}/></button>
              </div>

              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all">
                  <Plus size={16}/> Yangi Nuqta Qo'shish
              </button>
              <div className="w-px h-8 bg-slate-100"></div>
              <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase">Aktiv</span>
                  <span className="text-lg font-bold text-emerald-600">{columns.filter(c => c.status === 'IDLE').length}</span>
              </div>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden z-10 bg-slate-50/50">
          
          {/* Sidebar List (Only visible in FOCUS mode) */}
          {viewMode === 'FOCUS' && (
              <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto custom-scrollbar shrink-0">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monitoring Nuqtalari</h3>
                  </div>
                  <div className="flex-1 p-3 space-y-2">
                      {filteredColumns.map(col => (
                          <div key={col.id} 
                               onClick={() => setActiveIncidentId(col.id)}
                               className={`p-3 rounded-[16px] border cursor-pointer transition-all hover:shadow-md ${
                                   col.status === 'ACTIVE' 
                                   ? 'bg-red-50 border-red-200 shadow-md shadow-red-100' 
                                   : activeIncidentId === col.id 
                                       ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100' 
                                       : 'bg-white border-slate-100 hover:bg-slate-50'
                               }`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.status === 'ACTIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
                                      {col.status === 'ACTIVE' ? 'XAVF ANIQLANDI' : 'TINCH'}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">{col.id.split('-')[1]}</span>
                              </div>
                              <h4 className={`font-bold text-sm ${col.status === 'ACTIVE' ? 'text-red-700' : 'text-slate-800'}`}>{col.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium"><MapPin size={10}/> {col.mfy}</p>
                              
                              {/* Simulation Controls */}
                              <div className="mt-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); handleSimulateButton(col.id); }} className="flex-1 px-2 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-[8px] text-[9px] font-bold transition-colors">SOS Tugma</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleSimulateAI(col.id); }} className="flex-1 px-2 py-1.5 bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-200 rounded-[8px] text-[9px] font-bold transition-colors">AI Test</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Main View */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
              {viewMode === 'GRID' ? (
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredColumns.map(col => (
                              <div key={col.id} className="relative bg-black rounded-xl overflow-hidden aspect-video group cursor-pointer border border-slate-800 hover:border-blue-500 transition-colors" onClick={() => { setActiveIncidentId(col.id); setViewMode('FOCUS'); }}>
                                  <img src={col.cameraUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                                      {col.name}
                                  </div>
                                  {col.status === 'ACTIVE' && (
                                      <div className="absolute inset-0 border-4 border-red-500 animate-pulse flex items-center justify-center bg-red-500/10">
                                          <ShieldAlert size={48} className="text-red-500 drop-shadow-lg"/>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              ) : activeColumn ? (
                  <>
                      {/* FOCUS MODE: Active Camera */}
                      <div className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
                          <div>
                              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                  {activeColumn.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>}
                                  {activeColumn.name}
                              </h2>
                              <p className="text-xs text-slate-500 font-medium font-mono">{activeColumn.id} • {activeColumn.mfy}</p>
                          </div>
                          {activeColumn.status === 'ACTIVE' ? (
                              <button onClick={() => onResolveSOS(activeColumn.id)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95">
                                  <ShieldCheck size={16}/> VAZIYAT BARQAROR (RESET)
                              </button>
                          ) : (
                              <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-2">
                                  <Activity size={14} /> Tizim Barqaror
                              </div>
                          )}
                      </div>

                      {/* Video Feed Area */}
                      <div className="flex-1 relative overflow-hidden group bg-slate-900 m-4 rounded-[24px] shadow-lg border-4 border-white ring-1 ring-slate-200">
                          <img 
                            src={activeColumn.cameraUrl} 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/600x400/000000/FFF?text=Camera+Signal+Lost";
                            }}
                            alt="Live Feed" 
                            className={`w-full h-full object-cover transition-transform duration-1000 ${activeColumn.status === 'ACTIVE' ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}
                          />
                          
                          {/* Overlay Grid */}
                          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '100px 100px', opacity: 0.2 }}></div>
                          
                          {/* AI Overlays (Mock) */}
                          {activeColumn.status === 'ACTIVE' && (
                              <div className="absolute inset-0 pointer-events-none">
                                  {/* Target Box Animation */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-red-500 rounded-lg animate-pulse flex items-start justify-between p-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                      <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">AI DETECTION</span>
                                      <span className="text-red-500 text-[10px] font-mono font-bold bg-black/50 px-1 rounded">{activeColumn.activeIncident?.aiAnalysis.confidence}%</span>
                                  </div>
                                  
                                  {/* Warning Flash */}
                                  <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                              </div>
                          )}

                          {/* Live Indicator */}
                          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg border border-red-500/50">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              <span className="text-xs font-bold text-white tracking-widest">JONLI EFIR</span>
                          </div>

                          {/* Camera Info */}
                          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded">
                              CAM-01 • PTZ • 4K • {new Date().toLocaleTimeString()}
                          </div>
                      </div>

                      {/* AI Analysis Panel (Bottom) */}
                      <div className="h-48 bg-white border-t border-slate-200 grid grid-cols-3 gap-4 p-4 shrink-0">
                          {/* Audio Analysis */}
                          <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Mic size={14} className="text-blue-500"/> Audio Spektr Analizi</h4>
                              <div className="flex items-center justify-center gap-1.5 h-16 mb-2 flex-1">
                                  {[...Array(16)].map((_, i) => (
                                      <div key={i} className={`w-1.5 bg-blue-500 rounded-full transition-all duration-150 ease-in-out`} style={{ height: `${Math.random() * 80 + 20}%`, opacity: activeColumn.status === 'ACTIVE' ? 1 : 0.3 }}></div>
                                  ))}
                              </div>
                              <p className="text-xs font-bold text-center text-slate-600 bg-white py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                  {activeColumn.status === 'ACTIVE' ? `Aniqlanmoqda: "${activeColumn.activeIncident?.aiAnalysis.keywords.join(', ')}"` : 'Fon Shovqini: 45dB (Normal)'}
                              </p>
                          </div>

                          {/* Visual AI */}
                          <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Eye size={14} className="text-purple-500"/> Vizual AI Tahlili</h4>
                              <div className="space-y-4 flex-1">
                                  <div>
                                      <div className="flex justify-between text-[10px] font-bold mb-1.5 text-slate-600">
                                          <span>Hissiy Stress Darajasi</span>
                                          <span className={activeColumn.activeIncident?.aiAnalysis.stressLevel! > 80 ? "text-red-500" : "text-emerald-500"}>{activeColumn.status === 'ACTIVE' ? activeColumn.activeIncident?.aiAnalysis.stressLevel : 12}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-500 ${activeColumn.activeIncident?.aiAnalysis.stressLevel! > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${activeColumn.status === 'ACTIVE' ? activeColumn.activeIncident?.aiAnalysis.stressLevel : 12}%` }}></div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                      {activeColumn.status === 'ACTIVE' && activeColumn.activeIncident?.aiAnalysis.detectedObjects.map(obj => (
                                          <span key={obj} className="px-2.5 py-1 bg-white text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 shadow-sm uppercase">{obj}</span>
                                      ))}
                                      {activeColumn.status === 'IDLE' && <span className="text-[10px] text-slate-400 font-medium italic">Obyektlar va harakatlar normal holatda</span>}
                                  </div>
                              </div>
                          </div>

                          {/* Actions */}
                          <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Zap size={14} className="text-orange-500"/> Tezkor Choralar</h4>
                              <div className="grid grid-cols-2 gap-3 flex-1">
                                  <button disabled={activeColumn.status === 'IDLE'} className="bg-red-50 hover:bg-red-100 border border-red-100 disabled:opacity-50 text-red-600 rounded-[12px] font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95">
                                      <Siren size={20} /> Tez Yordam
                                  </button>
                                  <button disabled={activeColumn.status === 'IDLE'} className="bg-blue-50 hover:bg-blue-100 border border-blue-100 disabled:opacity-50 text-blue-600 rounded-[12px] font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95">
                                      <ShieldAlert size={20} /> IIB (Militsiya)
                                  </button>
                                  <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 col-span-2 transition-all shadow-sm">
                                      <PhoneCall size={14} /> Markaziy Dispetcher
                                  </button>
                              </div>
                          </div>
                      </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                          <ShieldCheck size={48} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-600 mb-2">Monitoring Tizimi</h3>
                      <p className="text-sm font-medium text-slate-400 text-center max-w-xs">Batafsil ma'lumot va video kuzatuv uchun chap menudan ustunni tanlang</p>
                  </div>
              )}
          </div>
      </div>

      {/* ADD CAMERA MODAL */}
      {showAddModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[12px] bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShieldCheck size={20}/></div>
                          <div><h3 className="font-bold text-slate-800">Yangi SOS Nuqta</h3><p className="text-[10px] text-slate-500">Xavfsizlik kamerasi o'rnatish</p></div>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={16}/></button>
                  </div>
                  
                  <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Nomi / Manzil</label>
                          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Masalan: Markaziy Park Kirish" className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"/>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">MFY (Hudud)</label>
                          <input type="text" value={newMfy} onChange={e => setNewMfy(e.target.value)} placeholder="MFY nomini kiriting" className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"/>
                       </div>

                       {/* IP CAMERA SETUP */}
                       <div className="border-t border-slate-100 pt-4 mt-2">
                           <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><Video size={12} className="text-blue-500"/> IP Kamera (RTSP/HTTP)</label>
                           <div className="bg-slate-50 rounded-[16px] p-3 border border-slate-200">
                               <div className="relative mb-3">
                                   <Cast size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                   <input 
                                        type="text" 
                                        value={newCameraUrl} 
                                        onChange={(e) => { setNewCameraUrl(e.target.value); setCameraTestStatus('IDLE'); }} 
                                        placeholder="http://192.168.1.XX:8080/video" 
                                        className="w-full bg-white border border-slate-200 rounded-[10px] pl-9 pr-3 py-2 text-xs font-mono text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                   />
                               </div>
                               
                               <div className="relative w-full h-32 bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center border border-slate-300 group">
                                   {cameraTestStatus === 'IDLE' && <div className="text-center"><Video size={24} className="mx-auto text-slate-400 mb-1"/><p className="text-[9px] text-slate-500 font-bold">Kamera ulanmagan</p></div>}
                                   {cameraTestStatus === 'LOADING' && <div className="flex flex-col items-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div><p className="text-[9px] text-blue-500 font-bold">Ulanmoqda...</p></div>}
                                   {cameraTestStatus === 'SUCCESS' && <><img src={newCameraUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-bold flex items-center gap-1"><Check size={14}/> Aloqa Bor</span></div></>}
                                   {cameraTestStatus === 'ERROR' && <div className="text-center text-red-500"><AlertCircle size={24} className="mx-auto mb-1"/><p className="text-[9px] font-bold">Xatolik! Manzilni tekshiring.</p></div>}
                               </div>

                               <button onClick={handleTestCamera} disabled={!newCameraUrl || cameraTestStatus === 'LOADING'} className="w-full mt-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-[10px] text-[10px] font-bold transition-colors flex items-center justify-center gap-2">
                                   <MonitorPlay size={12}/> {cameraTestStatus === 'SUCCESS' ? 'Qayta Tekshirish' : 'Ulanishni Tekshirish'}
                               </button>
                           </div>
                       </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                      <button onClick={() => setShowAddModal(false)} className="py-2.5 rounded-[12px] font-bold text-xs text-slate-500 hover:bg-slate-100">Bekor Qilish</button>
                      <button onClick={handleCreateColumn} disabled={!newName} className="py-2.5 rounded-[12px] bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"><Check size={16}/> Saqlash</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SecurityMonitor;