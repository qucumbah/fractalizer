const FILES = [
  '/',
  '/img/logo192.png',
  '/img/logo512.png',
  '/img/icons/close.svg',
  '/img/messageIcons/error.png',
  '/img/messageIcons/info.png',
  '/img/messageIcons/warning.png',
  '/index.html',
  '/js/auxOptions.js',
  '/js/EventEmitter.js',
  '/js/expressionParser.js',
  '/js/FractalRenderer.js',
  '/js/glsl/fragmentShaderSource.js',
  '/js/glsl/vertexShaderSource.js',
  '/js/jquery-3.4.1.min.js',
  '/js/main.js',
  '/js/messageSystem.js',
  '/js/modal.js',
  '/js/ScaleSlider.js',
  '/js/Slider.js',
  '/js/userFunction.js',
  '/js/util.js',
  '/manifest.json',
  '/registerServiceWorker.js',
  '/style.css'
];
const CACHE_NAME = 'fractalizer-cache-v1';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name.startsWith('fractalizer-cache') && name!==CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      // Could implement some more agressive caching strategy later
      // .then(cacheResponse => {
      //   console.log(cacheResponse.headers.get('Last-Modified'));
      //   let result;
      //
      //   if (cacheResponse) {
      //     result = cacheResponse;
      //
      //     //Update file in cache, so that the next time user updates the page
      //     //he gets the newest version
      //     fetch(event.request).then(serverResponse => {
      //       if (!response || response.status!==200 || response.type!=='basic') {
      //         return;
      //       }
      //       const serverLastModified = new Date(
      //         serverResponse.headers.get('Last-Modified');
      //       );
      //       const cacheLastModified = new Date(
      //         cacheResponse.headers.get('Last-Modified');
      //       );
      //
      //       //If server version was modified after cached version, we put the
      //       //newer file to cache
      //       if (serverLastModified > cacheLastModified) {
      //         caches.open(CACHE_NAME)
      //           .then(cache => cache.put(event.request, response));
      //       }
      //
      //        caches.open(CACHE_NAME)
      //          .then(cache => cache.put(event.request, response));
      //      });
      //   } else {
      //     result = fetch(event.request).then(response => {
      //       if (!response || response.status!==200 || response.type!=='basic') {
      //         return response;
      //       }
      //
      //       const responseClone = response.clone();
      //
      //       caches.open(CACHE_NAME)
      //         .then(cache => cache.put(event.request, responseClone));
      //     });
      //   }
      //
      //   return result;
      // })
      
      .then(response => {
        //Found file in cache
        if (response) {
          return response;
        }

        //File not in cache, fetch it and clone it to cache
        return fetch(event.request).then(response => {
          if (!response || response.status!==200 || response.type!=='basic') {
            return response;
          }

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));

          return response;
        });
      })
  );
});
