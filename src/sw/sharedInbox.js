// src/sw/sharedInbox.js — receiving a client's submission straight from the phone's share sheet
// (TODO §38.22). Loaded via importScripts after cacheManifest; exposes its API on self.swSharedInbox.
//
// Single responsibility: catch the POST the operating system makes when somebody shares a file INTO
// LibrePT, put the file where the app can pick it up, and send the browser to the app. It decides
// nothing about the submission — modules/clients/signupReviewDialog.js is still the human being who
// reads it before anything enters the register (§26.5).
//
// **Why the service worker has to be involved at all.** A share target is declared in the manifest as
// a URL the OS POSTs to, and there is no server here to receive it — the whole app is a folder of
// static files on GitHub Pages. The worker is the only thing that can answer a POST, so it answers
// this one: it takes the file out of the form, keeps it, and redirects to the app with a marker in
// the address. Without that, `share_target` would send the trainer's phone at a URL that 404s.
//
// **The file is kept as TEXT in a cache entry, not as a File.** The app reads it as text anyway
// (data/signupFile.js), a Response body is the one thing both sides can hold, and the Cache API is
// already the worker's own storage — one mechanism rather than two.
//
// **It is read once and dropped.** The marker in the address survives a reload, and a submission that
// re-opened every time the trainer refreshed would be a dialog they have to dismiss over and over.
self.swSharedInbox = (() => {
  // Its own cache, so emptying the inbox cannot touch the app shell.
  const INBOX_CACHE = "librept-shared-inbox";
  // Not a real file on the site: a key inside that cache, in URL shape because that is what the Cache
  // API stores against.
  const INBOX_KEY = "shared-submission";
  // What the manifest names the file field, and the marker the app looks for on boot. Both are
  // written here and read by modules/clients/signupInbox.js; keeping them in one place is what stops
  // the manifest, the worker and the app from drifting into three spellings.
  const FILE_FIELD = "signup";
  const ARRIVED_MARK = "open=signup";

  function isShareTarget(request) {
    return request.method === "POST" && new URL(request.url).pathname.endsWith("/share-target");
  }

  /** Takes the shared file, keeps its text, and sends the browser to the app.
   *
   * 303, not 302: the request that arrives is a POST, and only "See Other" tells the browser to fetch
   * the next one as a GET. With 302 the app's own URL would be re-POSTed to and the worker would
   * answer its own redirect in a loop.
   */
  async function receive(request, scope) {
    let text = "";
    try {
      const form = await request.formData();
      const file = form.get(FILE_FIELD);
      text = typeof file === "string" ? file : await file?.text();
    } catch {
      // A share with nothing usable in it still lands the trainer in the app rather than on an error
      // page: the dialog opens empty and says it could not read the file, which is a screen they can
      // act on.
    }
    const cache = await caches.open(INBOX_CACHE);
    await cache.put(
      INBOX_KEY,
      new Response(text || "", { headers: { "content-type": "text/plain" } }),
    );
    return Response.redirect(`${scope}index.html?${ARRIVED_MARK}`, 303);
  }

  function handleFetch(event) {
    if (!isShareTarget(event.request)) return false;
    event.respondWith(receive(event.request, self.registration.scope));
    return true;
  }

  return { handleFetch, INBOX_CACHE, INBOX_KEY, FILE_FIELD, ARRIVED_MARK };
})();
