import React, { useState, useEffect } from 'react';
import { LightPole, LightStatus } from '../types';
import { Lightbulb, Zap, AlertTriangle, MapPin, Camera, Settings, Plus, X, MousePointer2, CheckCircle, Activity, Sun, Moon, Cast, MonitorPlay, Check, AlertCircle, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LightInspectorProps {
  poles: LightPole[];
}

const LightInspector: React.FC<LightInspectorProps> = ({ poles: initialPoles }) => {
  const [poles, setPoles] = useState<LightPole[]>(initialPoles);
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'SETUP'>('MONITOR');
  const [selectedPoleId, setSelectedPoleId] = useState<string | null>(poles[0]?.id || null);
  
  // Setup Mode State
  const [setupPoleId, setSetupPoleId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Add Pole Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPoleAddress, setNewPoleAddress] = useState('');
  const [newCameraUrl, setNewCameraUrl] = useState('');
  const [cameraTestStatus, setCameraTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const selectedPole = poles.find(p => p.id === selectedPoleId);
  const setupPole = poles.find(p => p.id === setupPoleId);

  // Runtime Simulation: Flicker and Check
  useEffect(() => {
    const interval = setInterval(() => {
        setPoles(prevPoles => prevPoles.map(p => {
            // Randomly simulate luminance changes based on status
            let newLum = p.luminance;
            if (p.status === 'FLICKERING') {
                newLum = 100 + Math.random() * 100; // Unstable
            } else if (p.status === 'OFF') {
                newLum = Math.max(0, 5 + Math.random() * 5); // Near zero
            } else {
                newLum = Math.max(200, 240 + Math.random() * 15); // Stable Bright
            }
            return { ...p, luminance: Math.floor(newLum) };
        }));
    }, 1000); // 1s update for flicker effect
    return () => clearInterval(interval);
  }, []);

  const handleStatusClick = (id: string) => {
      setSelectedPoleId(id);
      setActiveTab('MONITOR');
  };

  const toggleSetupMode = (id: string) => {
      setSetupPoleId(id);
      setActiveTab('SETUP');
  };

  const getStatusColor = (status: LightStatus) => {
      switch(status) {
          case 'ON': return 'text-emerald-500 bg-emerald-100 border-emerald-200';
          case 'OFF': return 'text-slate-500 bg-slate-200 border-slate-300';
          case 'FLICKERING': return 'text-amber-500 bg-amber-100 border-amber-200';
          default: return 'text-slate-500';
      }
  };

  const handleTestCamera = () => {
    if (!newCameraUrl) return;
    setCameraTestStatus('LOADING');
    const img = new Image();
    img.onload = () => setCameraTestStatus('SUCCESS');
    img.onerror = () => setCameraTestStatus('ERROR');
    img.src = newCameraUrl;
  };

  const handleAddPole = () => {
    if (!newPoleAddress) return;

    const newPole: LightPole = {
        id: `LIGHT-${Date.now()}`,
        location: { lat: 40.3734, lng: 71.7978 }, // Mock default
        address: newPoleAddress,
        cameraUrl: newCameraUrl || "https://images.unsplash.com/photo-1509723233958-3932782e4431?w=800&q=80",
        status: 'ON',
        luminance: 240,
        lastCheck: "Hozir",
        rois: []
    };

    setPoles(prev => [...prev, newPole]);
    setShowAddModal(false);
    setNewPoleAddress('');
    setNewCameraUrl('');
    setCameraTestStatus('IDLE');
  };


  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm shrink-0 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Lightbulb className="text-yellow-500" /> AI Light Inspector</h2>
                <p className="text-xs text-slate-500 font-medium">Ko'cha chiroqlarini avtomatik nazorat qilish tizimi</p>
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all">
                    <Plus size={16}/> Yangi Ustun
                 </button>
                 <div className="w-px h-8 bg-slate-100 mx-1"></div>
                 <button onClick={() => setActiveTab('MONITOR')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'MONITOR' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    Monitoring
                 </button>
                 <button onClick={() => { setActiveTab('SETUP'); setSetupPoleId(selectedPoleId); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'SETUP' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    Sozlash (ROI)
                 </button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
             {/* LEFT SIDEBAR: LIST */}
             <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto custom-scrollbar shrink-0">
                 <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                     <div className="flex justify-between items-center mb-4">
                         <div className="text-center">
                             <div className="text-2xl font-bold text-slate-800">{poles.length}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase">Jami</div>
                         </div>
                         <div className="w-px h-8 bg-slate-100"></div>
                         <div className="text-center">
                             <div className="text-2xl font-bold text-emerald-500">{poles.filter(p => p.status === 'ON').length}</div>
                             <div className="text-[10px] font-bold text-emerald-400 uppercase">Aktiv</div>
                         </div>
                         <div className="w-px h-8 bg-slate-100"></div>
                         <div className="text-center">
                             <div className="text-2xl font-bold text-red-500">{poles.filter(p => p.status === 'OFF').length}</div>
                             <div className="text-[10px] font-bold text-red-400 uppercase">Kuygan</div>
                         </div>
                     </div>
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Muammolar Ro'yxati</h3>
                 </div>
                 
                 <div className="flex-1 p-3 space-y-2">
                     {poles.map(pole => (
                         <div 
                            key={pole.id}
                            onClick={() => handleStatusClick(pole.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md flex flex-col gap-2 ${selectedPoleId === pole.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                         >
                             <div className="flex justify-between items-start">
                                 <h4 className="text-sm font-bold text-slate-800">{pole.id}</h4>
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pole.status === 'ON' ? 'bg-emerald-100 text-emerald-600' : pole.status === 'OFF' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600'}`}>
                                     {pole.status === 'ON' ? 'ISHCHI' : pole.status === 'OFF' ? 'KUYGAN' : 'MILTILLASH'}
                                 </span>
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1"><MapPin size={10}/> {pole.address}</p>
                         </div>
                     ))}
                 </div>
             </div>

             {/* MAIN CONTENT */}
             <div className="flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col p-6">
                 {activeTab === 'MONITOR' && selectedPole ? (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                         {/* Camera Feed */}
                         <div className="lg:col-span-2 bg-black rounded-3xl overflow-hidden relative shadow-2xl border-4 border-white h-full max-h-[600px]">
                             <img src={selectedPole.cameraUrl} className="w-full h-full object-cover opacity-80" />
                             
                             {/* Overlays */}
                             <div className="absolute inset-0">
                                 {selectedPole.rois.map(roi => {
                                     // Determine style based on pole status (Simulated per ROI for visual effect)
                                     let roiColor = 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
                                     let bgFill = 'bg-emerald-500/10';
                                     let label = 'OK';
                                     
                                     if (selectedPole.status === 'OFF') {
                                         roiColor = 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]';
                                         bgFill = 'bg-black/80';
                                         label = 'ALERT';
                                     } else if (selectedPole.status === 'FLICKERING') {
                                         roiColor = 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
                                         bgFill = 'bg-amber-500/20';
                                         label = 'FLICKER';
                                     }

                                     return (
                                         <div 
                                            key={roi.id}
                                            className={`absolute border-2 ${roiColor} ${bgFill} flex items-center justify-center transition-all duration-300`}
                                            style={{ 
                                                left: `${roi.x}%`, 
                                                top: `${roi.y}%`, 
                                                width: `${roi.width}%`, 
                                                height: `${roi.height}%`,
                                                opacity: selectedPole.status === 'FLICKERING' ? (Math.random() > 0.5 ? 1 : 0.3) : 1
                                            }}
                                         >
                                             <div className={`absolute -top-5 left-0 text-[9px] font-bold text-white px-1.5 rounded ${selectedPole.status === 'OFF' ? 'bg-red-600' : selectedPole.status === 'FLICKERING' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                                 {label}: {selectedPole.luminance}
                                             </div>
                                         </div>
                                     )
                                 })}

                                 {/* Time & Info Overlay */}
                                 <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
                                     <div className="flex items-center gap-2 mb-1"><Camera size={12}/> CAM-02 • {selectedPole.lastCheck}</div>
                                     <div className="text-[10px] text-slate-300">Piksel Yorqinligi Tahlili (Luminance)</div>
                                 </div>
                             </div>
                         </div>

                         {/* Details Panel */}
                         <div className="flex flex-col gap-4">
                             <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                 <div className="flex items-center gap-3 mb-4">
                                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getStatusColor(selectedPole.status)}`}>
                                         <Lightbulb size={24} />
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-slate-800 text-lg">Holat: {selectedPole.status === 'ON' ? 'Stabil' : selectedPole.status === 'OFF' ? 'Kuygan' : 'Miltillamoqda'}</h3>
                                         <p className="text-xs text-slate-500">Avtomatik Tekshiruv</p>
                                     </div>
                                 </div>
                                 
                                 <div className="space-y-3">
                                     <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                         <span className="text-xs font-bold text-slate-500">Yorqinlik (Luma)</span>
                                         <span className="text-xs font-bold font-mono text-slate-800">{selectedPole.luminance} / 255</span>
                                     </div>
                                     <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                         <span className="text-xs font-bold text-slate-500">Oxirgi Signal</span>
                                         <span className="text-xs font-bold text-slate-800">{selectedPole.lastCheck}</span>
                                     </div>
                                 </div>

                                 {selectedPole.status !== 'ON' && (
                                     <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                                         <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
                                             <AlertTriangle size={14} /> Chora Ko'rish Kerak
                                         </div>
                                         <p className="text-[10px] text-red-600/80">
                                             Tizim avtomatik ravishda ta'mirlash brigadasiga so'rov yubordi (Ticket #4029).
                                         </p>
                                     </div>
                                 )}
                             </div>

                             {/* Map Placeholder */}
                             <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex-1 relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                                     <MapPin size={48} className="text-slate-300" />
                                 </div>
                                 {/* Simple Mock Map dots */}
                                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"></div>
                                 <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-500 rounded-full"></div>
                                 <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                 <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-[10px] font-bold text-slate-600">
                                     {selectedPole.address}
                                 </div>
                             </div>
                         </div>
                     </div>
                 ) : activeTab === 'SETUP' && setupPole ? (
                     <div className="h-full flex flex-col bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                         <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                             <div>
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Settings size={16}/> ROI Sozlash: {setupPole.id}</h3>
                                 <p className="text-[10px] text-slate-500">Kameradagi chiroqlarni belgilang (Region of Interest)</p>
                             </div>
                             <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                                 <CheckCircle size={14} /> Saqlash
                             </button>
                         </div>
                         <div className="flex-1 relative bg-slate-900 flex items-center justify-center cursor-crosshair group">
                             <img src={setupPole.cameraUrl} className="max-w-full max-h-full opacity-60" />
                             
                             {/* Hint Overlay */}
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-white/20">
                                 <MousePointer2 size={14} /> Chiroq atrofini belgilang (Demo Mode)
                             </div>

                             {/* Existing ROIs (Editable visualization) */}
                             {setupPole.rois.map(roi => (
                                 <div 
                                    key={roi.id}
                                    className="absolute border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center group/roi"
                                    style={{ 
                                        left: `${roi.x}%`, 
                                        top: `${roi.y}%`, 
                                        width: `${roi.width}%`, 
                                        height: `${roi.height}%`
                                    }}
                                 >
                                     <div className="absolute -top-6 -right-6 flex gap-1 opacity-0 group-hover/roi:opacity-100 transition-opacity">
                                         <button className="w-5 h-5 bg-red-500 rounded text-white flex items-center justify-center"><X size={12}/></button>
                                     </div>
                                     <div className="text-[9px] font-bold text-white bg-blue-600 px-1 rounded absolute -bottom-4 left-0">{roi.label}</div>
                                 </div>
                             ))}
                         </div>
                         <div className="p-4 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-200">
                             Yangi nuqta qo'shish uchun tasvir ustiga bosing. Tizim avtomatik ravishda yorug'lik darajasini o'lchashni boshlaydi.
                         </div>
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                         <Lightbulb size={64} className="text-slate-300 mb-4"/>
                         <p className="text-sm font-bold text-slate-400">Monitoring qilish uchun ustunni tanlang</p>
                     </div>
                 )}
             </div>
        </div>

      {/* ADD POLE MODAL */}
      {showAddModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[12px] bg-yellow-50 text-yellow-600 flex items-center justify-center"><Lightbulb size={20}/></div>
                          <div><h3 className="font-bold text-slate-800">Yangi Ustun</h3><p className="text-[10px] text-slate-500">Chiroq ustunini nazoratga olish</p></div>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={16}/></button>
                  </div>
                  
                  <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Manzil / Mo'ljal</label>
                          <input type="text" value={newPoleAddress} onChange={e => setNewPoleAddress(e.target.value)} placeholder="Masalan: Beruniy 5-ustun" className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-yellow-500/20"/>
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
                      <button onClick={handleAddPole} disabled={!newPoleAddress} className="py-2.5 rounded-[12px] bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"><Check size={16}/> Saqlash</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LightInspector;