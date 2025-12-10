
// Gestion du Service Worker et de l'installation PWA

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered with scope:', registration.scope);
        },
        (err) => {
          console.log('SW registration failed:', err);
        }
      );
    });
  }
};

// Gestion des Notifications Locales
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendLocalNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
        // Option 1: Via Service Worker (Meilleur pour mobile)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body,
                    icon: 'https://api.dicebear.com/9.x/shapes/svg?seed=PronosIA&backgroundColor=0f172a&shape1Color=6366f1',
                    vibrate: [200, 100, 200],
                    tag: 'pronosia-alert'
                } as any);
            });
        } else {
            // Option 2: Fallback API Standard
            new Notification(title, {
                body,
                icon: 'https://api.dicebear.com/9.x/shapes/svg?seed=PronosIA&backgroundColor=0f172a&shape1Color=6366f1'
            });
        }
    }
};
