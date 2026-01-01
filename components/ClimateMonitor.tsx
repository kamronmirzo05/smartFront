import React, { useState, useMemo, useEffect } from 'react';
import { Facility, Boiler, Room, SensorStatus, IoTDevice } from '../types';
import { GET_MFYS } from '../constants';
import { ChevronDown, Thermometer, AlertTriangle, Building2, Flame, Settings, X, Save, ArrowDownRight, ArrowUp, ArrowDown, Filter, RotateCcw, Zap, Sparkles, BarChart, Info, Wind, CloudFog, Plus, Trash2, Check, MapPin, Radio } from 'lucide-react';
import { ApiService } from '../services/api';

interface ClimateMonitorProps {
  facilities: Facility[];
  activeMFY?: string; 
  globalFilter?: string | null;
  // Updated: onAddFacility returns a Promise that resolves to the saved Facility (or undefined on error)
  onAddFacility?: (facility: Facility, callback?: () => void) => Promise<Facility | undefined>;
  cityName?: string;
}

interface HumidityConfig {
  roomMin: number;
  roomMax: number;
  boilerMin: number;
  boilerMax: number;
}

type FacilityTypeFilter = 'ALL' | 'SCHOOL' | 'KINDERGARTEN' | 'HOSPITAL';

// Types for form state to handle partial/draft data
type DraftRoom = Partial<Room> & { iotDeviceId?: string };
type DraftBoiler = Partial<Omit<Boiler, 'connectedRooms'>> & { connectedRooms: DraftRoom[], iotDeviceId?: string };
type DraftFacility = Omit<Partial<Facility>, 'boilers'> & { boilers: DraftBoiler[] };

const Sparkline = ({ data, color, height = 20 }: { data: number[], color: string, height?: number }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ClimateMonitor: React.FC<ClimateMonitorProps> = ({ facilities, activeMFY = 'ALL', globalFilter, onAddFacility, cityName = "Farg'ona" }) => {
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const [expandedBoiler, setExpandedBoiler] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FacilityTypeFilter>('ALL');

  // Lazy-loaded rooms per boiler (to fetch details when a boiler is expanded)
  const [loadedBoilerRooms, setLoadedBoilerRooms] = useState<Record<string, Room[]>>({});
  const [loadingBoilerRooms, setLoadingBoilerRooms] = useState<Record<string, boolean>>({});

  // Device linking UI state
  const [linkingRoomId, setLinkingRoomId] = useState<string | null>(null);
  const [selectedDeviceForLink, setSelectedDeviceForLink] = useState<string>('');
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  const handleToggleBoiler = async (boilerId: string, facilityId?: string, boilerObj?: Boiler) => {
    const isOpen = expandedBoiler === boilerId;
    if (isOpen) {
      setExpandedBoiler(null);
      return;
    }

    setExpandedBoiler(boilerId);

    // If boiler already has connectedRooms in local prop, don't fetch
    if (boilerObj && boilerObj.connectedRooms && boilerObj.connectedRooms.length > 0) return;

    // If already loaded, do nothing
    if (loadedBoilerRooms[boilerId]) return;

    try {
      setLoadingBoilerRooms(prev => ({ ...prev, [boilerId]: true }));
      const fetchedBoiler = await ApiService.getBoiler(boilerId);
      // ApiService returns mapped boiler with connectedRooms camelCase
      setLoadedBoilerRooms(prev => ({ ...prev, [boilerId]: fetchedBoiler.connectedRooms || [] }));
    } catch (error) {
      console.error('Error fetching boiler details:', error);
    } finally {
      setLoadingBoilerRooms(prev => ({ ...prev, [boilerId]: false }));
    }
  };

  const openLinkDeviceForRoom = (roomId: string) => {
    setLinkingRoomId(roomId);
    setSelectedDeviceForLink('');
  };

  const cancelLinkDevice = () => {
    setLinkingRoomId(null);
    setSelectedDeviceForLink('');
  };

  // Fallback: attempt to link by updating the IoTDevice resource directly (PUT)
  const attemptLinkByUpdatingDevice = async (deviceExternalId: string, options: { roomId?: string, boilerId?: string }) => {
    try {
      const devices = await ApiService.getIoTDevices();
      const device = devices.find(d => d.deviceId === deviceExternalId);
      if (!device) throw new Error('Device not found for update fallback');

      const updatePayload = {
        ...device,
        roomId: options.roomId ?? device.roomId,
        boilerId: options.boilerId ?? device.boilerId,
      };

      await ApiService.updateIoTDevice(device.id, updatePayload);
      return true;
    } catch (err) {
      console.error('Failed to link via updateIoTDevice (fallback):', err);
      return false;
    }
  };

  const confirmLinkDevice = async (roomId: string, deviceId: string) => {
    setLinkingInProgress(true);
    try {
      await ApiService.linkIoTDeviceToRoom(deviceId, roomId);

      // refresh device list
      const devices = await ApiService.getIoTDevices();
      setIotDevices(devices);
      // close UI
      setLinkingRoomId(null);
      setSelectedDeviceForLink('');
      alert('Qurilma muvaffaqiyatli bog‘landi.');
    } catch (error) {
      console.error('Error linking device to room:', error);
      alert('Qurilmani bog‘lashda xatolik yuz berdi.');
    } finally {
      setLinkingInProgress(false);
    }
  };
  const [showDetailModal, setShowDetailModal] = useState<Facility | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState<{boilerId: string, facilityId: string} | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomHumidity, setNewRoomHumidity] = useState(50);
  
  const [showSettings, setShowSettings] = useState(false);
  const defaultConfig: HumidityConfig = { roomMin: 40, roomMax: 60, boilerMin: 30, boilerMax: 70 };
  const [config, setConfig] = useState<HumidityConfig>(defaultConfig);
  const [humidityConfig, setHumidityConfig] = useState<HumidityConfig>(config);
  
  // IoT Devices state
  const [iotDevices, setIotDevices] = useState<IoTDevice[]>([]);
  const [loadingIotDevices, setLoadingIotDevices] = useState(true);
  
  // New IoT Device Form State
  const [showAddIoTDeviceModal, setShowAddIoTDeviceModal] = useState(false);
  const [newIoTDevice, setNewIoTDevice] = useState({
    deviceId: '',
    deviceType: 'BOTH' as 'TEMPERATURE_SENSOR' | 'HUMIDITY_SENSOR' | 'BOTH',
    location: { lat: 0, lng: 0 }
  });
  


  const availableMfys = useMemo(() => GET_MFYS(cityName), [cityName]);

  // New Facility Form State
  const [newFacility, setNewFacility] = useState<DraftFacility>({
      name: '',
      type: 'SCHOOL',
      mfy: availableMfys[0],
      boilers: []
  });

  useEffect(() => {
     if (globalFilter === 'CRITICAL') setActiveFilter('ALL');
  }, [globalFilter]);
  
  // Fetch IoT devices helper (used on mount and when Add modal opens)
  const fetchIotDevices = async () => {
    try {
      setLoadingIotDevices(true);
      const devices = await ApiService.getIoTDevices();
      setIotDevices(devices);
    } catch (error) {
      console.error('Error fetching IoT devices:', error);
    } finally {
      setLoadingIotDevices(false);
    }
  };

  // Fetch IoT devices on component mount and poll every 30s
  useEffect(() => {
    fetchIotDevices();
    const interval = setInterval(fetchIotDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Ensure latest devices are loaded when Add Facility modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchIotDevices();
    }
  }, [showAddModal]);

  const openSettings = () => { setHumidityConfig(config); setShowSettings(true); };
  const saveSettings = () => { setConfig(humidityConfig); setShowSettings(false); };
  const resetSettings = () => { setHumidityConfig(defaultConfig); };
  
  // Function to handle adding new IoT device
  const handleAddIoTDevice = async () => {
    if (!newIoTDevice.deviceId) return;
    
    try {
      const deviceToAdd: IoTDevice = {
        id: `IOT-${Date.now()}`,
        deviceId: newIoTDevice.deviceId,
        deviceType: newIoTDevice.deviceType,
        location: newIoTDevice.location, // Use the location from the form
        lastSeen: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      // Add to local state
      const updatedDevices = [...iotDevices, deviceToAdd];
      setIotDevices(updatedDevices);
      
      // Save to backend
      try {
        const savedDevice = await ApiService.createIoTDevice(deviceToAdd);
        // Update local state with the backend response
        setIotDevices(prev => prev.map(d => d.id === deviceToAdd.id ? savedDevice : d));
      } catch (error) {
        console.error('Error saving IoT device to backend:', error);
        alert('IoT qurilmani saqlashda xatolik yuz berdi. Qurilma faqat lokal saqlangan.');
      }
      
      // Reset form and close modal
      setNewIoTDevice({
        deviceId: '',
        deviceType: 'BOTH',
        location: { lat: 0, lng: 0 }
      });
      setShowAddIoTDeviceModal(false);
    } catch (error) {
      console.error('Error adding IoT device:', error);
    }
  };

  const getStatusColor = (val: number, min: number, max: number) => {
    if (val >= min && val <= max) return 'OK';
    const diffMin = min - val;
    const diffMax = val - max;
    const deviation = Math.max(diffMin, diffMax);
    if (deviation <= 3) return 'WARNING';
    return 'CRITICAL';
  };

  const getTemperatureStatusColor = (val: number) => {
    if (val >= 18 && val <= 24) return 'OK';
    const deviation = Math.abs(21 - val); // 21 is optimal room temperature
    if (deviation <= 3) return 'WARNING';
    return 'CRITICAL';
  };

  const getTemperatureDirection = (val: number) => {
    if (val > 24) return 'HIGH';
    if (val < 18) return 'LOW';
    return 'NORMAL';
  };

  const getDirection = (val: number, min: number, max: number) => {
     if (val > max) return 'HIGH';
     if (val < min) return 'LOW';
     return 'NORMAL';
  };



  const processedFacilities = useMemo(() => {
    // Filter by MFY first
    const mfyFiltered = activeMFY === 'ALL' ? facilities : facilities.filter(f => f.mfy === activeMFY);

    const withStatus = mfyFiltered.map(f => {
       let hasCritical = false;
       let hasWarning = false;
       f.boilers.forEach(b => {
          // Check humidity status
          const s = getStatusColor(b.humidity, config.boilerMin, config.boilerMax);
          if (s === 'CRITICAL') hasCritical = true;
          if (s === 'WARNING') hasWarning = true;
          
          // Check temperature status if available
          if (b.temperature !== undefined) {
            const tempStatus = getTemperatureStatusColor(b.temperature);
            if (tempStatus === 'CRITICAL') hasCritical = true;
            if (tempStatus === 'WARNING') hasWarning = true;
          }
          
          if (b.connectedRooms) {
             b.connectedRooms.forEach(r => {
                const rs = getStatusColor(r.humidity, config.roomMin, config.roomMax);
                if (rs === 'CRITICAL') hasCritical = true;
                if (rs === 'WARNING') hasWarning = true;
                
                // Check room temperature status if available
                if (r.temperature !== undefined) {
                  const roomTempStatus = getTemperatureStatusColor(r.temperature);
                  if (roomTempStatus === 'CRITICAL') hasCritical = true;
                  if (roomTempStatus === 'WARNING') hasWarning = true;
                }
             });
          }
       });
       const severityScore = hasCritical ? 3 : hasWarning ? 2 : 1;
       return { ...f, severityScore, hasCritical, hasWarning };
    });

    return withStatus.filter(f => activeFilter === 'ALL' || f.type === activeFilter)
                     .sort((a, b) => b.severityScore - a.severityScore);
  }, [facilities, config, activeFilter, activeMFY]);

  // --- ADD FACILITY LOGIC ---
  const handleAddBoiler = () => {
      setNewFacility(prev => ({
          ...prev,
          boilers: [...(prev.boilers || []), { name: `Qozonxona #${(prev.boilers?.length || 0) + 1}`, targetHumidity: 50, connectedRooms: [] }]
      }));
  };

  const handleRemoveBoiler = (idx: number) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.filter((_, i) => i !== idx)
      }));
  };

  const handleBoilerChange = (idx: number, field: string, value: any) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.map((b, i) => i === idx ? { ...b, [field]: value } : b)
      }));
  };
  
  const handleBoilerIoTDeviceChange = (idx: number, deviceId: string) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.map((b, i) => i === idx ? { ...b, iotDeviceId: deviceId } : b)
      }));
  };

  const handleAddRoom = (boilerIdx: number) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.map((b, i) => i === boilerIdx ? {
              ...b,
              connectedRooms: [...(b.connectedRooms || []), { name: `Xona ${(b.connectedRooms?.length || 0) + 101}`, targetHumidity: 50 }]
          } : b)
      }));
  };

  const handleRemoveRoom = (boilerIdx: number, roomIdx: number) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.map((b, i) => i === boilerIdx ? {
              ...b,
              connectedRooms: b.connectedRooms?.filter((_, ri) => ri !== roomIdx)
          } : b)
      }));
  };

  const handleRoomChange = (boilerIdx: number, roomIdx: number, field: string, value: any) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.map((b, i) => i === boilerIdx ? {
              ...b,
              connectedRooms: b.connectedRooms?.map((r, ri) => ri === roomIdx ? { ...r, [field]: value } : r)
          } : b)
      }));
  };
  
  const handleRoomIoTDeviceChange = (boilerIdx: number, roomIdx: number, deviceId: string) => {
      setNewFacility(prev => ({
          ...prev,
          boilers: prev.boilers?.map((b, i) => i === boilerIdx ? {
              ...b,
              connectedRooms: b.connectedRooms?.map((r, ri) => ri === roomIdx ? { ...r, iotDeviceId: deviceId } : r)
          } : b)
      }));
  };
  
  // Function to update IoT devices after facility is created
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const updateIoTDevices = async (newFacility: DraftFacility, createdFacility: Facility) => {
    try {
      if (!createdFacility || !createdFacility.id) {
        console.warn('No created facility id provided; skipping IoT linking.');
        return;
      }

      // Build lists of desired links from draft data
      const boilerLinks: Array<{ boilerName: string; deviceId: string }> = [];
      const roomLinks: Array<{ boilerName?: string; roomName: string; deviceId: string }> = [];

      for (let bIdx = 0; bIdx < (newFacility.boilers || []).length; bIdx++) {
        const boiler = newFacility.boilers![bIdx];
        if (boiler.iotDeviceId && boiler.name) boilerLinks.push({ boilerName: boiler.name, deviceId: boiler.iotDeviceId });

        for (let rIdx = 0; rIdx < (boiler.connectedRooms || []).length; rIdx++) {
          const room = boiler.connectedRooms![rIdx];
          if (room.iotDeviceId && room.name) roomLinks.push({ boilerName: boiler.name, roomName: room.name, deviceId: room.iotDeviceId });
        }
      }

      // Helper to attempt linking, returns arrays of remaining links
      const tryLinking = async (createdState: any) => {
        const remainingBoilers = [] as typeof boilerLinks;
        const remainingRooms = [] as typeof roomLinks;

        // Link boilers
        for (const bl of boilerLinks) {
          const createdBoil = (createdState && createdState.boilers && (createdState.boilers.find((cb: any) => cb.name === bl.boilerName) || createdState.boilers.find((cb: any) => cb.name && cb.name.startsWith(bl.boilerName)))) as any;
          if (createdBoil) {
            try {
              console.debug('Linking IoT device to boiler:', bl.deviceId, '->', createdBoil.id);
              await ApiService.linkIoTDeviceToBoiler(bl.deviceId, createdBoil.id);
              continue; // linked successfully
            } catch (err) {
              console.error('Failed to link device to boiler (will retry):', bl.deviceId, err);
              // If server disallows POST (405), attempt fallback by updating the device record via PUT
              const msg = (err && (err as any).message) ? (err as any).message : String(err);
              if (msg.includes('405')) {
                const ok = await attemptLinkByUpdatingDevice(bl.deviceId, { boilerId: createdBoil.id });
                if (ok) continue; // fallback succeeded
              }

              remainingBoilers.push(bl);
            }
          } else {
            remainingBoilers.push(bl);
          }
        }

        // Link rooms
        for (const rl of roomLinks) {
          // Find boiler first (if we have boilerName)
          let createdBoil = null;
          if (rl.boilerName && createdState && createdState.boilers) {
            createdBoil = createdState.boilers.find((cb: any) => cb.name === rl.boilerName || (cb.name && cb.name.startsWith(rl.boilerName)));
          }

          // If no boiler found, try search across all boilers for matching room name
          let createdRoom: any = null;
          if (createdBoil && createdBoil.connectedRooms) {
            createdRoom = createdBoil.connectedRooms.find((cr: any) => cr.name === rl.roomName || (cr.name && cr.name.startsWith(rl.roomName)));
          } else if (createdState && createdState.boilers) {
            for (const cb of createdState.boilers) {
              if (cb.connectedRooms) {
                const cr = cb.connectedRooms.find((cr2: any) => cr2.name === rl.roomName || (cr2.name && cr2.name.startsWith(rl.roomName)));
                if (cr) { createdRoom = cr; break; }
              }
            }
          }

          if (createdRoom) {
            try {
              console.debug('Linking IoT device to room:', rl.deviceId, '->', createdRoom.id);
              await ApiService.linkIoTDeviceToRoom(rl.deviceId, createdRoom.id);
              continue; // linked successfully
            } catch (err) {
              console.error('Failed to link device to room (will retry):', rl.deviceId, err);
              // If server disallows POST (405), attempt fallback by updating the device via PUT
              const msg = (err && (err as any).message) ? (err as any).message : String(err);
              if (msg.includes('405')) {
                const ok = await attemptLinkByUpdatingDevice(rl.deviceId, { roomId: createdRoom.id });
                if (ok) continue; // fallback succeeded
              }
              remainingRooms.push(rl);
            }
          } else {
            remainingRooms.push(rl);
          }
        }

        return { remainingBoilers, remainingRooms };
      };

      // Initial attempt using the returned facility
      let currentCreated: any = createdFacility;
      try {
        if (!currentCreated.boilers || currentCreated.boilers.length === 0) {
          const fetched = await ApiService.getFacility(createdFacility.id);
          currentCreated = fetched;
        }
      } catch (err) {
        console.warn('Could not fetch created facility initially (will proceed to retry):', err);
      }

      // First pass
      let { remainingBoilers, remainingRooms } = await tryLinking(currentCreated);

      // If some remained, poll the server with exponential backoff
      if (remainingBoilers.length > 0 || remainingRooms.length > 0) {
        const maxAttempts = 6;
        const baseDelay = 1000; // ms

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.debug(`Waiting to retry linking (attempt ${attempt}/${maxAttempts})...`);
          await sleep(baseDelay * Math.pow(2, attempt - 1));

          try {
            const refreshed = await ApiService.getFacility(createdFacility.id);
            ({ remainingBoilers, remainingRooms } = await (async () => {
              // Update the link lists in scope (try linking only the remaining ones)
              const prevBoilerLinks = remainingBoilers.length > 0 ? remainingBoilers : [];
              const prevRoomLinks = remainingRooms.length > 0 ? remainingRooms : [];

              // Temporarily set the global lists to the remaining sets for tryLinking
              const origBoilerLinks = [...boilerLinks];
              const origRoomLinks = [...roomLinks];

              // Overwrite with only remaining
              // NOTE: tryLinking reads boilerLinks and roomLinks from closure; to avoid rewriting the function,
              // we will create local arrays and pass through a small inline attempt matcher instead.

              const localRemainingBoilers = [] as typeof boilerLinks;
              const localRemainingRooms = [] as typeof roomLinks;

              // Attempt to link previously remaining boilers
              for (const bl of prevBoilerLinks) {
                const createdBoil = (refreshed && refreshed.boilers && (refreshed.boilers.find((cb: any) => cb.name === bl.boilerName) || refreshed.boilers.find((cb: any) => cb.name && cb.name.startsWith(bl.boilerName)))) as any;
                if (createdBoil) {
                  try {
                    console.debug('Retry linking IoT device to boiler:', bl.deviceId, '->', createdBoil.id);
                    await ApiService.linkIoTDeviceToBoiler(bl.deviceId, createdBoil.id);
                    continue;
                  } catch (err) {
                    console.error('Retry failed linking device to boiler:', bl.deviceId, err);
                    const msg = (err && (err as any).message) ? (err as any).message : String(err);
                    if (msg.includes('405')) {
                      const ok = await attemptLinkByUpdatingDevice(bl.deviceId, { boilerId: createdBoil.id });
                      if (ok) continue;
                    }
                    localRemainingBoilers.push(bl);
                  }
                } else {
                  localRemainingBoilers.push(bl);
                }
              }

              // Attempt to link previously remaining rooms
              for (const rl of prevRoomLinks) {
                // Find matching room like above
                let createdRoom: any = null;
                if (refreshed && refreshed.boilers) {
                  for (const cb of refreshed.boilers) {
                    if (cb.connectedRooms) {
                      const cr = cb.connectedRooms.find((cr2: any) => cr2.name === rl.roomName || (cr2.name && cr2.name.startsWith(rl.roomName)));
                      if (cr) { createdRoom = cr; break; }
                    }
                  }
                }

                if (createdRoom) {
                  try {
                    console.debug('Retry linking IoT device to room:', rl.deviceId, '->', createdRoom.id);
                    await ApiService.linkIoTDeviceToRoom(rl.deviceId, createdRoom.id);
                    continue;
                  } catch (err) {
                    console.error('Retry failed linking device to room:', rl.deviceId, err);
                    const msg = (err && (err as any).message) ? (err as any).message : String(err);
                    if (msg.includes('405')) {
                      const ok = await attemptLinkByUpdatingDevice(rl.deviceId, { roomId: createdRoom.id });
                      if (ok) continue;
                    }
                    localRemainingRooms.push(rl);
                  }
                } else {
                  localRemainingRooms.push(rl);
                }
              }

              return { remainingBoilers: localRemainingBoilers, remainingRooms: localRemainingRooms };
            })());

            // If nothing remains, break early
            if (remainingBoilers.length === 0 && remainingRooms.length === 0) {
              console.debug('All IoT devices linked successfully after retries.');
              break;
            }
          } catch (err) {
            console.warn('Error fetching facility during retry:', err);
          }

          if (attempt === maxAttempts) {
            console.error('Some IoT devices could not be linked after retries:', { remainingBoilers, remainingRooms });
          }
        }
      }

      // Refresh local IoT devices list to reflect new links
      try {
        const devices = await ApiService.getIoTDevices();
        setIotDevices(devices);
      } catch (err) {
        console.error('Failed to refresh IoT devices after linking:', err);
      }

      // Final user-visible alert if there are remaining unlinked items
      if ((typeof remainingBoilers !== 'undefined' && remainingBoilers.length > 0) || (typeof remainingRooms !== 'undefined' && remainingRooms.length > 0)) {
        const failed = [ ...(remainingBoilers || []), ...(remainingRooms || []).map(r => ({ boilerName: r.boilerName, roomName: r.roomName, deviceId: r.deviceId })) ];
        console.warn('The following links could not be completed automatically:', failed);
        alert('Eslatma: Ba\'zi qurilmalar avtomatik bog\'lanmadi. Iltimos, ularni keyinroq tekshiring yoki qo\'lda bog\'lang.');
      }

    } catch (error) {
      console.error('Error updating IoT devices:', error);
    }
  };

  const submitNewFacility = async () => {
      if (!newFacility.name || !onAddFacility) return;

      const organizationId = localStorage.getItem('organizationId');
      if (!organizationId) {
          alert("Tashkilot aniqlanmadi. Iltimos, tizimga qayta kiring va qaytadan urining.");
          return;
      }
      
      const fullFacility: Facility = {
          id: `F-NEW-${Date.now()}`,
          name: newFacility.name,
          type: newFacility.type as any,
          mfy: newFacility.mfy || availableMfys[0],
          organizationId: organizationId, // Add organizationId
          overallStatus: SensorStatus.OPTIMAL,
          energyUsage: 0,
          efficiencyScore: 100,
          managerName: "Yangi Boshqaruvchi",
          lastMaintenance: "Hozirgina",
          history: [],
          boilers: (newFacility.boilers || []).map((b, bi) => ({
              id: `B-NEW-${Date.now()}-${bi}`,
              name: b.name || 'Qozonxona',
              targetHumidity: b.targetHumidity || 50,
              humidity: b.targetHumidity || 50, 
              status: SensorStatus.OPTIMAL,
              trend: [75, 75, 75],
              deviceHealth: { batteryLevel: 100, signalStrength: 100, lastPing: 'Hozir', firmwareVersion: 'v1.0', isOnline: true },
              connectedRooms: (b.connectedRooms || []).map((r, ri) => ({
                  id: `R-NEW-${Date.now()}-${bi}-${ri}`,
                  name: r.name || 'Xona',
                  targetHumidity: r.targetHumidity || 50,
                  humidity: r.targetHumidity || 50, 
                  status: SensorStatus.OPTIMAL,
                  trend: [22, 22, 22]
              }))
          }))
      };
      
      try {
          // Call the onAddFacility function which should save to backend and return created facility
          const savedFacility = await onAddFacility(fullFacility);

          // If we received a created facility from the server, attempt to link IoT devices selected in the draft
          if (savedFacility && savedFacility.id) {
            await updateIoTDevices(newFacility, savedFacility);
          } else {
            console.warn('Facility save did not return created resource; IoT devices were not linked automatically.');
          }

          // Success feedback
          alert('Ob\'ekt muvaffaqiyatli saqlandi va qurilmalar bog\'landi (agar tanlangan bo\'lsa).');
      } catch (error) {
          console.error('Error submitting new facility:', error);
          alert('Ob\'ektni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      }
      
      setShowAddModal(false);
      setNewFacility({ name: '', type: 'SCHOOL', mfy: availableMfys[0], boilers: [] }); 
  };

  return (
    <div className="h-full flex flex-col bg-white/40 relative">
       {/* Header */}
       <div className="p-5 border-b border-white/50 bg-white/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Wind size={16} />
              </div>
              Namlik Tizimi
            </h2>
            <div className="flex gap-2">

                <button onClick={() => setShowAddModal(true)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95" title="Yangi Ob'ekt Qo'shish"><Plus size={18}/></button>
                <button onClick={() => setShowAddIoTDeviceModal(true)} className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95" title="Yangi IoT Qurilma Qo'shish"><Radio size={18}/></button>
                <button onClick={openSettings} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-white border border-white flex items-center justify-center transition-all text-slate-500 hover:text-blue-600 shadow-sm"><Settings size={18} /></button>
            </div>
          </div>

          <div className="flex justify-between items-end">
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                 {[ { id: 'ALL', label: 'Barchasi' }, { id: 'SCHOOL', label: 'Maktab' }, { id: 'KINDERGARTEN', label: "Bog'cha" }, { id: 'HOSPITAL', label: 'Shifoxona' } ].map((filter) => (
                    <button key={filter.id} onClick={() => setActiveFilter(filter.id as FacilityTypeFilter)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${activeFilter === filter.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white/50 text-slate-600 border-white hover:bg-white'}`}>{filter.label}</button>
                 ))}
              </div>

          </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth custom-scrollbar">
        {processedFacilities.length === 0 ? (
            <div className="text-center py-10 opacity-50">
                <Building2 size={32} className="mx-auto mb-2 text-slate-400"/>
                <p className="text-xs font-bold text-slate-500">Bu mahallada muassasalar topilmadi</p>
            </div>
        ) : (
            processedFacilities.map((facility) => {
            const isExpanded = expandedFacility === facility.id;
            const { hasCritical, hasWarning } = facility;
            let cardStyle = "bg-white/60 border-white/60 hover:bg-white/80";
            
            if (hasCritical) { cardStyle = "bg-white/90 border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)] order-1"; } 
            else if (hasWarning) { cardStyle = "bg-white/80 border-amber-200 order-2"; } 
            else { cardStyle = "bg-white/60 border-white/60 order-3"; if (isExpanded) { cardStyle = "bg-white/90 border-blue-200 ring-4 ring-blue-500/5"; } }

            return (
                <div key={facility.id} className={`rounded-[20px] border shadow-sm overflow-hidden transition-all duration-500 ${cardStyle}`}>
                <div className="flex items-center justify-between p-4 cursor-pointer ios-btn-press" onClick={(e) => { e.stopPropagation(); setExpandedFacility(isExpanded ? null : facility.id); }}>
                    <div className="flex items-center gap-2">
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors" onClick={(e) => {e.stopPropagation(); setShowDetailModal(facility)}}>{facility.name}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide opacity-80">{facility.type === 'SCHOOL' ? 'Maktab' : facility.type === 'HOSPITAL' ? 'Shifoxona' : "Bog'cha"}</p>
                                <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 px-1.5 rounded"><MapPin size={10}/> {facility.mfy}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                    {hasCritical && <div className="px-2 py-1 bg-red-100 text-red-600 rounded-md text-[10px] font-bold animate-pulse">DIQQAT</div>}
                    {!hasCritical && hasWarning && <div className="px-2 py-1 bg-amber-100 text-amber-600 rounded-md text-[10px] font-bold">OGOHLANTIRISH</div>}
                    {!hasCritical && !hasWarning && <div className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-md text-[10px] font-bold">NORMADA</div>}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 pt-0 space-y-4">
                    {facility.boilers && facility.boilers.length > 0 ? (
                      facility.boilers.map((boiler) => {
                        // Find the IoT device linked to this boiler
                        const boilerIoTDevice = iotDevices.find(device => device.boilerId === boiler.id);
                        
                        // Use real-time data from IoT device if available, otherwise use stored data
                        const displayHumidity = boilerIoTDevice?.current_humidity !== undefined && boilerIoTDevice.current_humidity !== null 
                            ? boilerIoTDevice.current_humidity 
                            : boiler.humidity;
                        const displayTemperature = boilerIoTDevice?.current_temperature !== undefined && boilerIoTDevice.current_temperature !== null
                            ? boilerIoTDevice.current_temperature
                            : boiler.temperature;
                        
                        const bStatus = getStatusColor(displayHumidity, config.boilerMin, config.boilerMax);
                        const bDirection = getDirection(displayHumidity, config.boilerMin, config.boilerMax);
                        let boilerClass = "bg-slate-100/50 border-slate-200 text-slate-700";
                        let flameColor = "text-orange-500";
                        let sparkColor = "#94a3b8";
                        
                        if (bStatus === 'CRITICAL') { boilerClass = "bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20"; flameColor = "text-white animate-pulse"; sparkColor = "#fff"; } 
                        else if (bStatus === 'WARNING') { boilerClass = "bg-amber-100 text-amber-900 border-amber-200"; flameColor = "text-amber-600"; sparkColor = "#d97706"; } 
                        else { boilerClass = "bg-white text-slate-800 border-slate-200 shadow-sm"; flameColor = "text-blue-500"; sparkColor = "#3b82f6"; }

                        return (
                            <div key={boiler.id} className="rounded-[18px] p-2 bg-slate-50/50 border border-slate-100">
                            <div className="space-y-2 mb-3">
                              {/* Boiler Humidity Card */}
                              <div 
                                className={`rounded-[14px] p-3 border flex items-center justify-between transition-colors cursor-pointer ${boilerClass} ${expandedBoiler === boiler.id ? 'ring-2 ring-blue-400' : ''}`}
                                onClick={async (e) => { e.stopPropagation(); await handleToggleBoiler(boiler.id, facility.id, boiler); }}
                              >
                                  <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${bStatus === 'CRITICAL' ? 'bg-white/20' : 'bg-slate-100'}`}><Flame size={18} className={flameColor} /></div>
                                  <div><span className="block font-bold text-xs">{boiler.name}</span></div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="opacity-70"><Sparkline data={boiler.trend || []} color={sparkColor} /></div>
                                      <div className="flex items-center gap-2">
                                      {bDirection === 'HIGH' && <div className={`p-1 rounded-full ${bStatus === 'CRITICAL' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}><ArrowUp size={14} strokeWidth={3} /></div>}
                                      {bDirection === 'LOW' && <div className={`p-1 rounded-full ${bStatus === 'CRITICAL' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}><ArrowDown size={14} strokeWidth={3} /></div>}
                                      <div className={`px-3 py-1 rounded-[10px] text-sm font-bold flex items-center gap-1 ${bStatus === 'CRITICAL' ? 'bg-white/20' : 'bg-slate-100'}`}>{displayHumidity}%</div>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Boiler Temperature Card */}
                              {(displayTemperature !== undefined || boilerIoTDevice) && (
                                  <div className="rounded-[14px] p-3 border flex items-center justify-between bg-blue-50 border-blue-100">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-full bg-blue-100">
                                              <Thermometer size={18} className="text-blue-600" />
                                          </div>
                                          <div>
                                              <span className="block font-bold text-xs">Harorat</span>
                                              {boilerIoTDevice && (
                                                  <span className="text-[8px] text-blue-400">{boilerIoTDevice.deviceId}</span>
                                              )}
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                              <div className={`px-3 py-1 rounded-[10px] text-sm font-bold bg-blue-100 text-blue-800 flex items-center gap-1`}>
                                                  {displayTemperature !== undefined ? `${displayTemperature}°C` : 'N/A'}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}
                            </div>
                            <div className={`transition-all duration-300 overflow-hidden ${expandedBoiler === boiler.id ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                              <div className="px-2 mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2"><ArrowDownRight size={14} className="text-slate-300" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bog'langan Xonalar</span></div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddRoomModal({ boilerId: boiler.id, facilityId: facility.id });
                                    setNewRoomName('');
                                    setNewRoomHumidity(50);
                                  }}
                                  className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-200 flex items-center gap-1"
                                >
                                  <Plus size={10}/> Xona Qo'shish
                                </button>
                              </div>
                              
                              {/* Rooms Table */}
                              {/* Rooms Table: prefer boiler.connectedRooms, fallback to loadedBoilerRooms[boiler.id] (lazy-loaded) */}
                              {((boiler.connectedRooms && boiler.connectedRooms.length > 0) || (loadedBoilerRooms[boiler.id] && loadedBoilerRooms[boiler.id].length > 0)) ? (
                                <div className="overflow-x-auto rounded-[12px] border border-slate-200">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-slate-100 border-b border-slate-200">
                                        <th className="px-3 py-2 text-left font-bold text-slate-600">Xona Nomi</th>
                                        <th className="px-3 py-2 text-center font-bold text-slate-600">Namlik</th>
                                        <th className="px-3 py-2 text-center font-bold text-slate-600">Harorat</th>
                                        <th className="px-3 py-2 text-center font-bold text-slate-600">Trend</th>
                                        <th className="px-3 py-2 text-center font-bold text-slate-600">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(boiler.connectedRooms && boiler.connectedRooms.length > 0 ? boiler.connectedRooms : loadedBoilerRooms[boiler.id] || []).map((room, roomIdx) => {
                                        // Find the IoT device linked to this room
                                        let roomIoTDevice = iotDevices.find(device => device.roomId === room.id);
                                        let deviceSource: 'room' | 'boiler' | null = null;
                                        if (roomIoTDevice) {
                                          deviceSource = roomIoTDevice.roomId === room.id ? 'room' : 'boiler';
                                        } else {
                                          // Fallback: use boiler-level device if available (gives approximate readings)
                                          roomIoTDevice = iotDevices.find(device => device.boilerId === boiler.id && !device.roomId);
                                          if (roomIoTDevice) deviceSource = 'boiler';
                                        }

                                        // Use real-time data from IoT device if available, otherwise use stored data
                                        const roomDisplayHumidity = roomIoTDevice?.current_humidity !== undefined && roomIoTDevice.current_humidity !== null
                                            ? roomIoTDevice.current_humidity
                                            : room.humidity;
                                        
                                        const roomDisplayTemperature = roomIoTDevice?.current_temperature !== undefined && roomIoTDevice.current_temperature !== null
                                            ? roomIoTDevice.current_temperature
                                            : room.temperature;
                                        
                                        const rStatus = getStatusColor(roomDisplayHumidity, config.roomMin, config.roomMax);
                                        const rDirection = getDirection(roomDisplayHumidity, config.roomMin, config.roomMax);
                                        
                                        let statusBg = "bg-emerald-50 text-emerald-700";
                                        let statusText = "NORMADA";
                                        let rSparkColor = "#10b981";
                                        
                                        if (rStatus === 'CRITICAL') { 
                                          statusBg = "bg-red-50 text-red-700"; 
                                          statusText = "DIQQAT"; 
                                          rSparkColor = "#dc2626"; 
                                        } 
                                        else if (rStatus === 'WARNING') { 
                                          statusBg = "bg-amber-50 text-amber-700"; 
                                          statusText = "OGOHLANTIRISH"; 
                                          rSparkColor = "#d97706"; 
                                        }
                                        
                                        return (
                                          <tr key={room.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${roomIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                            <td className="px-3 py-2.5">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                <span className="font-bold text-slate-800">{room.name}</span>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                              {roomIoTDevice ? (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{roomIoTDevice.deviceId}</span>
                                                  {deviceSource === 'boiler' && <span className="text-[9px] text-slate-400">(Qozondan)</span>}
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[8px] font-bold text-slate-400">Bog'lanmagan</span>
                                                  <button onClick={(e) => { e.stopPropagation(); openLinkDeviceForRoom(room.id); }} className="text-[9px] font-bold text-blue-600 hover:underline">Bog'lash</button>
                                                </div>
                                              )}

                                              {/* Device linking UI */}
                                              {linkingRoomId === room.id && (
                                                <div className="mt-2 flex items-center gap-2">
                                                  <select className="text-sm p-1 border rounded" value={selectedDeviceForLink} onChange={(e) => setSelectedDeviceForLink(e.target.value)}>
                                                    <option value="">— Qurilma tanlang —</option>
                                                    {iotDevices.filter(d => !d.roomId).map(d => (
                                                      <option key={d.id} value={d.deviceId}>{d.deviceId}{d.boilerId ? ` (Boiler ${d.boilerId})` : ''}</option>
                                                    ))}
                                                  </select>
                                                  <button onClick={async (e) => { e.stopPropagation(); if (selectedDeviceForLink) await confirmLinkDevice(room.id, selectedDeviceForLink); }} disabled={!selectedDeviceForLink || linkingInProgress} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold">{linkingInProgress ? 'Yuklanmoqda...' : 'Rasmiylashtir'}</button>
                                                  <button onClick={(e) => { e.stopPropagation(); cancelLinkDevice(); }} className="px-2 py-1 text-xs text-slate-500 hover:underline">Bekor</button>
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                {rDirection === 'HIGH' && <ArrowUp size={12} className="text-red-500" strokeWidth={3} />}
                                                {rDirection === 'LOW' && <ArrowDown size={12} className="text-blue-500" strokeWidth={3} />}
                                                <span className="font-bold text-slate-800">{roomDisplayHumidity}%</span>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                              {roomDisplayTemperature !== undefined ? (
                                                <span className="font-bold text-slate-800">{roomDisplayTemperature}°C</span>
                                              ) : (
                                                <span className="text-slate-400">-</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                              <div className="flex justify-center">
                                                <Sparkline data={room.trend || []} color={rSparkColor} height={15} />
                                              </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${statusBg}`}>
                                                {statusText}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-[12px] border border-slate-200">
                                  {loadingBoilerRooms[boiler.id] ? 'Xonalar yuklanmoqda...' : 'Hozircha xona yo\'q. Yuqoridagi tugmani bosing.'}
                                </div>
                              )}
                            </div>
                            </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-[12px] border border-slate-200">
                        Hozircha qozonxona yo'q.
                      </div>
                    )}
                    </div>
                </div>
                </div>
            );
            })
        )}
      </div>

      {/* Add Room to Boiler Modal */}
      {showAddRoomModal && (
          <div className="absolute inset-0 z-[180] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building2 className="text-blue-600" /> Yangi Xona Qo'shish</h3>
                      <button onClick={() => setShowAddRoomModal(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><X size={18}/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Xona Nomi</label>
                          <input 
                              type="text" 
                              value={newRoomName} 
                              onChange={(e) => setNewRoomName(e.target.value)} 
                              placeholder="Masalan: Xona 101" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                          />
                      </div>
                      
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Maqsad Namlik (%)</label>
                          <input 
                              type="number" 
                              value={newRoomHumidity} 
                              onChange={(e) => setNewRoomHumidity(parseInt(e.target.value))} 
                              min="0"
                              max="100"
                              className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                          />
                      </div>
                  </div>
                  
                  <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                      <button onClick={() => setShowAddRoomModal(null)} className="px-5 py-2.5 rounded-[12px] font-bold text-xs text-slate-500 hover:bg-slate-100">Bekor Qilish</button>
                      <button 
                        onClick={async () => {
                          if (!newRoomName || !showAddRoomModal) return;
                          
                          try {
                            // Create new room
                            const newRoom: Room = {
                              id: `R-${Date.now()}`,
                              name: newRoomName,
                              targetHumidity: newRoomHumidity,
                              humidity: newRoomHumidity,
                              status: SensorStatus.OPTIMAL,
                              trend: [50, 50, 50]
                            };
                            
                            // Find the facility and boiler
                            const facility = facilities.find(f => f.id === showAddRoomModal.facilityId);
                            const boiler = facility?.boilers.find(b => b.id === showAddRoomModal.boilerId);
                            
                            if (facility && boiler) {
                              // Add room to boiler
                              const updatedBoiler = {
                                ...boiler,
                                connectedRooms: [...(boiler.connectedRooms || []), newRoom]
                              };
                              
                              const updatedFacility: Facility = {
                                ...facility,
                                boilers: facility.boilers.map(b => b.id === boiler.id ? updatedBoiler : b)
                              };
                              
                              // Ensure all required fields are present for backend
                              const facilityToSave: Facility = {
                                id: updatedFacility.id,
                                name: updatedFacility.name,
                                type: updatedFacility.type,
                                mfy: updatedFacility.mfy,
                                overallStatus: updatedFacility.overallStatus || SensorStatus.OPTIMAL,
                                energyUsage: updatedFacility.energyUsage ?? 0,
                                efficiencyScore: updatedFacility.efficiencyScore ?? 100,
                                managerName: updatedFacility.managerName || 'Boshqaruvchi',
                                lastMaintenance: updatedFacility.lastMaintenance || new Date().toISOString(),
                                history: updatedFacility.history || [],
                                boilers: updatedFacility.boilers.map(b => ({
                                  ...b,
                                  connectedRooms: b.connectedRooms || []
                                }))
                              };
                              
                              // Call onAddFacility to save to backend
                              if (onAddFacility) {
                                await onAddFacility(facilityToSave);
                              }
                            }
                            
                            setShowAddRoomModal(null);
                            setNewRoomName('');
                            setNewRoomHumidity(50);
                          } catch (error) {
                            console.error('Error adding room:', error);
                            alert('Xonani qo\'shishda xatolik yuz berdi.');
                          }
                        }}
                        disabled={!newRoomName} 
                        className="px-6 py-2.5 rounded-[12px] bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                      >
                        <Check size={16}/> Qo'shish
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[24px] shadow-2xl border border-white w-full max-w-sm">
              <div className="flex justify-between items-center mb-5"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Settings size={18} className="text-blue-600" /> Normal Namlik</h3><button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500"><X size={18} /></button></div>
              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-slate-700"><Building2 size={16} className="text-blue-500" /><span className="text-xs font-bold uppercase tracking-wide">Xonalar (%)</span></div>
                    <div className="flex items-center gap-3">
                       <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 ml-1">MIN</label><input type="number" value={humidityConfig.roomMin} onChange={(e) => setHumidityConfig({...humidityConfig, roomMin: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-sm font-bold text-center outline-none"/></div>
                       <div className="w-4 h-0.5 bg-slate-300 rounded-full mt-4"></div>
                       <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 ml-1">MAX</label><input type="number" value={humidityConfig.roomMax} onChange={(e) => setHumidityConfig({...humidityConfig, roomMax: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-sm font-bold text-center outline-none"/></div>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-slate-700"><Flame size={16} className="text-orange-500" /><span className="text-xs font-bold uppercase tracking-wide">Qozonxonalar (%)</span></div>
                    <div className="flex items-center gap-3">
                       <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 ml-1">MIN</label><input type="number" value={humidityConfig.boilerMin} onChange={(e) => setHumidityConfig({...humidityConfig, boilerMin: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-sm font-bold text-center outline-none"/></div>
                       <div className="w-4 h-0.5 bg-slate-300 rounded-full mt-4"></div>
                       <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 ml-1">MAX</label><input type="number" value={humidityConfig.boilerMax} onChange={(e) => setHumidityConfig({...humidityConfig, boilerMax: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-sm font-bold text-center outline-none"/></div>
                    </div>
                 </div>
              </div>
              <div className="mt-5 space-y-2">
                 <button onClick={saveSettings} className="w-full py-3 bg-slate-900 text-white rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800"><Save size={16} /> Saqlash</button>
                 <button onClick={resetSettings} className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 flex items-center justify-center gap-1.5"><RotateCcw size={12} /> Asl holiga qaytarish</button>
              </div>
           </div>
        </div>
      )}

      {/* Add New Facility Modal */}
      {showAddModal && (
          <div className="absolute inset-0 z-[160] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-3xl h-[85vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building2 className="text-blue-600" /> Yangi Ob'ekt Qo'shish</h3>
                      <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><X size={18}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                      <div className="space-y-6">
                          {/* Facility Info */}
                          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Asosiy Ma'lumotlar</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Muassasa Nomi</label>
                                      <input type="text" value={newFacility.name} onChange={(e) => setNewFacility({...newFacility, name: e.target.value})} placeholder="Masalan: 5-Maktab" className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Muassasa Turi</label>
                                      <select value={newFacility.type} onChange={(e) => setNewFacility({...newFacility, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none">
                                          <option value="SCHOOL">Maktab</option>
                                          <option value="KINDERGARTEN">Bog'cha</option>
                                          <option value="HOSPITAL">Shifoxona</option>
                                      </select>
                                  </div>
                                  <div className="col-span-2">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">MFY (Joylashuvi)</label>
                                      <select value={newFacility.mfy} onChange={(e) => setNewFacility({...newFacility, mfy: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none">
                                          {availableMfys.map(mfy => (
                                              <option key={mfy} value={mfy}>{mfy}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>
                          </div>

                          {/* Boilers Builder */}
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase">Qozonxonalar va Xonalar</h4>
                                  <button onClick={handleAddBoiler} className="text-[10px] font-bold bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-200 flex items-center gap-1"><Plus size={12}/> Qozonxona Qo'shish</button>
                              </div>
                              
                              {newFacility.boilers?.length === 0 && (
                                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-[20px] text-slate-400 text-sm font-medium">Hozircha qozonxona yo'q. Yuqoridagi tugmani bosing.</div>
                              )}

                              {newFacility.boilers?.map((boiler, bIdx) => (
                                  <div key={bIdx} className="bg-white rounded-[20px] shadow-sm border border-orange-100 overflow-hidden">
                                      <div className="p-4 bg-orange-50/50 border-b border-orange-100">
                                          <div className="flex justify-between items-center mb-3">
                                              <div className="flex items-center gap-3 flex-1">
                                                  <div className="w-8 h-8 rounded-full bg-white text-orange-500 flex items-center justify-center shadow-sm"><Flame size={16}/></div>
                                                  <input type="text" value={boiler.name} onChange={(e) => handleBoilerChange(bIdx, 'name', e.target.value)} placeholder="Qozonxona Nomi" className="bg-transparent font-bold text-sm text-slate-800 outline-none placeholder:text-slate-400 w-full" />
                                              </div>
                                              <div className="flex items-center gap-3">
                                                  <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-orange-100">
                                                      <span className="text-[9px] font-bold text-slate-400 mr-2">MAQSAD</span>
                                                      <input type="number" value={boiler.targetHumidity} onChange={(e) => handleBoilerChange(bIdx, 'targetHumidity', parseInt(e.target.value))} className="w-8 text-xs font-bold text-center outline-none" />
                                                      <span className="text-[10px] font-bold text-slate-500">%</span>
                                                  </div>
                                                  <button onClick={() => handleRemoveBoiler(bIdx)} className="w-7 h-7 rounded-full hover:bg-red-100 text-red-400 hover:text-red-500 flex items-center justify-center"><Trash2 size={14}/></button>
                                              </div>
                                          </div>
                                          
                                          {/* IoT Device Selection for Boiler */}
                                          <div className="flex items-center gap-2">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase block">IoT Sensor</label>
                                              <select 
                                                  value={boiler.iotDeviceId || ''}
                                                  onChange={(e) => handleBoilerIoTDeviceChange(bIdx, e.target.value)}
                                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                              >
                                                  {loadingIotDevices ? (
                                                      <option value="">Yuklanmoqda...</option>
                                                  ) : (
                                                      <>
                                                          <option value="">Sensor tanlang</option>
                                                          {iotDevices
                                                              .filter(device => (device.deviceType === 'BOTH' || device.deviceType === 'HUMIDITY_SENSOR') && !device.boilerId)
                                                              .map(device => (
                                                                  <option key={device.id} value={device.deviceId}>
                                                                      {device.deviceId} - {device.deviceType} ({device.isActive ? 'Faol' : 'Faol emas'})
                                                                  </option>
                                                              ))}
                                                      </>
                                                  )}
                                              </select>
                                          </div>
                                      </div>
                                      
                                      <div className="p-4 bg-slate-50/30">
                                          <div className="space-y-2">
                                              {boiler.connectedRooms?.map((room, rIdx) => (
                                                  <div key={rIdx} className="flex items-center gap-3 p-2 bg-white rounded-[12px] border border-slate-100 shadow-sm">
                                                      <div className="w-1.5 h-8 bg-blue-400 rounded-full"></div>
                                                      <input type="text" value={room.name} onChange={(e) => handleRoomChange(bIdx, rIdx, 'name', e.target.value)} placeholder="Xona Nomi" className="flex-1 bg-transparent text-xs font-bold text-slate-700 outline-none" />
                                                      <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                          <Thermometer size={12} className="text-slate-400"/>
                                                          <input type="number" value={room.targetHumidity} onChange={(e) => handleRoomChange(bIdx, rIdx, 'targetHumidity', parseInt(e.target.value))} className="w-6 bg-transparent text-xs font-bold text-center outline-none"/>
                                                          <span className="text-[9px] text-slate-400">%</span>
                                                      </div>
                                                      {/* IoT Device Selection for Room */}
                                                      <select 
                                                          value={room.iotDeviceId || ''}
                                                          onChange={(e) => handleRoomIoTDeviceChange(bIdx, rIdx, e.target.value)}
                                                          className="text-[9px] bg-slate-50 border border-slate-200 rounded-[8px] px-1.5 py-1 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none w-20"
                                                      >
                                                          {loadingIotDevices ? (
                                                              <option value="">Yuklanmoqda...</option>
                                                          ) : (
                                                              <>
                                                                  <option value="">Sensor</option>
                                                                  {iotDevices
                                                                      .filter(device => (device.deviceType === 'BOTH' || device.deviceType === 'HUMIDITY_SENSOR') && !device.roomId)
                                                                      .map(device => (
                                                                          <option key={device.id} value={device.deviceId}>
                                                                              {device.deviceId}
                                                                          </option>
                                                                      ))}
                                                              </>
                                                          )}
                                                      </select>
                                                      <button onClick={() => handleRemoveRoom(bIdx, rIdx)} className="p-1.5 text-slate-300 hover:text-red-500"><X size={14}/></button>
                                                  </div>
                                              ))}
                                              <button onClick={() => handleAddRoom(bIdx)} className="w-full py-2 border border-dashed border-blue-200 bg-blue-50/50 text-blue-500 rounded-[12px] text-[10px] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"><Plus size={12}/> Xona Qo'shish</button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                      <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-[12px] font-bold text-xs text-slate-500 hover:bg-slate-100">Bekor Qilish</button>
                      <button onClick={submitNewFacility} disabled={!newFacility.name} className="px-6 py-2.5 rounded-[12px] bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"><Check size={16}/> Saqlash va Kiritish</button>
                  </div>
              </div>
          </div>
      )}

      {/* Add IoT Device Modal */}
      {showAddIoTDeviceModal && (
          <div className="absolute inset-0 z-[170] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Radio className="text-blue-600" /> Yangi IoT Qurilma Qo'shish</h3>
                      <button onClick={() => setShowAddIoTDeviceModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><X size={18}/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Qurilma ID</label>
                          <input 
                              type="text" 
                              value={newIoTDevice.deviceId} 
                              onChange={(e) => setNewIoTDevice({...newIoTDevice, deviceId: e.target.value})} 
                              placeholder="Masalan: ESP-123ABC" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                          />
                      </div>
                      
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Qurilma Turi</label>
                          <select 
                              value={newIoTDevice.deviceType} 
                              onChange={(e) => setNewIoTDevice({...newIoTDevice, deviceType: e.target.value as any})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          >
                              <option value="TEMPERATURE_SENSOR">Harorat Sensori</option>
                              <option value="HUMIDITY_SENSOR">Namlik Sensori</option>
                              <option value="BOTH">Harorat va Namlik Sensori</option>
                          </select>
                      </div>
                      

                  </div>
                  
                  <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                      <button onClick={() => setShowAddIoTDeviceModal(false)} className="px-5 py-2.5 rounded-[12px] font-bold text-xs text-slate-500 hover:bg-slate-100">Bekor Qilish</button>
                      <button onClick={handleAddIoTDevice} disabled={!newIoTDevice.deviceId} className="px-6 py-2.5 rounded-[12px] bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"><Check size={16}/> Qo'shish</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Detailed Facility Modal (Existing) */}
      {showDetailModal && (
          <div className="absolute inset-0 z-[150] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-[32px] w-full max-w-2xl h-[500px] shadow-2xl flex flex-col overflow-hidden relative">
                  <button onClick={() => setShowDetailModal(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"><X size={18}/></button>
                  
                  <div className="h-40 bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-end relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl translate-x-10 -translate-y-10"></div>
                      <div className="relative z-10 text-white">
                          <h2 className="text-2xl font-bold mb-1">{showDetailModal.name}</h2>
                          <div className="flex items-center gap-3 text-sm opacity-80">
                             <span className="flex items-center gap-1"><Info size={14}/> ID: {showDetailModal.id}</span>
                             <span className="w-1 h-1 bg-white rounded-full"></span>
                             <span>{showDetailModal.type}</span>
                             <span className="w-1 h-1 bg-white rounded-full"></span>
                             <span className="font-bold">{showDetailModal.mfy}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 p-6 grid grid-cols-2 gap-6 bg-slate-50">
                      <div className="space-y-4">
                         <div className="bg-white p-4 rounded-[20px] shadow-sm">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Zap size={14} /> Namlik Pasporti</h4>
                             <div className="flex justify-between items-end mb-2">
                                 <span className="text-3xl font-bold text-slate-800">{showDetailModal.energyUsage} <span className="text-sm font-medium text-slate-400">%</span></span>
                                 <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">+2.4% tejaldi</span>
                             </div>
                             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[75%] rounded-full"></div></div>
                         </div>
                      </div>
                      
                      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 relative">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><BarChart size={14} /> 12 Soatlik Namlik Dinamikasi</h4>
                          {/* Simulated SVG Chart */}
                          <svg className="w-full h-40 overflow-visible">
                              <polyline 
                                points={showDetailModal.history.map((h, i) => `${(i/11)*240},${100 - (h/1000)*100}`).join(' ')} 
                                fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                              />
                              <path 
                                d={`M0,100 ` + showDetailModal.history.map((h, i) => `L${(i/11)*240},${100 - (h/1000)*100}`).join(' ') + ` L240,100 Z`}
                                fill="rgba(59, 130, 246, 0.1)"
                              />
                          </svg>
                          <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold">
                              <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClimateMonitor;