# IMDb Focus

**A Chrome extension that turns IMDb into a lookup tool instead of a rabbit hole.**

You search for a title. You see that title's rating, user reviews, parents guide and cast & crew. There are no carousels, no "more like this", no suggested titles, and no link anywhere that leads to another title or a person.

- Free and open source ([MIT](LICENSE))
- No account, no tracking, no permissions: see [PRIVACY.md](PRIVACY.md)
- Works in Chrome, Edge, Brave and other Chromium browsers
- Light and dark mode (follows your system)

## Install

The extension isn't in the Chrome Web Store, so you install it by hand. It takes about a minute.

1. **Download** the latest `imdb-focus-x.y.z.zip` from the [Releases page](https://github.com/Ariffurrhmn/Imdb-focus/releases/latest), then **unzip** it somewhere you'll keep it (for example `Documents`). Don't delete the folder afterwards, because the browser loads the extension from it.
2. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode** (toggle, top right).
4. Click **Load unpacked** and choose the unzipped folder, the one with `manifest.json` directly inside it.
5. Open [imdb.com](https://www.imdb.com). Reload any IMDb tab that was already open.

> **"Disable developer mode extensions" popup?** Chrome shows this at startup for any extension installed this way. It's expected. Dismiss it rather than clicking *Disable*.

**Updating:** unzip the new version over the old folder, then click the reload arrow on the IMDb Focus card at `chrome://extensions`.
**Removing:** click *Remove* on that same card.

### Install from source

```bash
git clone https://github.com/Ariffurrhmn/Imdb-focus.git
```

Then follow steps 2 to 4 above and pick the [`extension`](extension) folder inside the clone.

## What you get

| Page | What it shows |
| --- | --- |
| `imdb.com` | One search box. Nothing else. |
| Search | Titles only (no people, companies, keywords). Each result is a card; clicking one opens that title. |
| Title | Poster, rating, Metascore, genres, plot, director/writer/stars as plain text, awards, then four tabs: **Ratings** (vote histogram), **Reviews**, **Parents guide**, **Cast & crew** |
| Anything else (`/name/…`, `/chart/…`, `/list/…`, `/news/…`, …) | A "switched off" page with the search box |

Cast, director, producers and so on are plain text. They are not links.

Old subpage URLs (`/title/tt…/reviews`, `/parentalguide`, `/fullcredits`) fold back into the title page's tabs. Other title subpages (trivia, quotes, episodes, …) redirect to the title page. Sign-in pages (`/registration/…`) are left alone so you can still log in.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Manifest file is missing or unreadable" when loading | You picked the wrong folder level. Choose the folder that has `manifest.json` directly inside it. |
| IMDb looks normal, nothing changed | Make sure the extension is toggled on at `chrome://extensions`, then reload the IMDb tab. |
| I'm signed in and I see a "switched off" page for my watchlist, lists or account | By design. Everything except search, titles and sign-in is switched off. Turn the extension off at `chrome://extensions` when you need them. |
| An error screen with "Show the original IMDb page" | IMDb changed something or showed a verification check. Use the button, and please [open an issue](https://github.com/Ariffurrhmn/Imdb-focus/issues). |

## How it works

IMDb embeds each page's data as JSON for its own app. The extension hides IMDb's page the moment it starts loading, reads that JSON, and draws its own minimal page from it. Reviews, parents guide and cast & crew are fetched from IMDb's own pages the first time you open that tab.

The extension talks only to `www.imdb.com`. Poster images come from IMDb's own image servers, exactly as on IMDb. Nothing is sent anywhere else, and there is no analytics or backend. Details in [PRIVACY.md](PRIVACY.md).

Because the page is built from data rather than hidden piece by piece, there is nothing for a new IMDb carousel to leak through. The extension also stops IMDb's own scripts once it has the data.

## Known limits

- **Reviews:** you get what IMDb includes in the page. When signed out that is 5 reviews; the count of the rest is shown.
- **Parents guide:** the first ~10 notes per category plus the severity votes. Spoiler notes are not included.
- **If IMDb changes its data format**, the extension shows an error screen with a "Show the original IMDb page" button. That button only appears on unexpected failures, not on normal pages.
- You can still type a title URL by hand, and you can still turn the extension off. It removes the links, not your choice.
- Only `www.imdb.com` is covered, and only in the browser where you install it (no mobile Chrome).

## Development

```
extension/
  manifest.json   Manifest V3, runs only on https://www.imdb.com/*, no permissions
  focus.css       Hides IMDb's page immediately; styles the replacement (light + dark)
  src/util.js     DOM helper (text-only), formatting
  src/imdb.js     Reads IMDb's embedded JSON into plain objects
  src/views.js    Renders pages
  src/main.js     Routing and tabs
  icons/
scripts/
  package.sh      Builds dist/imdb-focus-<version>.zip
  INSTALL.txt     Install guide bundled inside the zip
.github/workflows/release.yml   Attaches the zip to a GitHub Release when you push a v* tag
```

To change what a title page shows, edit `TABS` / `REMOTE_TABS` in `src/main.js` and the matching view in `src/views.js`. After editing, click the reload arrow on the extension's card at `chrome://extensions`.

### Cutting a release

1. Bump `version` in `extension/manifest.json` (e.g. `1.0.1`) and commit.
2. Tag and push: `git tag v1.0.1 && git push origin v1.0.1`.
3. GitHub Actions builds the zip and publishes it on the [Releases page](https://github.com/Ariffurrhmn/Imdb-focus/releases). The tag must match the manifest version or the build stops.

To build the zip locally instead, run `./scripts/package.sh`.

## Disclaimer

IMDb Focus is an independent project and is not affiliated with or endorsed by IMDb. "IMDb" is a trademark of its respective owner. The extension changes only how pages look in your own browser; all data still comes from IMDb.
