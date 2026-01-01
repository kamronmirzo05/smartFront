
import React, { useState, useEffect, useRef } from 'react';
import { Tab, MoistureSensor, Facility, WasteBin, Truck, Notification, UserRole, UserSession, AirSensor, SensorStatus, SOSColumn, EcoViolation, LightPole, Bus, CallRequest, IoTDevice, Room, Boiler } from './types';
import { MOCK_NOTIFICATIONS, GET_MFYS, ALL_MODULES } from './constants';
import { DB } from './services/storage'; // Import DB
import { authService } from './services/auth'; // Import auth service
import { ApiService } from './services/api';
import MoistureMap from './components/MoistureMap';
import ClimateMonitor from './components/ClimateMonitor';
import WasteManagement from './components/WasteManagement';
import AnalyticsView from './components/AnalyticsView';
import AuthNavigation from './components/AuthNavigation';
import AirQualityMonitor from './components/AirQualityMonitor';
import SecurityMonitor from './components/SecurityMonitor';
import EcoControlMonitor from './components/EcoControlMonitor';
import LightInspector from './components/LightInspector';
import PublicTransport from './components/PublicTransport';
import AICallCenter from './components/AICallCenter';
import CitizenPortal from './components/CitizenPortal';
import DriverDashboard from './components/DriverDashboard';
import LockedModule from './components/LockedModule';
import { Radio, Wind, CheckSquare, ShieldCheck, ChevronRight, Siren, LogOut, Truck as TruckIcon, HardHat, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Updated Static Micro Footer
const FooterInfo = () => (
  <div className="w-full h-6 flex items-center justify-center z-[100] shrink-0 text-slate-500 relative select-none bg-white/50 backdrop-blur-md border-t border-slate-200/50 pointer-events-none">
     <div className="flex items-center gap-4 text-[9px] font-bold pointer-events-auto">
         <span className="opacity-50">© 2025 Smart City</span>
         <span className="w-px h-2 bg-slate-300"></span>
         <a href="#" className="hover:text-blue-600 transition-colors">Dev: CDCGroup</a>
         <span className="w-px h-2 bg-slate-300"></span>
         <a href="#" className="hover:text-emerald-600 transition-colors">Power: CraDev</a>
     </div>
  </div>
);

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'ADMIN' | 'PORTAL'>(
      window.location.hash === '#portal' ? 'PORTAL' : 'ADMIN'
  );
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [loading, setLoading] = useState<boolean>(false); // Start with false, set to true when session exists
  
  // Data State (Loaded from DB)
  const [sensors, setSensors] = useState<MoistureSensor[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bins, setBins] = useState<WasteBin[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [airSensors, setAirSensors] = useState<AirSensor[]>([]);
  const [sosColumns, setSosColumns] = useState<SOSColumn[]>([]);
  const [ecoViolations, setEcoViolations] = useState<EcoViolation[]>([]);
  const [lightPoles, setLightPoles] = useState<LightPole[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [boilers, setBoilers] = useState<Boiler[]>([]);
  const [iotDevices, setIoTDevices] = useState<IoTDevice[]>([]);
  
  const [globalFilter, setGlobalFilter] = useState<string | null>(null);
  const [selectedMfy, setSelectedMfy] = useState<string>('ALL');
  const [availableMfys, setAvailableMfys] = useState<string[]>([]);

  // UI State
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [autoSosEnabled, setAutoSosEnabled] = useState(false); 
  const [showSosMenu, setShowSosMenu] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string>("Hozirgina");

  // Load Data on Session Start
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        setLoading(true);
        console.log('Loading data for session:', session);
        try {
          const [
            loadedSensors,
            loadedFacilities,
            loadedBins,
            loadedTrucks,
            loadedAirSensors,
            loadedSosColumns,
            loadedLightPoles,
            loadedEcoViolations,
            loadedBuses,
            loadedRooms,
            loadedBoilers,
            loadedIoTDevices
          ] = await Promise.all([
            DB.getSensors(),
            DB.getFacilities(),
            DB.getBins(), // This will now get bins from API only
            DB.getTrucks(), // This will now get trucks from API only
            DB.getAirSensors(),
            DB.getSOS(),
            DB.getLights(),
            DB.getEco(),
            DB.getTransport(),
            DB.getRooms(),
            DB.getBoilers(),
            DB.getIoTDevices()
          ]);
          
          setSensors(loadedSensors);
          setFacilities(loadedFacilities);
          setBins(loadedBins); // Set bins from API
          setTrucks(loadedTrucks); // Set trucks from API
          setAirSensors(loadedAirSensors);
          setSosColumns(loadedSosColumns);
          setLightPoles(loadedLightPoles);
          setEcoViolations(loadedEcoViolations);
          setBuses(loadedBuses);
          setRooms(loadedRooms);
          setBoilers(loadedBoilers);
          setIoTDevices(loadedIoTDevices);
          
          setAvailableMfys(GET_MFYS(session.district.name));
        } catch (error) {
          console.error('Error loading data:', error);
          // If the error is related to authentication, clear the session
          if (error instanceof Error && error.message.includes('401')) {
            localStorage.removeItem('authToken');
            setSession(null);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [session]);

  // Polling to update bins (For Bot uploads) - updated to handle async
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(async () => {
      try {
        const updatedBins = await DB.getBins();
        setBins(updatedBins);
      } catch (error) {
        console.error('Error polling bins:', error);
      }
    }, 30000); // Check DB every 30s instead of 5s to reduce API calls
    
    return () => clearInterval(interval);
  }, [session]);

  // Sync back to DB when state changes - updated to handle async
  useEffect(() => { 
    if(bins.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_bins', JSON.stringify(bins));
    }
  }, [bins]);
  
  useEffect(() => { 
    if(sensors.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_sensors', JSON.stringify(sensors));
    }
  }, [sensors]);
  
  useEffect(() => { 
    if(facilities.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_facilities', JSON.stringify(facilities));
    }
  }, [facilities]);
  
  useEffect(() => { 
    if(trucks.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_trucks', JSON.stringify(trucks));
    }
  }, [trucks]);
  
  useEffect(() => { 
    if(airSensors.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_air', JSON.stringify(airSensors));
    }
  }, [airSensors]);
  
  useEffect(() => { 
    if(sosColumns.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_sos', JSON.stringify(sosColumns));
    }
  }, [sosColumns]);
  
  useEffect(() => { 
    if(ecoViolations.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_eco', JSON.stringify(ecoViolations));
    }
  }, [ecoViolations]);
  
  useEffect(() => { 
    if(buses.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_transport', JSON.stringify(buses));
    }
  }, [buses]);
  
  useEffect(() => { 
    if(lightPoles.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_lights', JSON.stringify(lightPoles));
    }
  }, [lightPoles]);
  
  useEffect(() => { 
    if(rooms.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_rooms', JSON.stringify(rooms));
    }
  }, [rooms]);
  
  useEffect(() => { 
    if(boilers.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_boilers', JSON.stringify(boilers));
    }
  }, [boilers]);
  
  useEffect(() => { 
    if(iotDevices.length) {
      // Only save to localStorage, not to API to prevent continuous requests
      localStorage.setItem('smartcity_iot_devices', JSON.stringify(iotDevices));
    }
  }, [iotDevices]);

  useEffect(() => {
      const handleHashChange = () => {
          const hash = window.location.hash.replace('#', '');
          setViewMode(hash === 'portal' ? 'PORTAL' : 'ADMIN');
      };
      
      // Initial check
      handleHashChange();

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
     if (isEmergencyMode) document.body.classList.add('emergency-active');
     else document.body.classList.remove('emergency-active');
  }, [isEmergencyMode]);

  const handleLogout = () => {
      setSession(null);
      setActiveTab('DASHBOARD');
      setIsEmergencyMode(false);
      // Clear all auth data when logging out
      localStorage.removeItem('authToken');
      localStorage.removeItem('organizationId');
      localStorage.removeItem('userSession');
  };

  const handleDriverIncident = (type: 'REJECTED' | 'TIMEOUT', bin: WasteBin, driverName: string, plateNumber: string) => {
      const message = type === 'REJECTED' 
          ? `Haydovchi ${driverName} (${plateNumber}) ${bin.address} manzilidagi buyurtmani rad etdi!`
          : `Haydovchi ${driverName} (${plateNumber}) ${bin.address} dagi vazifani 5 daqiqa davomida qabul qilmadi!`;
      
      const newNotif: Notification = {
          id: Date.now().toString(),
          title: type === 'REJECTED' ? 'Vazifa Rad Etildi' : 'Vazifa Vaqti Tugadi',
          message: message,
          timestamp: new Date().toLocaleTimeString(),
          type: 'CRITICAL',
          read: false
      };

      setNotifications(prev => [newNotif, ...prev]);
      
      // Play alert sound logic here if needed
      // alert(message); // Demo purpose
  };

  // Function to update bin with authentication check
  const updateBin = async (id: string, updates: Partial<WasteBin> | boolean) => {
    // Check if updates is just a boolean (for driver dashboard) or a partial bin object
    const binUpdates = typeof updates === 'boolean' 
      ? { isFull: !updates } // If boolean isFull, then we're setting it to the opposite (false means empty)
      : updates;
    
    // Check for authentication before updating
    const token = localStorage.getItem('authToken');
    if (!token) {
      // If no token, update locally only
      setBins(prev => prev.map(b => b.id === id ? { ...b, ...binUpdates } : b));
      return;
    }
    
    try {
      // Update locally first
      setBins(prev => prev.map(b => b.id === id ? { ...b, ...binUpdates } : b));
      // Then try to save to API
      const binToUpdate = bins.find(b => b.id === id);
      if (binToUpdate) {
        const updatedBin = { ...binToUpdate, ...binUpdates };
        const savedBin = await DB.saveBin(updatedBin);
        // Update the local state with the server response
        setBins(prev => prev.map(b => b.id === savedBin.id ? savedBin : b));
      }
    } catch (error) {
      console.error('Error updating bin:', error);
      // Show user-friendly error message
      alert('Konteynerni yangilashda xatolik yuz berdi. Iltimos, qaytadan urinib koring.');
      // If API update fails, revert to local state or just keep the local update
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('authToken');
      }
    }
  };

  // Check if user has valid session and token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const sessionData = localStorage.getItem('userSession');
      
      if (token && sessionData) {
        try {
          const isValid = await authService.validateToken(token);
          if (isValid) {
            // Token is valid, restore session from localStorage
            const restoredSession = JSON.parse(sessionData);
            setSession(restoredSession);
          } else {
            // Token is invalid, clear everything
            localStorage.removeItem('authToken');
            localStorage.removeItem('organizationId');
            localStorage.removeItem('userSession');
            setSession(null);
          }
        } catch (error) {
          console.error('Auth validation error:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('organizationId');
          localStorage.removeItem('userSession');
          setSession(null);
        }
      }
    };

    checkAuth();
  }, []);

  if (viewMode === 'PORTAL') {
      return <CitizenPortal onBackToAdmin={() => { window.location.hash = ''; setViewMode('ADMIN'); }} />;
  }

  if (session && session.user.role === 'DRIVER') {
      // Find the truck associated with this driver to get the plate number and phone
      const myTruck = trucks.find(t => t.driverName === session.user.name);
      const plate = myTruck ? myTruck.plateNumber : "Noma'lum Raqam";
      const phone = myTruck ? myTruck.phone : "";

      // Show loading state while waiting for trucks to load
      if (loading || (trucks.length === 0 && session.user.name)) {
        return (
          <div className="flex items-center justify-center h-screen w-screen bg-[#eef2f6]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg font-bold text-slate-700">Haydovchi ma'lumotlari yuklanmoqda...</p>
            </div>
          </div>
        );
      }

      return (
          <DriverDashboard 
              driverName={session.user.name}
              truckId="TRK-001" 
              plateNumber={plate}
              phoneNumber={phone}
              bins={bins}
              onUpdateBin={(id, isFull) => updateBin(id, isFull)} // Use the updated function with proper signature for driver dashboard
              onLogout={handleLogout}
              cityCenter={session.district.center}
              onIncidentReport={handleDriverIncident}
          />
      );
  }


  if (!session) {
    return <AuthNavigation onLogin={(newSession) => {
      console.log('✅ Login callback received, session:', newSession);
      if (!newSession) {
        console.error('❌ Session is null in callback!');
        return;
      }
      if (!newSession.user) {
        console.error('❌ Session user is missing!');
        return;
      }
      if (!newSession.district) {
        console.error('❌ Session district is missing!');
        return;
      }
      console.log('✅ Setting session...');
      setSession(newSession);
      // Store session and organization ID when session is set
      if (newSession && newSession.user && newSession.user.organizationId) {
        localStorage.setItem('organizationId', newSession.user.organizationId);
      }
      // Save entire session to localStorage for persistence
      localStorage.setItem('userSession', JSON.stringify(newSession));
    }} />;
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#eef2f6]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg font-bold text-slate-700">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const enabledModules = session.enabledModules || [];
  const navItems = ALL_MODULES.filter(m => enabledModules.includes(m.id));
  const showClimateWidget = enabledModules.includes('CLIMATE');
  const showMapWidget = enabledModules.includes('MOISTURE') || enabledModules.includes('TRANSPORT') || enabledModules.includes('SECURITY');
  const showWasteWidget = enabledModules.includes('WASTE');
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden relative transition-colors duration-200 ${isEmergencyMode ? 'bg-[#2a0a0a]' : 'bg-[#eef2f6]'}`}>
      
      {isEmergencyMode && (
          <div className="absolute inset-0 pointer-events-none z-[999] overflow-hidden flex items-center justify-center">
              <div className="w-full h-full absolute inset-0 bg-red-600/10 animate-pulse"></div>
              <div className="text-[200px] font-black text-red-600/20 rotate-12 select-none animate-pulse">SOS</div>
          </div>
      )}

      {/* Notifications Drawer */}
      <AnimatePresence>
          {showNotifications && (
              <>
                  <div className="fixed inset-0 z-[60] bg-transparent" onClick={() => setShowNotifications(false)}></div>
                  <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-20 right-4 bottom-12 w-80 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl z-[70] border border-slate-200 flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="font-bold text-slate-800">Bildirishnomalar</h3>
                          <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} className="text-[10px] font-bold text-blue-600 hover:underline">Hammasini o'qish</button>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                          {notifications.length === 0 && <div className="text-center py-10 text-slate-400 text-xs">Bildirishnomalar yo'q</div>}
                          {notifications.map(n => (
                              <div key={n.id} className={`p-3 rounded-xl border flex flex-col gap-1 ${n.type === 'CRITICAL' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'} ${!n.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                                  <div className="flex justify-between items-start">
                                      <h4 className={`text-xs font-bold ${n.type === 'CRITICAL' ? 'text-red-700' : 'text-slate-800'}`}>{n.title}</h4>
                                      <span className="text-[9px] text-slate-400 font-mono">{n.timestamp}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 leading-snug">{n.message}</p>
                              </div>
                          ))}
                      </div>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <div className="absolute inset-0 bottom-4 p-2 flex flex-col gap-2">
          <header className={`h-14 rounded-[24px] flex items-center justify-between px-5 shadow-sm shrink-0 z-40 backdrop-blur-xl transition-all ${isEmergencyMode ? 'bg-red-900/90 border-2 border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.5)]' : 'ios-glass bg-white/70'}`}>
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('DASHBOARD')}>
              <div className={`w-10 h-10 rounded-[14px] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform ${isEmergencyMode ? 'bg-red-600 shadow-red-500/30 animate-bounce' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/30'}`}><Radio size={20} strokeWidth={2.5} className={isEmergencyMode ? "animate-ping" : ""} /></div>
              <div className="flex flex-col"><h1 className={`text-lg font-bold tracking-tight leading-none ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>{session.user.name}</h1><div className="flex items-center gap-1.5 mt-0.5"><span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isEmergencyMode ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500'}`}></span><p className={`text-[10px] font-bold tracking-widest uppercase ${isEmergencyMode ? 'text-red-400' : 'text-slate-500'}`}>{session.district.name}</p></div></div>
            </div>
            
            <nav className="hidden xl:flex items-center p-1 bg-slate-200/50 rounded-full border border-white/50 shadow-inner overflow-x-auto custom-scrollbar max-w-[60vw]">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 font-bold text-xs whitespace-nowrap ${activeTab === item.id ? 'bg-white text-blue-600 shadow-md scale-100 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'} ${item.id === 'SECURITY' && isEmergencyMode ? 'bg-red-600 text-white animate-pulse' : ''}`}><item.icon size={14} strokeWidth={activeTab === item.id ? 2.5 : 2} /><span>{item.label}</span></button>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <div className="relative group">
                    <select value={selectedMfy} onChange={(e) => setSelectedMfy(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors w-32">
                        <option value="ALL">Barcha MFY</option>
                        {availableMfys.map(mfy => <option key={mfy} value={mfy}>{mfy}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight size={14} className="rotate-90" /></div>
              </div>
              <div className="w-px h-6 bg-slate-300"></div>
              
              <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-600 relative">
                      <Bell size={18} />
                      {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white animate-bounce">{unreadCount}</span>}
                  </button>
              </div>

              {enabledModules.includes('SECURITY') && (
                  <div className="relative">
                      <button onClick={() => setShowSosMenu(!showSosMenu)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all overflow-hidden relative ${isEmergencyMode ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 border-slate-200'}`}>
                            {isEmergencyMode && <div className="absolute inset-0 bg-red-500 animate-ping opacity-50"></div>}
                            <Siren size={14} className="relative z-10" />
                            <span className="relative z-10">SOS</span>
                            {autoSosEnabled && !isEmergencyMode && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white relative z-10"></div>}
                      </button>
                  </div>
              )}

              <div className="relative">
                  <div onClick={() => setShowRoleSelector(!showRoleSelector)} className="w-9 h-9 rounded-full bg-slate-200/50 flex items-center justify-center border border-white cursor-pointer hover:ring-2 ring-blue-500/20 transition-all shadow-sm overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${session.user.name}&background=0D8ABC&color=fff`} className="w-full h-full object-cover opacity-90" alt="Profile"/></div>
                  {showRoleSelector && (
                      <div className="absolute top-12 right-0 w-48 bg-white/95 backdrop-blur-xl rounded-[16px] shadow-xl border border-white/60 p-2 z-50 animate-in slide-in-from-top-2">
                          <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Rolni O'zgartirish</p>
                          {(['ADMIN', 'DISPATCHER', 'TECHNICIAN', 'DRIVER'] as UserRole[]).map(role => (
                              <button key={role} onClick={() => {
                                // Update session with new role instead of local state
                                if (session) {
                                  const updatedSession = {
                                    ...session,
                                    user: {
                                      ...session.user,
                                      role: role
                                    }
                                  };
                                  setSession(updatedSession);
                                  
                                  // Store organization ID when session is updated
                                  if (updatedSession.user.organizationId) {
                                    localStorage.setItem('organizationId', updatedSession.user.organizationId);
                                  }
                                }
                                setShowRoleSelector(false);
                              }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${session?.user.role === role ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}>
                                  {role === 'ADMIN' && <ShieldCheck size={14}/>}
                                  {role === 'DISPATCHER' && <Radio size={14}/>}
                                  {role === 'TECHNICIAN' && <HardHat size={14}/>}
                                  {role === 'DRIVER' && <TruckIcon size={14}/>}
                                  {role}
                              </button>
                          ))}
                          <div className="border-t border-slate-100 mt-2 pt-2"><button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 text-red-500 hover:bg-red-50"><LogOut size={14}/> Chiqish</button></div>
                      </div>
                  )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden rounded-[24px] min-h-0 relative">
            <AnimatePresence mode="wait">
                {activeTab === 'DASHBOARD' && (
                  <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-12 gap-2 h-full">
                    {/* Left Column: Climate (Hidden if disabled) */}
                    {showClimateWidget && (
                        <div className="col-span-3 h-full flex flex-col gap-2 overflow-hidden">
                            <div className="flex-1 ios-glass rounded-[24px] overflow-hidden shadow-sm transition-transform duration-700 hover:scale-[1.005] bg-white/80">
                                <ClimateMonitor facilities={facilities} activeMFY={selectedMfy} globalFilter={globalFilter} onAddFacility={async (f) => {
                                    try {
                                        // Log the payload (camelCase) that will be sent to API for easier debugging
                                        console.debug('Saving facility payload (frontend):', f);

                                        // Check if facility has an ID to determine if it's an update or create
                                        let savedFacility;
                                        if (f.id && !f.id.startsWith('F-NEW-')) {
                                            // Update existing facility
                                            savedFacility = await ApiService.updateFacility(f.id, f);
                                            // Replace the old facility with the updated one
                                            setFacilities(prev => prev.map(fac => fac.id === savedFacility.id ? savedFacility : fac));
                                        } else {
                                            // Create new facility
                                            savedFacility = await ApiService.createFacility(f);
                                            // Add the new facility to the list
                                            setFacilities(prev => [savedFacility, ...prev]);
                                        }
                                        
                                        return savedFacility;
                                    } catch (error) {
                                        console.error('Error saving facility to API:', error);
                                        alert('Ob\'ektni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                        return f;
                                    }
                                }} cityName={session.district.name} />
                            </div>
                        </div>
                    )}
                    
                    {/* Center Column: Map */}
                    {showMapWidget && (
                        <div className={`${showWasteWidget ? (showClimateWidget ? 'col-span-6' : 'col-span-8') : (showClimateWidget ? 'col-span-9' : 'col-span-12')} h-full flex flex-col gap-2 overflow-hidden`}>
                            <div className="flex-1 ios-glass rounded-[24px] overflow-hidden shadow-lg border-2 border-white/50 group bg-slate-100 relative">
                                <MoistureMap sensors={sensors} wasteBins={bins} trucks={trucks} airSensors={airSensors} sosColumns={sosColumns} activeMFY={selectedMfy} onAddSensor={(s) => setSensors(prev => [...prev, s])} onDeleteSensor={(id) => setSensors(prev => prev.filter(s => s.id !== id))} onAddBin={async (b) => {
                                    setBins(prev => [b, ...prev]);
                                    // Save to API
                                    try {
                                        const savedBin = await DB.saveBin(b);
                                        // Update the local state with the server response
                                        setBins(prev => [savedBin, ...prev.filter(bin => bin.id !== savedBin.id)]);
                                    } catch (error) {
                                        console.error('Error saving bin to API:', error);
                                        // Show user-friendly error message
                                        alert('Konteynerni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                    }
                                }} onAddTruck={async (t) => {
                                    setTrucks(prev => [t, ...prev]);
                                    // Save to API
                                    try {
                                        const savedTruck = await DB.saveTruck(t);
                                        // Update the local state with the server response
                                        setTrucks(prev => [savedTruck, ...prev.filter(truck => truck.id !== savedTruck.id)]);
                                    } catch (error) {
                                        console.error('Error saving truck to API:', error);
                                        // Show user-friendly error message
                                        alert('Haydovchini saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                    }
                                }} onAddAirSensor={(s) => setAirSensors(prev => [s, ...prev])} aiPredictionMode={false} center={session.district.center} />
                            </div>
                            {enabledModules.includes('AIR') && (
                                <div className="h-16 shrink-0 ios-glass rounded-[20px] shadow-sm bg-white/90 backdrop-blur border border-white px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center"><Wind size={20} /></div><div><h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Havo Sifati</h3><p className="text-[10px] text-slate-500 font-medium">Jonli Monitoring</p></div></div>
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100"><CheckSquare size={14} /><span className="text-xs font-bold">Barqaror</span></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Right Column: Waste - Expands if others hidden */}
                    {showWasteWidget && (
                        <div className={`${showMapWidget ? (showClimateWidget ? 'col-span-3' : 'col-span-4') : (showClimateWidget ? 'col-span-9' : 'col-span-12')} h-full flex flex-col gap-2 overflow-hidden`}>
                            <div className="flex-1 ios-glass rounded-[24px] overflow-hidden shadow-sm bg-white/80 transition-transform duration-700 hover:scale-[1.005]">
                                <WasteManagement 
                                    bins={bins} 
                                    trucks={trucks} 
                                    activeMFY={selectedMfy} 
                                    onUpdateBin={updateBin} // Use the updated function
                                    onAddBin={async (b) => {
                                        setBins(prev => [b, ...prev]);
                                        // Save to API
                                        try {
                                            const savedBin = await DB.saveBin(b);
                                            // Update the local state with the server response
                                            setBins(prev => [savedBin, ...prev.filter(bin => bin.id !== savedBin.id)]);
                                        } catch (error) {
                                            console.error('Error saving bin to API:', error);
                                            // Show user-friendly error message
                                            alert('Konteynerni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                        }
                                    }}
                                    onDeleteBin={(id) => setBins(prev => prev.filter(b => b.id !== id))} 
                                    onAddTruck={async (t) => {
                                        setTrucks(prev => [t, ...prev]);
                                        // Save to API
                                        try {
                                            const savedTruck = await DB.saveTruck(t);
                                            // Update the local state with the server response
                                            setTrucks(prev => [savedTruck, ...prev.filter(truck => truck.id !== savedTruck.id)]);
                                        } catch (error) {
                                            console.error('Error saving truck to API:', error);
                                            // Show user-friendly error message
                                            alert('Haydovchini saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                        }
                                    }} 
                                    onUpdateTruck={(id, updates) => setTrucks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))} 
                                    onDeleteTruck={(id) => setTrucks(prev => prev.filter(t => t.id !== id))}
                                    lastScan={lastScanTime} 
                                    cityName={session.district.name} 
                                    districtCenter={session.district.center} 
                                />
                            </div>
                        </div>
                    )}

                    {!showMapWidget && !showWasteWidget && !showClimateWidget && (
                        <div className="col-span-12 flex items-center justify-center opacity-50">
                            <div className="text-center">
                                <ShieldCheck size={64} className="mx-auto text-slate-300 mb-4"/>
                                <h2 className="text-xl font-bold text-slate-600">Asosiy Modullar O'chirilgan</h2>
                                <p className="text-sm text-slate-400">Kerakli modullarni menyudan tanlang</p>
                            </div>
                        </div>
                    )}
                  </motion.div>
                )}
                
                {activeTab === 'SECURITY' && (enabledModules.includes('SECURITY') ? (<motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full rounded-[24px] overflow-hidden shadow-lg border border-white/50"><SecurityMonitor columns={sosColumns} activeMFY={selectedMfy} onTriggerSOS={(id) => { const newCols = sosColumns.map(c => c.id === id ? {...c, status: 'ACTIVE' as const} : c); setSosColumns(newCols); setIsEmergencyMode(true); }} onResolveSOS={(id) => { const newCols = sosColumns.map(c => c.id === id ? {...c, status: 'IDLE' as const} : c); setSosColumns(newCols); if(!newCols.some(c=>c.status === 'ACTIVE')) setIsEmergencyMode(false); }} onAddColumn={(c) => setSosColumns(prev => [...prev, c])} /></motion.div>) : (<motion.div key="security-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Xavfsizlik" /></motion.div>))}

                {activeTab === 'ANALYTICS' && (enabledModules.includes('ANALYTICS') ? (<motion.div key="analytics" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><AnalyticsView activeMFY={selectedMfy} /></motion.div>) : (<motion.div key="analytics-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Tahlil" /></motion.div>))}
                {activeTab === 'MOISTURE' && (enabledModules.includes('MOISTURE') ? (<motion.div key="moisture" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50 bg-slate-100"><MoistureMap sensors={sensors} wasteBins={bins} trucks={trucks} airSensors={airSensors} sosColumns={sosColumns} activeMFY={selectedMfy} onAddSensor={(s) => setSensors(prev => [...prev, s])} onDeleteSensor={(id) => setSensors(prev => prev.filter(s => s.id !== id))} onAddBin={async (b) => {
                                    setBins(prev => [b, ...prev]);
                                    // Save to API
                                    try {
                                        const savedBin = await DB.saveBin(b);
                                        // Update the local state with the server response
                                        setBins(prev => [savedBin, ...prev.filter(bin => bin.id !== savedBin.id)]);
                                    } catch (error) {
                                        console.error('Error saving bin to API:', error);
                                        // Show user-friendly error message
                                        alert('Konteynerni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                    }
                                }} onAddTruck={async (t) => {
                                    setTrucks(prev => [t, ...prev]);
                                    // Save to API
                                    try {
                                        await DB.saveTruck(t);
                                    } catch (error) {
                                        console.error('Error saving truck to API:', error);
                                    }
                                }} onAddAirSensor={(s) => setAirSensors(prev => [s, ...prev])} aiPredictionMode={true} center={session.district.center} /></motion.div>) : (<motion.div key="moisture-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Namlik" /></motion.div>))}
                {activeTab === 'CLIMATE' && enabledModules.includes('CLIMATE') && (<motion.div key="climate" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><ClimateMonitor facilities={facilities} activeMFY={selectedMfy} onAddFacility={async (f) => {
                                    try {
                                        // Log the payload (frontend) that will be sent to API for easier debugging
                                        console.debug('Saving facility payload (frontend):', f);

                                        // Check if facility has an ID to determine if it's an update or create
                                        let savedFacility;
                                        if (f.id && !f.id.startsWith('F-NEW-')) {
                                            // Update existing facility
                                            savedFacility = await ApiService.updateFacility(f.id, f);
                                            // Replace the old facility with the updated one
                                            setFacilities(prev => prev.map(fac => fac.id === savedFacility.id ? savedFacility : fac));
                                        } else {
                                            // Create new facility
                                            savedFacility = await ApiService.createFacility(f);
                                            // Add the new facility to the list
                                            setFacilities(prev => [savedFacility, ...prev]);
                                        }
                                        
                                        return savedFacility;
                                    } catch (error) {
                                        console.error('Error saving facility to API:', error);
                                        alert('Ob\'ektni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                                        return f;
                                    }
                                }} cityName={session.district.name} /></motion.div>)}
                {activeTab === 'WASTE' && enabledModules.includes('WASTE') && (<motion.div key="waste" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><WasteManagement bins={bins} activeMFY={selectedMfy} trucks={trucks} onUpdateBin={updateBin} onAddBin={async (b) => {
                                        setBins(prev => [b, ...prev]);
                                        // Save to API
                                        try {
                                            await DB.saveBin(b);
                                        } catch (error) {
                                            console.error('Error saving bin to API:', error);
                                        }
                                    }} onDeleteBin={(id) => setBins(prev => prev.filter(b => b.id !== id))} onAddTruck={async (t) => {
                                        setTrucks(prev => [t, ...prev]);
                                        // Save to API
                                        try {
                                            const savedTruck = await DB.saveTruck(t);
                                            // Update the local state with the server response
                                            setTrucks(prev => [savedTruck, ...prev.filter(truck => truck.id !== savedTruck.id)]);
                                        } catch (error) {
                                            console.error('Error saving truck to API:', error);
                                        }
                                    }} onUpdateTruck={(id, updates) => setTrucks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))} onDeleteTruck={(id) => setTrucks(prev => prev.filter(t => t.id !== id))} lastScan={lastScanTime} cityName={session.district.name} districtCenter={session.district.center} /></motion.div>)}
                {activeTab === 'ECO_CONTROL' && (enabledModules.includes('ECO_CONTROL') ? (<motion.div key="eco" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><EcoControlMonitor violations={ecoViolations} /></motion.div>) : (<motion.div key="eco-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Eco-Nazorat" /></motion.div>))}
                {activeTab === 'LIGHT_INSPECTOR' && (enabledModules.includes('LIGHT_INSPECTOR') ? (<motion.div key="light" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><LightInspector poles={lightPoles} /></motion.div>) : (<motion.div key="light-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Light-AI" /></motion.div>))}
                {activeTab === 'AIR' && (enabledModules.includes('AIR') ? (<motion.div key="air" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><AirQualityMonitor sensors={airSensors} activeMFY={selectedMfy} /></motion.div>) : (<motion.div key="air-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Havo" /></motion.div>))}
                {activeTab === 'TRANSPORT' && (enabledModules.includes('TRANSPORT') ? (<motion.div key="transport" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><PublicTransport buses={buses} center={session.district.center} /></motion.div>) : (<motion.div key="transport-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Transport" /></motion.div>))}
                {activeTab === 'CALL_CENTER' && (enabledModules.includes('CALL_CENTER') ? (<motion.div key="call" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full ios-glass rounded-[24px] overflow-hidden shadow-lg border border-white/50"><AICallCenter /></motion.div>) : (<motion.div key="call-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full"><LockedModule moduleName="Murojaatlar" /></motion.div>))}
            </AnimatePresence>
          </main>
      </div>
      <div className="absolute bottom-0 left-0 w-full z-50">
         <FooterInfo />
      </div>
    </div>
  );
};

export default App;
