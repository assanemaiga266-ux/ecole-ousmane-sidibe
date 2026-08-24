// Service Worker — permet à l'appli de s'ouvrir même sans connexion internet
// (les données Firebase, elles, ont besoin du réseau pour se synchroniser)

const CACHE_NAME = 'gestion-sidibe-v1';
const FICHIERS_A_METTRE_EN_CACHE = [
  '/gestion_ecole_sidibe.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation : on met en cache les fichiers de base de l'appli
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FICHIERS_A_METTRE_EN_CACHE))
  );
  self.skipWaiting();
});

// Activation : on supprime les anciennes versions du cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms.filter((nom) => nom !== CACHE_NAME).map((nom) => caches.delete(nom))
      )
    )
  );
  self.clients.claim();
});

// Récupération : on sert depuis le cache si hors-ligne, sinon on va chercher sur le réseau
self.addEventListener('fetch', (event) => {
  // On ne touche pas aux requêtes vers Firebase/Firestore, elles doivent toujours passer par le réseau
  if (event.request.url.includes('firestore') || event.request.url.includes('firebaseio') || event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        // Mise à jour du cache avec la dernière version reçue du réseau
        const copie = reponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});
