import React, { useState, useEffect } from 'react';
import { Download, Bell, X } from 'lucide-react';
import { requestNotificationPermission, sendLocalNotification } from '../services/pwaService';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstall, setShowInstall] = useState(false);
    const [showNotif, setShowNotif] = useState(false);

    useEffect(() => {
        // Vérifier si l'app est déjà en mode Standalone (PWA installée)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        
        if (isStandalone) {
            console.log("App is running in standalone mode");
            return; 
        }

        // Capture l'événement d'installation pour Chrome/Android
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        });

        // Vérifie si les notifs sont activées mais non demandées
        if ('Notification' in window && Notification.permission === 'default') {
            // Petit délai pour ne pas agresser l'utilisateur au chargement
            setTimeout(() => setShowNotif(true), 5000);
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstall(false);
        }
        setDeferredPrompt(null);
    };

    const handleNotifClick = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            sendLocalNotification("Notifications activées", "Vous recevrez des alertes pour les matchs importants !");
            setShowNotif(false);
        }
    };

    if (!showInstall && !showNotif) return null;

    return (
        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {showInstall && (
                <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto animate-slide-up border border-indigo-500 ring-2 ring-indigo-500/30">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Download size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Installer l'Application</p>
                            <p className="text-xs text-indigo-100">Accès rapide, Plein écran & Hors-ligne</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setShowInstall(false)} className="p-2 hover:bg-white/10 rounded-full">
                            <X size={16} />
                        </button>
                        <button 
                            onClick={handleInstallClick} 
                            className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
                        >
                            Installer
                        </button>
                    </div>
                </div>
            )}

            {showNotif && (
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto animate-slide-up border border-slate-700">
                    <div className="flex items-center gap-3">
                         <div className="bg-yellow-500/20 text-yellow-500 p-2 rounded-lg">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Activer les alertes</p>
                            <p className="text-xs text-slate-400">Ne ratez pas le début des matchs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowNotif(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                            <X size={16} />
                        </button>
                        <button 
                            onClick={handleNotifClick} 
                            className="bg-yellow-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                        >
                            Activer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PWAInstallPrompt;