(() => {
  const IFX = self.IFX;
  const { h, views, imdb } = IFX;

  const root = h('div', { id: 'ifx-root' });
  // Attached to <html>, not <body>: the CSS hides IMDb's whole <body>, and this
  // way we can paint the moment the script runs, before the page has parsed.
  document.documentElement.append(root);

  const mount = (...nodes) => root.replaceChildren(...nodes);

  const whenParsed = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  // Once we have what we need, stop IMDb's own scripts, ads and trackers from
  // loading in the hidden page behind ours.
  const settle = (title) =>
    whenParsed(() => {
      document.title = title;
      window.stop();
    });

  const TABS = [
    { id: 'ratings', label: 'Ratings' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'parents', label: 'Parents guide' },
    { id: 'cast', label: 'Cast & crew' },
  ];

  // Tabs whose data lives on a separate IMDb page, fetched on first click.
  const REMOTE_TABS = {
    reviews: { path: 'reviews', parse: imdb.parseReviews, view: views.reviewsPanel },
    parents: { path: 'parentalguide', parse: imdb.parseParentsGuide, view: views.parentsPanel },
    cast: { path: 'fullcredits', parse: imdb.parseCredits, view: views.castPanel },
  };

  // Old-style subpages fold back into the one title view.
  const SUBPAGE_TABS = { ratings: 'ratings', reviews: 'reviews', parentalguide: 'parents', fullcredits: 'cast' };

  // Sign-in screens must stay reachable, so they are left as IMDb made them.
  const PASSTHROUGH = /^\/(registration|ap)(\/|$)/;

  const showOriginal = () => {
    document.documentElement.classList.add('ifx-pass');
    root.remove();
  };

  const showFailure = (err, options) => mount(views.shell({}, views.failure(err.message, options)));

  const showHome = () => {
    mount(views.home());
    settle('IMDb Focus');
  };

  const showBlocked = () => {
    mount(views.blocked());
    settle('Switched off · IMDb Focus');
  };

  const showSearch = (url) => {
    const query = (url.searchParams.get('q') || '').trim();
    if (!query) return showHome();
    // Titles only: the unfiltered search mixes in people, companies and keywords.
    if (url.searchParams.get('s') !== 'tt') {
      url.searchParams.set('s', 'tt');
      return location.replace(url.href);
    }
    mount(views.shell({ query }, views.loading('Searching…')));
    whenParsed(() => {
      try {
        const list = imdb.parseSearch(imdb.readPageProps(document));
        window.stop();
        mount(views.shell({ query }, views.results(query, list)));
        document.title = `${query} · IMDb Focus`;
      } catch (err) {
        showFailure(err, { original: showOriginal });
      }
    });
  };

  const showTitle = (id) => {
    mount(views.shell({}, views.loading('Loading title…')));
    whenParsed(() => {
      let title;
      try {
        title = imdb.parseTitle(imdb.readPageProps(document));
      } catch (err) {
        return showFailure(err, err.notFound ? {} : { original: showOriginal });
      }
      window.stop();

      const panel = h('section', { class: 'ifx-panel' });
      const tabs = views.tabs(
        TABS.map((t) => ({ ...t, count: t.id === 'reviews' ? title.reviewCount : null })),
        (tab) => {
          history.replaceState(null, '', `#${tab}`);
          open(tab);
        }
      );
      const cache = new Map();
      let latest = 0;

      const open = async (tab) => {
        const mine = ++latest;
        tabs.select(tab);
        if (tab === 'ratings') return panel.replaceChildren(views.ratingsPanel(title));
        const remote = REMOTE_TABS[tab];
        panel.replaceChildren(views.loading());
        try {
          if (!cache.has(tab)) cache.set(tab, imdb.fetchPageProps(`/title/${id}/${remote.path}/`).then(remote.parse));
          const data = await cache.get(tab);
          if (mine === latest) panel.replaceChildren(remote.view(data));
        } catch (err) {
          cache.delete(tab);
          if (mine === latest) panel.replaceChildren(views.failure(err.message, { retry: () => open(tab) }));
        }
      };

      const tabFromHash = () => {
        const wanted = location.hash.slice(1);
        return TABS.some((t) => t.id === wanted) ? wanted : 'ratings';
      };

      mount(views.shell({}, views.titleHero(title), tabs.el, panel));
      document.title = `${title.title}${title.years ? ` (${title.years})` : ''} · IMDb Focus`;
      open(tabFromHash());
      window.addEventListener('hashchange', () => open(tabFromHash()));
    });
  };

  const route = () => {
    const url = new URL(location.href);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (PASSTHROUGH.test(path)) return showOriginal();
    if (path === '/') return showHome();
    if (path === '/find') return showSearch(url);

    const title = path.match(/^\/title\/(tt\d+)(?:\/(.+))?$/);
    if (title) {
      const [, id, sub] = title;
      if (!sub) return showTitle(id);
      const tab = SUBPAGE_TABS[sub.split('/')[0]];
      return location.replace(`/title/${id}/${tab ? `#${tab}` : ''}`);
    }

    showBlocked();
  };

  route();
})();
