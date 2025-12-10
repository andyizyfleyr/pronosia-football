const CACHE_NAME = 'pronosia-v2';
const DYNAMIC_CACHE = 'pronosia-dynamic-v2';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Installation : Mise en cache du "Shell" de l'application
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching App Shell');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Activation : Nettoyage des vieux caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception réseau
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorer les requêtes API (Toujours Network Only pour avoir les données fraîches)
  if (url.href.includes('google') || url.href.includes('api-sports')) {
    return;
  }

  // 2. Navigation HTML (Mode SPA) : Network First, puis Cache (index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Assets statiques (JS, CSS, Images, Fonts) : Stale-While-Revalidate
  // On sert le cache tout de suite, et on met à jour en arrière-plan
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Mise en cache dynamique des nouveaux assets
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// Gestion des Notifications Push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'PronosIA', body: 'Nouvelle alerte match !' };
  
  const options = {
    body: data.body,
    icon: 'https://api.dicebear.com/9.x/shapes/svg?seed=PronosIA&backgroundColor=0f172a&shape1Color=6366f1',
    badge: 'https://api.dicebear.com/9.x/shapes/svg?seed=PronosIA&backgroundColor=0f172a&shape1Color=6366f1',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    },
    actions: [
      { action: 'open', title: 'Voir le match' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur notification : Focus sur l'app existante ou ouverture
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, on la focus
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon on ouvre
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});