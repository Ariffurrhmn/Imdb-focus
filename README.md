# IMDb Focus

A Chrome extension that turns IMDb into a lookup tool instead of a rabbit hole.

You search for a title. You see that title's rating, user reviews, parents guide and cast & crew. There are no carousels, no "more like this", no suggested titles, and no link anywhere that leads to another title or a person.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and choose the [`extension`](extension) folder
4. Reload any open IMDb tabs

## What you get

| Page | What it shows |
| --- | --- |
| `imdb.com` | One search box. Nothing else. |
| Search | Titles only (no people, companies, keywords). Each result is a card; clicking one opens that title. |
| Title | Poster, rating, Metascore, genres, plot, director/writer/stars as plain text, awards, then four tabs: **Ratings** (vote histogram), **Reviews**, **Parents guide**, **Cast & crew** |
| Anything else (`/name/…`, `/chart/…`, `/list/…`, `/news/…`, …) | A "switched off" page with the search box |

Cast, director, producers and so on are plain text. They are not links.

Old subpage URLs (`/title/tt…/reviews`, `/parentalguide`, `/fullcredits`) fold back into the title page's tabs. Other title subpages (trivia, quotes, episodes, …) redirect to the title page. Sign-in pages (`/registration/…`) are left alone so you can still log in.

## How it works

IMDb embeds each page's data as JSON for its own app. The extension hides IMDb's page the moment it starts loading, reads that JSON, and draws its own minimal page from it. Reviews, parents guide and cast & crew are fetched from IMDb's own pages the first time you open that tab. Nothing leaves your browser and no other site is contacted.

Because the page is built from data rather than hidden piece by piece, there is nothing for a new IMDb carousel to leak through. The extension also stops IMDb's own scripts once it has the data.

## Known limits

- **Reviews:** you get what IMDb includes in the page. When signed out that is 5 reviews; the count of the rest is shown.
- **Parents guide:** the first ~10 notes per category plus the severity votes. Spoiler notes are not included.
- **If IMDb changes its data format**, the extension shows an error screen with a "Show the original IMDb page" button. That button only appears on unexpected failures, not on normal pages.
- You can still type a title URL by hand, and you can still turn the extension off. It removes the links, not your choice.

## Files

```
extension/
  manifest.json   Manifest V3, runs only on https://www.imdb.com/*, no permissions
  focus.css       Hides IMDb's page immediately; styles the replacement (light + dark)
  src/util.js     DOM helper (text-only), formatting
  src/imdb.js     Reads IMDb's embedded JSON into plain objects
  src/views.js    Renders pages
  src/main.js     Routing and tabs
  icons/
```

To change what a title page shows, edit `TABS` / `REMOTE_TABS` in `src/main.js` and the matching view in `src/views.js`.
