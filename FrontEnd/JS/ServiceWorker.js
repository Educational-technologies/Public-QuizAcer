self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('quizacer-cache').then(cache => {
        return cache.addAll([
          '/api/images/registration',
          '/api/images/favicon',
          '/api/images/512x512.png',
          '/api/images/192x192.png',
          '/flashcard',
          '/[Cc]ard[Nn]ot[Ff]ound',
          '/navbar',
          '/[Ff]inal[Gg]rade[Cc]alc',
          "/api/CSS/[Aa]nimations",
          "/api/sound/[Bb]utton[Hh]over",
          "/[Mm]anifest.json",
          "/SiteMap"
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open('your-cache-name').then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  });
  