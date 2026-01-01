
import React, { useState, useEffect } from 'react';
import { Organization, UserSession } from '../types';
import { ALL_MODULES, UZB_REGIONS } from '../constants';
import { DB } from '../services/storage';
import { Building2, Users, User, Settings, Plus, Search, LogOut, CheckCircle, XCircle, ShieldCheck, MapPin, Trash2, X, ChevronRight, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuperAdminDashboardProps {
    onLogout: () => void;
    onLoginAsOrg?: (session: UserSession) => void;
}

type AdminTab = 'ORGANIZATIONS';

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout, onLoginAsOrg }) => {
    const [activeTab] = useState<AdminTab>('ORGANIZATIONS');
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [orgTypeFilter, setOrgTypeFilter] = useState<'ALL' | 'HOKIMIYAT' | 'AGENCY' | 'ENTERPRISE'>('ALL');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Organization>>({
        name: '', login: '', password: '', enabledModules: ['DASHBOARD'], type: 'HOKIMIYAT'
    });
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // Load Data
    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                // Use API service to get organizations instead of localStorage
                const orgs = await DB.getOrgs();
                // Ensure we always have an array
                setOrganizations(Array.isArray(orgs) ? orgs : []);
            } catch (error) {
                console.error('Error loading organizations:', error);
                // Fallback to empty array if API fails
                setOrganizations([]);
            }
        };
        
        loadOrganizations();
    }, []);

    // Toast Timer
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
    };

    const handleCreate = () => {
        setEditingOrg(null);
        setFormData({ name: '', login: '', password: '', enabledModules: ['DASHBOARD'], type: 'HOKIMIYAT' });
        setSelectedRegion(''); 
        setSelectedDistrict(''); 
        setShowAddModal(true);
    };

    const handleLoginAs = (org: Organization) => {
        if (!onLoginAsOrg) return;
        const region = UZB_REGIONS.find(r => r.id === org.regionId);
        const district = region?.districts.find(d => d.id === org.districtId);
        if (region && district) {
            const session: UserSession = {
                user: { name: org.name, role: 'ADMIN', organizationId: org.id },
                region: region,
                district: district,
                enabledModules: org.enabledModules
            };
            onLoginAsOrg(session);
        }
    };

    const handleResetPassword = async (orgId: string) => {
        if(confirm("Tashkilot parolini '12345' ga o'zgartirmoqchimisiz?")) {
            const org = organizations.find(o => o.id === orgId);
            if(org) {
                const updated = {...org, password: '12345'};
                DB.saveOrg(updated);
                const updatedOrgs = await DB.getOrgs();
                setOrganizations(updatedOrgs);
                showToast(`Tashkilot ${org.name} paroli yangilandi`, 'success');
            }
        }
    }

    const handleDeleteOrg = async (orgId: string) => {
        if(confirm("DIQQAT! Tashkilotni butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) {
            DB.deleteOrg(orgId);
            const updatedOrgs = await DB.getOrgs();
            setOrganizations(updatedOrgs);
            showToast("Tashkilot muvaffaqiyatli o'chirildi", 'success');
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        const regionObj = UZB_REGIONS.find(r => r.id === selectedRegion);
        const districtObj = regionObj?.districts.find(d => d.id === selectedDistrict);
        
        if(!districtObj && !editingOrg) {
            showToast("Hudud va tuman tanlanishi shart!", 'error');
            return;
        };

        const currentRegionId = selectedRegion || editingOrg?.regionId || '';
        const currentDistrictId = selectedDistrict || editingOrg?.districtId || '';
        let center = districtObj?.center || editingOrg?.center || { lat: 41.2995, lng: 69.2401 };

        const newOrg: Organization = {
            id: editingOrg ? editingOrg.id : `ORG-${Date.now()}`,
            name: formData.name!,
            login: formData.login!,
            password: formData.password || (editingOrg ? editingOrg.password! : '123'),
            type: formData.type as any,
            regionId: currentRegionId,
            districtId: currentDistrictId,
            center: center,
            enabledModules: formData.enabledModules || []
        };

        DB.saveOrg(newOrg);
        const updatedOrgs = await DB.getOrgs();
        setOrganizations(updatedOrgs);
        setShowAddModal(false);
        showToast(editingOrg ? "Ma'lumotlar yangilandi" : "Yangi tashkilot qo'shildi");
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden">
            
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 20 }} 
                        className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-[1000] flex items-center gap-3 font-bold border ${toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-red-600 text-white border-red-500'}`}
                    >
                        {toastMessage.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                        {toastMessage.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside className="w-72 bg-[#0f172a]/80 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 z-20 relative">
                <div className="p-6 border-b border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 bg-gradient-to-br from-indigo-600 to-violet-600">
                        <ShieldCheck size={24} className="text-white"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">NEXUS</h1>
                        <p className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest">SuperAdmin v4.2</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold bg-white/10 text-white shadow-lg border border-white/10"
                    >
                        <Building2 size={18} className="text-white"/> 
                        Tashkilotlar Boshqaruvi
                    </button>
                </nav>

                <div className="p-6 mt-auto border-t border-white/5">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                        <LogOut size={16}/> Tizimdan Chiqish
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                <header className="h-20 border-b border-white/5 flex justify-between items-center px-8 bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-white">Superadministrator Paneli</h2>
                        <p className="text-[10px] text-slate-400 font-mono">Tizimdagi tashkilotlar va hududlarni nazorat qilish</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-white">Asosiy Admin</span>
                            <span className="text-[10px] text-emerald-400 font-mono">ROOT ACCESS</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-600 p-0.5 border border-indigo-400">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=0f172a&color=fff" className="w-full h-full rounded-full object-cover"/>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold">Jami Tashkilotlar</p><p className="text-2xl font-bold text-white">{organizations.length}</p></div>
                                <Building2 size={24} className="text-indigo-500 opacity-50"/>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold">Aktiv Hududlar</p><p className="text-2xl font-bold text-emerald-400">{new Set(organizations.map(o => o.regionId)).size}</p></div>
                                <MapPin size={24} className="text-emerald-500 opacity-50"/>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-[24px] border border-white/5">
                            <div className="flex gap-4">
                                <div className="relative w-72 group">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"/>
                                    <input 
                                        type="text" 
                                        placeholder="Tashkilotlarni qidirish..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm font-bold text-white placeholder-slate-600 transition-all"
                                    />
                                </div>
                                <div className="flex bg-slate-950 rounded-xl p-1 border border-white/10">
                                    {['ALL', 'HOKIMIYAT', 'AGENCY', 'ENTERPRISE'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setOrgTypeFilter(t as any)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${orgTypeFilter === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t === 'ALL' ? 'Barchasi' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleCreate} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2 active:scale-95">
                                <Plus size={18}/> Yangi Qo'shish
                            </button>
                        </div>

                        {/* Organizations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {organizations
                                .filter(org => (orgTypeFilter === 'ALL' || org.type === orgTypeFilter) && org.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(org => {
                                const regionName = UZB_REGIONS.find(r => r.id === org.regionId)?.name;
                                const districtName = UZB_REGIONS.find(r => r.id === org.regionId)?.districts.find(d => d.id === org.districtId)?.name;

                                return (
                                <div key={org.id} className="bg-slate-900/50 backdrop-blur rounded-[24px] border border-white/5 p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-white/10 shadow-inner text-lg">
                                                {org.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-sm line-clamp-1">{org.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-mono uppercase mt-1 tracking-wide">{org.type}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded border border-emerald-500/20">ACTIVE</span>
                                    </div>
                                    
                                    <div className="space-y-2 mb-6 flex-1">
                                        <div className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-slate-500 font-bold flex items-center gap-2"><MapPin size={12}/> Hudud</span>
                                            <span className="font-bold text-slate-300 text-right">{regionName || 'N/A'}, {districtName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-slate-500 font-bold flex items-center gap-2"><User size={12}/> Login</span>
                                            <span className="font-mono text-indigo-300">{org.login}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/10">
                                        <button onClick={() => handleLoginAs(org)} className="col-span-2 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"> Kirish</button>
                                        <button onClick={() => { setEditingOrg(org); setFormData({...org}); setSelectedRegion(org.regionId); setSelectedDistrict(org.districtId); setShowAddModal(true); }} className="py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg flex items-center justify-center"><Settings size={16}/></button>
                                        <button onClick={() => handleResetPassword(org.id)} className="py-2 bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 rounded-lg flex items-center justify-center"><Key size={16}/></button>
                                        <button onClick={() => handleDeleteOrg(org.id)} className="col-span-4 mt-1 py-2 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 border border-transparent hover:border-red-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"><Trash2 size={14}/> O'chirish</button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* ADD/EDIT MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f172a] w-full max-w-3xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1e293b]/50">
                                <h2 className="text-xl font-bold text-white">{editingOrg ? 'Tashkilotni Tahrirlash' : 'Yangi Tashkilot Qo\'shish'}</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"><XCircle size={24}/></button>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Tashkilot Nomi</label>
                                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Masalan: Farg'ona shahar hokimiyati"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Turi</label>
                                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors">
                                                <option value="HOKIMIYAT">Hokimiyat</option>
                                                <option value="AGENCY">Agentlik</option>
                                                <option value="ENTERPRISE">Korxona</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Viloyat / Shahar</label>
                                            <select 
                                                value={selectedRegion} 
                                                onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDistrict(''); }}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                            >
                                                <option value="">Tanlang...</option>
                                                {UZB_REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Tuman / Shahar</label>
                                            <select 
                                                value={selectedDistrict} 
                                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                                disabled={!selectedRegion}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                                            >
                                                <option value="">Tanlang...</option>
                                                {selectedRegion && UZB_REGIONS.find(r => r.id === selectedRegion)?.districts.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Login</label>
                                            <input required type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Parol</label>
                                            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500" placeholder="Bo'sh qolsa '123' bo'ladi"/>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Modullar Ruxsati</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {ALL_MODULES.map(mod => (
                                                <label key={mod.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${formData.enabledModules?.includes(mod.id) ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'border-white/5 text-slate-500 hover:bg-white/5'}`}>
                                                    <input type="checkbox" checked={formData.enabledModules?.includes(mod.id)} onChange={() => {
                                                        const current = formData.enabledModules || [];
                                                        setFormData({...formData, enabledModules: current.includes(mod.id) ? current.filter(m => m !== mod.id) : [...current, mod.id]});
                                                    }} className="hidden"/>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.enabledModules?.includes(mod.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                        {formData.enabledModules?.includes(mod.id) && <CheckCircle size={10} className="text-white"/>}
                                                    </div>
                                                    <span className="text-[10px] font-bold">{mod.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white">Bekor Qilish</button>
                                        <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg">Saqlash</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
