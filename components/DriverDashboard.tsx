
import React, { useState, useEffect, useRef } from 'react';
import { WasteBin, Coordinate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Navigation, Check, X, AlertTriangle, Truck, Trash2, List, History, MapPin, CheckCircle, Calendar, Power, User, ChevronRight, Clock, PlayCircle } from 'lucide-react';

interface DriverDashboardProps {
  driverName: string;
  truckId: string;
  plateNumber: string;
  phoneNumber: string;
  bins: WasteBin[];
  onUpdateBin: (id: string, isFull: boolean) => void;
  onLogout: () => void;
  cityCenter: Coordinate;
  onIncidentReport: (type: 'REJECTED' | 'TIMEOUT', bin: WasteBin, driverName: string, plateNumber: string) => void;
}

interface CompletedTask {
    id: string;
    address: string;
    time: string;
    status: 'COMPLETED' | 'REJECTED' | 'TIMEOUT';
}

  


// Ovozli signal (Beep)
const ALERT_SOUND_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driverName,
  truckId,
  plateNumber,
  phoneNumber,
  bins,
  onUpdateBin,
  onLogout,
  cityCenter,
  onIncidentReport
}) => {
  // --- STATE ---
  const [isOnline, setIsOnline] = useState(false);
  
  // Task Flow State: IDLE -> INCOMING -> ACCEPTED
  const [taskStatus, setTaskStatus] = useState<'IDLE' | 'INCOMING' | 'ACCEPTED'>('IDLE');
  const [currentTask, setCurrentTask] = useState<WasteBin | null>(null);
  
  const [currentLocation, setCurrentLocation] = useState<Coordinate>(cityCenter);
  const [activeTab, setActiveTab] = useState<'TASKS' | 'HISTORY'>('TASKS');
  const [taskHistory, setTaskHistory] = useState<CompletedTask[]>([]);
  const [isReporting, setIsReporting] = useState(false); // For rejection reason modal
  
  // Timer & Sound
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minut
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundIntervalRef = useRef<any>(null);
  
  

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);

  // Filter tasks (Full bins)
  const tasks = bins.filter(b => b.isFull);

  // --- AUDIO INIT ---
  useEffect(() => {
      audioRef.current = new Audio(ALERT_SOUND_URL);
  }, []);

  const playSound = () => {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
      }
  };

  // --- TASK DETECTION LOGIC ---
  useEffect(() => {
      // Agar haydovchi bo'sh bo'lsa va yangi to'lgan konteyner bo'lsa -> INCOMING ga o'tkazamiz
      if (isOnline && taskStatus === 'IDLE' && tasks.length > 0) {
          setCurrentTask(tasks[0]);
          setTaskStatus('INCOMING');
          setTimeLeft(300); // 5 minut vaqt beriladi qabul qilishga
      }
  }, [isOnline, taskStatus, tasks]);

  // --- SOUND LOOP LOGIC (Only for INCOMING) ---
  useEffect(() => {
      if (taskStatus === 'INCOMING') {
          playSound(); // Darhol chalish
          soundIntervalRef.current = setInterval(playSound, 10000); // Har 10 sekunda chalish
      } else {
          if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
      }
      return () => { if (soundIntervalRef.current) clearInterval(soundIntervalRef.current); };
  }, [taskStatus]);

  // --- TIMER LOGIC (Only for INCOMING) ---
  useEffect(() => {
      if (taskStatus !== 'INCOMING') return;

      const timerId = setInterval(() => {
          setTimeLeft((prev) => {
              if (prev <= 1) {
                  handleTimeout(); 
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);

      return () => clearInterval(timerId);
  }, [taskStatus]);

  // --- HANDLERS ---

  const handleTimeout = () => {
      if (!currentTask) return;
      
      // Markazga xabar
      onIncidentReport('TIMEOUT', currentTask, driverName, plateNumber);
      
      // Tarixga yozish
      const historyItem: CompletedTask = {
          id: Date.now().toString(),
          address: currentTask.address,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: 'TIMEOUT'
      };
      setTaskHistory(prev => [historyItem, ...prev]);

      // Reset
      setTaskStatus('IDLE');
      setCurrentTask(null);
      alert("Vaqt tugadi! Vazifa avtomatik rad etildi.");
  };

  const handleAcceptTask = () => {
      setTaskStatus('ACCEPTED');
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
  };

  const handleRejectTask = () => {
      if (!currentTask) return;
      onIncidentReport('REJECTED', currentTask, driverName, plateNumber);
      
      const historyItem: CompletedTask = {
          id: Date.now().toString(),
          address: currentTask.address,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: 'REJECTED'
      };
      setTaskHistory(prev => [historyItem, ...prev]);

      setTaskStatus('IDLE');
      setCurrentTask(null);
      setIsReporting(false);
  };

  const handleCompleteTask = () => {
      if (!currentTask) return;
      
      onUpdateBin(currentTask.id, false); // Bo'shatish
      
      const historyItem: CompletedTask = {
          id: Date.now().toString(),
          address: currentTask.address,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: 'COMPLETED'
      };
      setTaskHistory(prev => [historyItem, ...prev]);

      setTaskStatus('IDLE');
      setCurrentTask(null);
  };

  // Format Time
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- MAP SETUP ---
  useEffect(() => {
    if (!isOnline || !mapContainerRef.current || !window.L || mapInstanceRef.current) return;
    
    const map = window.L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: false, 
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false
    });

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png').addTo(map);
    routeLayerRef.current = window.L.layerGroup().addTo(map);
    
    // Truck Marker
    const truckHtml = `
        <div class="w-14 h-14 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white z-50">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
    `;
    truckMarkerRef.current = window.L.marker([currentLocation.lat, currentLocation.lng], {
        icon: window.L.divIcon({ className: 'bg-transparent', html: truckHtml, iconSize: [56, 56] }),
        zIndexOffset: 1000
    }).addTo(map);

    mapInstanceRef.current = map;
    
    // GPS Simulation
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition((pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(newLoc);
            if (truckMarkerRef.current) truckMarkerRef.current.setLatLng([newLoc.lat, newLoc.lng]);
            if (mapInstanceRef.current) mapInstanceRef.current.setView([newLoc.lat, newLoc.lng]);
        }, (err) => console.log(err), { enableHighAccuracy: true });
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline]);

  // Draw Route
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (currentTask && (taskStatus === 'INCOMING' || taskStatus === 'ACCEPTED')) {
        const latlngs = [
            [currentLocation.lat, currentLocation.lng],
            [currentTask.location.lat, currentTask.location.lng]
        ];
        
        // Agar INCOMING bo'lsa qizil, ACCEPTED bo'lsa ko'k chiziq
        const color = taskStatus === 'INCOMING' ? '#ef4444' : '#3b82f6';
        
        window.L.polyline(latlngs, { color: color, weight: 6, opacity: 0.8, dashArray: '10, 10' }).addTo(routeLayerRef.current);
        
        window.L.marker([currentTask.location.lat, currentTask.location.lng], {
             icon: window.L.divIcon({ className: 'bg-transparent', html: '<div class="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-xl animate-bounce flex items-center justify-center text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></div>', iconSize: [40, 40], iconAnchor: [20, 40] })
        }).addTo(routeLayerRef.current);
    }
  }, [currentTask, currentLocation, taskStatus]);


  // --- OFFLINE SCREEN ---
  if (!isOnline) {
      return (
          <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden text-white">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>

              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 flex flex-col items-center w-full max-w-sm">
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-blue-900/50">
                      <Truck size={56} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Xush Kelibsiz</h1>
                  <p className="text-slate-400 font-bold text-lg mb-1">{driverName}</p>
                  <div className="px-3 py-1 bg-slate-800 rounded-lg text-sm font-mono text-slate-300 mb-12 border border-slate-700">{plateNumber}</div>
                  <button onClick={() => setIsOnline(true)} className="w-full py-5 bg-white text-slate-900 rounded-[24px] font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 group">
                      <Power size={24} className="text-emerald-600 group-hover:scale-110 transition-transform"/> ISHNI BOSHLASH
                  </button>
                  <button onClick={onLogout} className="mt-8 text-slate-500 hover:text-red-400 text-sm font-bold flex items-center gap-2 transition-colors"><LogOut size={16}/> Tizimdan Chiqish</button>
              </motion.div>
          </div>
      );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="h-full w-full bg-slate-100 flex flex-col relative overflow-hidden font-sans">
        
        {/* Background Map */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 opacity-100" />

        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md rounded-[24px] shadow-lg p-3 flex justify-between items-center border border-white/50 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <User size={20} className="text-slate-500"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 leading-none">{driverName}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Ishdaman</span>
                        </div>
                        {phoneNumber && phoneNumber !== "Noma'lum Raqam" && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] font-bold text-slate-500">{phoneNumber}</span>
                        </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                     <button onClick={() => setIsOnline(false)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center border border-red-100 transition-all shadow-sm">
                        <Power size={20}/>
                     </button>
                </div>
            </div>
        </div>

        {/* INCOMING REQUEST MODAL (Overlay) */}
        <AnimatePresence>
            {taskStatus === 'INCOMING' && currentTask && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
                >
                    <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative">
                        {/* Progress Bar */}
                        <div className="h-2 bg-slate-100 w-full">
                            <motion.div 
                                className="h-full bg-red-500" 
                                initial={{ width: '100%' }}
                                animate={{ width: `${(timeLeft / 300) * 100}%` }}
                                transition={{ ease: "linear", duration: 1 }}
                            />
                        </div>

                        <div className="p-6 text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <AlertTriangle size={36}/>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase leading-none mb-2">Yangi Buyurtma!</h2>
                            <p className="text-slate-500 font-bold text-sm mb-6">Sizga yangi chiqindi konteyneri biriktirildi</p>
                            
                            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Manzil</p>
                                <h3 className="text-lg font-black text-slate-800 leading-tight">{currentTask.address}</h3>
                                <p className="text-xs text-blue-600 font-bold mt-2">{currentTask.tozaHudud}</p>
                            </div>

                            <div className="text-3xl font-mono font-black text-red-600 mb-6">
                                {formatTime(timeLeft)}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleRejectTask} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200">RAD ETISH</button>
                                <button onClick={handleAcceptTask} className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                                    <CheckCircle size={18}/> QABUL QILISH
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ACTIVE TASK & LIST AREA */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end p-4 pointer-events-none">
            <AnimatePresence mode="wait">
            
            {/* If Accepted Task */}
            {taskStatus === 'ACCEPTED' && currentTask ? (
                <motion.div 
                    initial={{ y: 200, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: 200, opacity: 0 }}
                    className="bg-white w-full rounded-[32px] shadow-2xl border-t border-slate-100 p-6 pointer-events-auto"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={10}/> Manzilga boring</p>
                            <h3 className="text-xl font-black text-slate-800 leading-tight w-5/6">{currentTask.address}</h3>
                        </div>
                        <div className="text-right">
                            <div className="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
                                AKTIV
                            </div>
                        </div>
                    </div>
                    
                    {isReporting ? (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 text-center mb-2">Rad etish sababi?</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleRejectTask} className="py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200">Texnik Nosozlik</button>
                                <button onClick={handleRejectTask} className="py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200">Tirbandlik</button>
                                <button onClick={handleRejectTask} className="py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200">Topolmadim</button>
                                <button onClick={() => setIsReporting(false)} className="py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs">Bekor Qilish</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${currentTask.location.lat},${currentTask.location.lng}&travelmode=driving`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
                            >
                                <Navigation size={18} className="fill-white"/> NAVIGATORDA OCHISH
                            </a>

                            <div className="flex gap-3">
                                <button onClick={() => setIsReporting(true)} className="flex-1 py-4 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
                                    <AlertTriangle size={18}/> RAD ETISH
                                </button>
                                <button onClick={handleCompleteTask} className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">
                                    <Check size={18} strokeWidth={3}/> BO'SHATILDI
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : taskStatus === 'IDLE' ? (
                /* List & History Tabs (Only when IDLE) */
                <motion.div 
                    initial={{ y: 200, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white w-full rounded-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 flex flex-col pointer-events-auto h-[50vh]"
                >
                    <div className="flex p-2 gap-2 border-b border-slate-100 bg-slate-50/50 rounded-t-[32px]">
                        <button onClick={() => setActiveTab('TASKS')} className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'TASKS' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}>
                            <List size={16}/> VAZIFALAR ({tasks.length})
                        </button>
                        <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}>
                            <History size={16}/> TARIX ({taskHistory.length})
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                        {activeTab === 'TASKS' ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <PlayCircle size={48} className="mb-2 opacity-50"/>
                                <p className="text-xs font-bold uppercase tracking-widest text-center px-8">Hozircha yangi buyurtmalar yo'q. Kutish rejimidasiz...</p>
                            </div>
                        ) : (
                            taskHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300"><Calendar size={48} className="mb-2"/><p className="text-xs font-bold uppercase tracking-widest">Tarix bo'sh</p></div>
                            ) : (
                                taskHistory.map(hist => (
                                    <div key={hist.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            {hist.status === 'COMPLETED' ? <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle size={16}/></div> : hist.status === 'TIMEOUT' ? <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Clock size={16}/></div> : <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><X size={16}/></div>}
                                            <div><h4 className="font-bold text-slate-700 text-xs">{hist.address}</h4><p className="text-[10px] text-slate-400 font-mono mt-0.5">{hist.time}</p></div>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${hist.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : hist.status === 'TIMEOUT' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{hist.status}</span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </motion.div>
            ) : null}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default DriverDashboard;
