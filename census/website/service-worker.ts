const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('activate', event => {
  console.log('activate', event);
});

sw.addEventListener('install', event => {
  console.log('install', event);
});

sw.addEventListener('sync', event => {
  console.log('sync', event);
});

sw.addEventListener('message', event => {
  console.log('message', event);
});

sw.addEventListener('error', event => {
  console.log('error', event);
});

sw.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const path = url.pathname;
  if (!path.endsWith('.encrypted.png')) {
    return;
  }

  const rawKey = url.searchParams.get('key');
  const rawIv = url.searchParams.get('iv');

  if (!rawKey || !rawIv) {
    event.respondWith(
      new Response(JSON.stringify({ error: 'Bad Request: this image needs to be decrypted' }), { status: 400 })
    );
    return;
  }

  if (rawKey && rawIv) {
    event.respondWith(
      (async () => {
        const cache = await caches.open('images');
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const res = await fetch(event.request);
        if (!res.ok) return res;
        if (res.headers.get('Content-Type') !== 'image/png') {
          return new Response(JSON.stringify({ error: 'Bad Request: this image is not a valid PNG' }), { status: 404 });
        }

        const data = await res.arrayBuffer();

        const keyBytes = hexToUint8Array(rawKey);
        const ivBytes = hexToUint8Array(rawIv);

        const algo = { name: 'AES-CTR', counter: ivBytes, length: 64 };
        const key = await crypto.subtle.importKey('raw', keyBytes, algo, false, ['decrypt']);
        const decrypted = await crypto.subtle.decrypt(algo, key, data);

        if (!isValidPng(decrypted)) {
          return new Response(
            JSON.stringify({ error: 'Bad Request: this image is not a valid PNG or was decrypted incorrectly' }),
            { status: 400 }
          );
        }

        // Cache for 7 days
        const response = new Response(decrypted, {
          headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=604800' }
        });

        await cache.put(event.request, response);
        return response;
      })()
    );
  }
});

const hexToUint8Array = (hex: string) => {
  const length = hex.length / 2;
  const view = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    view[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return view;
};

const isValidPng = (data: ArrayBuffer): boolean => {
  const header = new Uint8Array(data.slice(0, 8));
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return pngSignature.every((byte, i) => byte === header[i]);
};
