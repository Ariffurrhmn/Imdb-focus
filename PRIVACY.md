# Privacy

IMDb Focus does not collect, store, or send any data about you.

- **No accounts, no analytics, no tracking, no servers of our own.** The extension has no backend.
- **No permissions.** The manifest requests none. The extension only runs on `https://www.imdb.com/*`.
- **What it contacts.** It reads the page IMDb already sent your browser and, when you open the Reviews, Parents guide or Cast & crew tab, requests that page from `www.imdb.com` the same way your browser would. Posters are loaded from IMDb's own image servers (`media-amazon.com`), as they are on IMDb itself. Nothing else is contacted.
- **Nothing is saved.** The extension does not use cookies, local storage or any other storage of its own.
- **Stops IMDb's page scripts.** Once it has the data it needs, it halts loading of IMDb's own scripts, ads and trackers on that page.

The source is short (about 1,400 lines) and all in this repository. You are welcome to read it.
