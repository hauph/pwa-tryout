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
  const url = `${baseURL()}fetchPostData`;

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
          const postData = new FormData();
          postData.append('id', dt.id);
          postData.append('title', dt.title);
          postData.append('location', dt.location);
          postData.append('rawLocationLat', dt.rawLocation.lat);
          postData.append('rawLocationLng', dt.rawLocation.lng);
          postData.append('file', dt.picture, `${dt.id}.png`);

          fetch(`${baseURL()}storePostData`, {
            method: 'POST',
            body: postData,
          })
            // eslint-disable-next-line
            .then((res) => {
              console.log('Sent data', res);
              if (res.ok) {
                res.json().then((resData) => {
                  deleteItemFromData('sync-posts', resData.id);
                  writeData('reload', {
                    id: new Date().toISOString(),
                  });
                });
              }
            })
            .catch((err) => {
              console.log('Error while sending data', err);
            });
        }
      }),
    );
  } else if (event.tag === 'deleted-posts') {
    console.log('[Service Worker] Syncing Deleted Posts');
    event.waitUntil(
      readAllData('sync-deleted-posts').then((data) => {
        // eslint-disable-next-line
        for (const dt of data) {
          fetch(`${baseURL()}deletePostData`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fbId: dt.fbId }),
          })
            // eslint-disable-next-line
            .then((res) => {
              if (res.ok) {
                res.json().then((resData) => {
                  deleteItemFromData('sync-deleted-posts', resData.id);
                  writeData('reload', {
                    id: new Date().toISOString(),
                  });
                });
              }
            })
            .catch((err) => {
              console.log('Error while deleting data', err);
            });
        }
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then((clis) => {
        // const client = clis.find((c) => {
        //   return c.visibilityState === 'visible';
        // });

        // if (client !== undefined) {
        //   client.navigate(notification.data.url);
        //   client.focus();
        // } else {
        //   clients.openWindow(notification.data.url);
        // }
        clients.openWindow(notification.data.url);
        notification.close();
      }),
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event);
});

self.addEventListener('push', (event) => {
  console.log('Push Notification received', event);

  let data = {
    title: 'New!',
    content: 'Something new happened!',
    openUrl: '/',
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/images/icons/app-icon-96x96.png',
    badge: '/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
