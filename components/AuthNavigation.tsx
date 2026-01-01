import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Globe, ShieldCheck, AlertTriangle, Building2, KeyRound, ChevronRight, Fingerprint, Truck } from 'lucide-react';
import { UZB_REGIONS, MAP_CENTER } from '../constants';
import { authService } from '../services/auth';
import { UserSession, Organization, UserRole } from '../types';

interface AuthNavigationProps {
    onLogin: (session: UserSession) => void;
}

// Static Footer
const FooterInfo = () => (
    <div className="w-full h-8 flex items-center justify-center z-[100] shrink-0 text-slate-400 relative select-none bg-transparent pointer-events-none pb-2">
        <div className="flex items-center gap-4 text-[10px] font-bold pointer-events-auto opacity-60">
            <span>© 2025 Smart City Platform</span>
            <span className="w-px h-2 bg-slate-300"></span>
            <span className="uppercase tracking-wider">Tizim v4.2</span>
        </div>
    </div>
);

const AuthNavigation: React.FC<AuthNavigationProps> = ({ onLogin }) => {
    // Login Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Basic validation
        if (!username.trim() || !password) {
            setError('Iltimos, login va parolni kiriting');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log(' Attempting login with username:', username);
            const result = await authService.login({ username, password });

            if (result.success && result.user) {
                console.log(' Login successful, user:', result.user);

                if (result.token) {
                    authService.setToken(result.token);
                    console.log(' Token stored in localStorage');
                }

                // Map backend role to frontend UserRole enum
                const mappedRole: UserRole = result.user.role === 'SUPERADMIN' ? 'SUPERADMIN' :
                    result.user.role === 'DRIVER' ? 'DRIVER' :
                        result.user.role === 'ADMIN' ? 'ADMIN' :
                            result.user.role === 'ORGANIZATION' ? 'ORGANIZATION' : 'ADMIN';

                // Default to Farg'ona region if not specified
                let userRegion = UZB_REGIONS.find(r => r.name.includes("Farg'ona")) || UZB_REGIONS[2];
                let userDistrict = userRegion.districts.find(d => d.name.includes("Farg'ona")) || userRegion.districts[0];

                // Update with backend data if available
                if (result.district) {
                    userDistrict = {
                        id: result.district.id,
                        name: result.district.name,
                        center: result.district.center
                    };
                }

                if (result.region) {
                    userRegion = {
                        id: result.region.id,
                        name: result.region.name,
                        districts: [userDistrict]
                    };
                } else {
                    userRegion = {
                        ...userRegion,
                        districts: [userDistrict]
                    };
                }

                // Set default modules if none provided
                const enabledMods = result.user.enabled_modules?.length > 0
                    ? result.user.enabled_modules
                    : ['DASHBOARD', 'WASTE', 'CLIMATE'];

                const session: UserSession = {
                    user: {
                        name: result.user.name || username,
                        role: mappedRole,
                        organizationId: result.organization?.id || result.user.id,
                    },
                    region: userRegion,
                    district: userDistrict,
                    enabledModules: enabledMods,
                };

                console.log(' Session created:', session);
                onLogin(session);
            } else {
                const errorMessage = result?.error || 'Login yoki parol xato. Iltimos, qaytadan urinib ko\'ring.';
                console.error(' Login failed:', errorMessage);
                setError(errorMessage);
                setIsLoading(false);
            }
        } catch (error) {
            console.error(' Login error:', error);
            setError('Serverga ulanishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-100 font-sans">
            <div
                className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            >
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-md p-6 flex flex-col items-center"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white transform rotate-3">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Smart City</h1>
                    <p className="text-slate-500 text-sm font-medium">Yagona Identifikatsiya Tizimi</p>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-200 w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

                    <form onSubmit={handleLogin} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-wider">Login / ID</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="Enter your login"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-wider">Maxfiy Parol</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Tizimga Kirish"}
                        </button>
                    </form>
                </div>

                <div className="w-full mt-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-slate-300 flex-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tizim Huquqlari</span>
                        <div className="h-px bg-slate-300 flex-1"></div>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400">Tizimga kirish uchun login va parol kiriting</p>
                    </div>
                </div>

            </motion.div>

            <div className="absolute bottom-0 left-0 w-full z-50">
                <FooterInfo />
            </div>
        </div>
    );
};

export default AuthNavigation;