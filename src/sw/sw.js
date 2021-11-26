/* eslint-disable no-undef */
importScripts('/plugins/idb.js');
importScripts('/plugins/utility.js');

// eslint-disable-next-line
self.__WB_MANIFEST;

const DYNAMIC_CACHE = 'dynamic_cache';
const STATIC_CACHE = 'static_cache';

self.addEventListener('install', (e) => {
  console.log('[ServiceWorker] Installing ...', e);
  e.waitUntil(
    // Precaching static files
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Precaching App Shell');
      cache.addAll([
        '/',
        '/index.html',
        '/pages/offline.html',
        '/images/main-image.jpg',
        '/images/main-image-lg.jpg',
        '/images/main-image-sm.jpg',
        '/plugins/idb.js',
        '/plugins/utility.js',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
        'https://code.getmdl.io/1.3.0/material.min.js',
      ]);
    }),
  );
  return self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activating ...', e);
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url =
    'https://learn-pwa-dc1c0-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      /// / Get data and save to indexedDB
      fetch(event.request).then((res) => {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then((data) => {
            // eslint-disable-next-line
            for (const key in data) {
              writeData('posts', data[key]);
            }
          });
        return res;
      }),

      /// / Get data and save to cache
      // caches.open(DYNAMIC_CACHE).then((cache) => {
      //   return fetch(event.request).then((res) => {
      //     cache.put(event.request, res.clone());
      //     return res;
      //   });
      // }),
    );
  } else {
    event.respondWith(
      // Network falling back to the cache
      fetch(event.request)
        .then((res) => {
          // Dynamic caching
          return caches
            .open(DYNAMIC_CACHE)
            .then((cache) => {
              // if (
              //   event.request.url !== '/images/sf-boat.jpg' &&
              //   event.request.url !== 'https://httpbin.org/get'
              // ) {
              //   cache.put(event.request.url, res.clone());
              // }
              cache.put(event.request.url, res.clone());
              return res;
            })
            .catch((err) => {
              console.error('dynamic_cache caching', err);
            });
        })
        .catch(() => {
          if (event.request.url.includes('pages')) {
            return caches.open(STATIC_CACHE).then((cache) => {
              return cache.match('/pages/offline.html');
            });
          }
          return caches.match(event.request);
        }),
    );
  }
});

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts').then((data) => {
        // eslint-disable-next-line
        for (const dt of data) {
          fetch(
            'https://us-central1-learn-pwa-dc1c0.cloudfunctions.net/storePostData',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image:
                  'https://firebasestorage.googleapis.com/v0/b/learn-pwa-dc1c0.appspot.com/o/IMG_2538.JPG?alt=media&token=6814fc09-5cf9-4f83-9a89-1736d463e191',
              }),
            },
          )
            // eslint-disable-next-line
            .then((res) => {
              console.log('Sent data', res);
              if (res.ok) {
                res.json().then((resData) => {
                  deleteItemFromData('sync-posts', resData.id);
                });
              }
            })
            .catch((err) => {
              console.log('Error while sending data', err);
            });
        }
      }),
    );
  }
});
