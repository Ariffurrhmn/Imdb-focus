(() => {
  const IFX = (self.IFX = self.IFX || {});
  const { h, compact, number, date, imageUrl } = IFX;

  // Nothing in here ever renders a link to a person or to a title other than
  // the search results, and every piece of IMDb text goes in as a text node.

  const searchForm = ({ value = '', hero = false, focus = false } = {}) => {
    const input = h('input', {
      type: 'search',
      name: 'q',
      value,
      placeholder: 'Search a movie or show…',
      autocomplete: 'off',
      spellcheck: 'false',
      required: true,
      'aria-label': 'Search for a title',
    });
    if (focus) setTimeout(() => input.focus(), 0);
    return h(
      'form',
      { class: `ifx-search${hero ? ' ifx-search--hero' : ''}`, action: '/find/', method: 'get', role: 'search' },
      h('input', { type: 'hidden', name: 's', value: 'tt' }),
      input,
      h('button', { type: 'submit' }, 'Search')
    );
  };

  const shell = ({ query = '' } = {}, ...content) =>
    h(
      'div',
      { class: 'ifx-page' },
      h(
        'header',
        { class: 'ifx-header' },
        h('div', { class: 'ifx-wrap ifx-header-row' }, h('a', { class: 'ifx-brand', href: '/' }, 'IMDb ', h('span', null, 'Focus')), searchForm({ value: query }))
      ),
      h('main', { class: 'ifx-wrap ifx-main' }, ...content)
    );

  const home = () =>
    h(
      'div',
      { class: 'ifx-page ifx-home' },
      h('h1', { class: 'ifx-home-title' }, 'IMDb ', h('span', null, 'Focus')),
      searchForm({ hero: true, focus: true }),
      h('p', { class: 'ifx-hint' }, 'Look up a title. See its rating, reviews, parents guide and cast. Nothing else.')
    );

  const blocked = () =>
    shell(
      {},
      h(
        'div',
        { class: 'ifx-message' },
        h('h1', null, 'That page is switched off'),
        h('p', null, 'IMDb Focus only shows the title you looked up: its rating, reviews, parents guide and cast and crew.'),
        h('p', null, 'People pages, charts, lists, news and recommendations are hidden so one lookup does not turn into twenty. Search for a title above.')
      )
    );

  const loading = (text = 'Loading…') => h('p', { class: 'ifx-loading', role: 'status' }, text);

  const failure = (message, { retry, original } = {}) =>
    h(
      'div',
      { class: 'ifx-message ifx-message--error', role: 'alert' },
      h('p', null, message),
      h(
        'div',
        { class: 'ifx-actions' },
        retry && h('button', { type: 'button', class: 'ifx-button', onclick: retry }, 'Try again'),
        original && h('button', { type: 'button', class: 'ifx-link', onclick: original }, 'Show the original IMDb page')
      )
    );

  const empty = (text) => h('p', { class: 'ifx-empty' }, text);

  const dotted = (parts) => parts.filter(Boolean).join(' · ');

  const scoreBlock = (t) => {
    if (t.rating == null) return null;
    const meta = t.metascore;
    const metaTone = meta >= 61 ? 'good' : meta >= 40 ? 'mixed' : 'bad';
    return h(
      'p',
      { class: 'ifx-score' },
      h('span', { class: 'ifx-star', 'aria-hidden': 'true' }, '★'),
      h('span', { class: 'ifx-score-num' }, t.rating.toFixed(1)),
      h('span', { class: 'ifx-muted' }, '/10'),
      t.votes ? h('span', { class: 'ifx-muted ifx-votes' }, `${compact(t.votes)} votes`) : null,
      meta != null ? h('span', { class: `ifx-metascore ifx-metascore--${metaTone}`, title: 'Metascore' }, meta) : null
    );
  };

  const titleHero = (t) =>
    h(
      'section',
      { class: 'ifx-hero' },
      t.poster
        ? h('img', { class: 'ifx-poster', src: imageUrl(t.poster, 360), alt: `Poster for ${t.title}`, width: 180, height: 267 })
        : h('div', { class: 'ifx-poster ifx-poster--empty', 'aria-hidden': 'true' }),
      h(
        'div',
        { class: 'ifx-hero-body' },
        h('h1', { class: 'ifx-title' }, t.title),
        t.originalTitle ? h('p', { class: 'ifx-muted' }, `Original title: ${t.originalTitle}`) : null,
        h('p', { class: 'ifx-meta' }, dotted([t.type, t.years, t.runtime, t.certificate])),
        t.genres.length ? h('ul', { class: 'ifx-chips' }, t.genres.map((g) => h('li', null, g))) : null,
        scoreBlock(t),
        t.plot ? h('p', { class: 'ifx-plot' }, t.plot) : null,
        t.credits.length
          ? h('dl', { class: 'ifx-credits' }, t.credits.map((c) => [h('dt', null, c.label), h('dd', null, c.names.join(' · '))]))
          : null,
        t.awards.highlight || t.awards.totals ? h('p', { class: 'ifx-awards ifx-muted' }, dotted([t.awards.highlight, t.awards.totals && `${t.awards.totals} total`])) : null
      )
    );

  const tabs = (items, onSelect) => {
    const buttons = new Map(
      items.map((t) => [
        t.id,
        h('button', { type: 'button', onclick: () => onSelect(t.id) }, t.label, t.count != null ? h('span', { class: 'ifx-count' }, number(t.count)) : null),
      ])
    );
    return {
      el: h('nav', { class: 'ifx-tabs', 'aria-label': 'Sections' }, [...buttons.values()]),
      select: (id) => buttons.forEach((button, key) => (key === id ? button.setAttribute('aria-current', 'true') : button.removeAttribute('aria-current'))),
    };
  };

  const ratingsPanel = (t) => {
    if (t.rating == null) return empty('No ratings yet.');
    const rows = [...t.histogram].sort((a, b) => b.rating - a.rating);
    const max = Math.max(1, ...rows.map((r) => r.votes));
    return h(
      'div',
      { class: 'ifx-ratings' },
      h('p', { class: 'ifx-muted' }, `${t.rating.toFixed(1)} average from ${number(t.votes)} votes`),
      rows.length
        ? h(
            'ul',
            { class: 'ifx-histogram' },
            rows.map((r) =>
              h(
                'li',
                null,
                h('span', { class: 'ifx-hist-label' }, r.rating),
                h('span', { class: 'ifx-hist-track' }, h('span', { class: 'ifx-hist-fill', style: `width:${(r.votes / max) * 100}%` })),
                h('span', { class: 'ifx-hist-count ifx-muted' }, compact(r.votes))
              )
            )
          )
        : null
    );
  };

  const reviewCard = (r) => {
    const text = h('p', { class: 'ifx-review-text ifx-clamp' }, r.text);
    const more =
      r.text.length > 520
        ? h(
            'button',
            {
              type: 'button',
              class: 'ifx-link',
              onclick: (e) => {
                const clamped = text.classList.toggle('ifx-clamp');
                e.currentTarget.textContent = clamped ? 'Read more' : 'Show less';
              },
            },
            'Read more'
          )
        : null;
    const body = h('div', null, text, more);
    let reveal = null;
    if (r.spoiler) {
      body.hidden = true;
      reveal = h(
        'button',
        {
          type: 'button',
          class: 'ifx-spoiler',
          onclick: () => {
            body.hidden = false;
            reveal.remove();
          },
        },
        'Contains spoilers · show review'
      );
    }
    return h(
      'article',
      { class: 'ifx-review' },
      h(
        'div',
        { class: 'ifx-review-head' },
        r.rating != null ? h('span', { class: 'ifx-review-rating' }, h('span', { class: 'ifx-star', 'aria-hidden': 'true' }, '★'), `${r.rating}/10`) : null,
        r.title ? h('h3', { class: 'ifx-review-title' }, r.title) : null
      ),
      h('p', { class: 'ifx-review-by ifx-muted' }, [r.author, date(r.date), r.helpful ? `${number(r.helpful)} found this helpful` : ''].filter(Boolean).join(' · ')),
      reveal,
      body
    );
  };

  const reviewsPanel = ({ reviews, total }) => {
    if (!reviews.length) return empty('No user reviews yet.');
    return h('div', { class: 'ifx-reviews' }, reviews.map(reviewCard), h('p', { class: 'ifx-note ifx-muted' }, `Showing ${reviews.length} of ${number(total)} reviews.`));
  };

  const severityChip = (cat) =>
    cat.severity
      ? h('span', { class: `ifx-chip ifx-sev ifx-sev--${cat.severity.id}` }, cat.severity.label)
      : h('span', { class: 'ifx-chip ifx-muted' }, 'No votes yet');

  const severityBar = (cat) => {
    const total = cat.breakdown.reduce((sum, b) => sum + b.votes, 0);
    if (!total) return null;
    return h(
      'div',
      { class: 'ifx-sev-bar', role: 'img', 'aria-label': cat.breakdown.map((b) => `${b.label}: ${number(b.votes)}`).join(', ') },
      cat.breakdown.map((b) => h('span', { class: `ifx-sev-seg ifx-sev--${b.id}`, style: `flex:${b.votes}`, title: `${b.label}: ${number(b.votes)}` }))
    );
  };

  const parentsCategory = (cat) => {
    const plain = cat.items.filter((i) => !i.spoiler);
    const spoilers = cat.items.filter((i) => i.spoiler);
    return h(
      'section',
      { class: 'ifx-pg' },
      h('div', { class: 'ifx-pg-head' }, h('h3', null, cat.title), severityChip(cat)),
      severityBar(cat),
      cat.severity && cat.totalVotes ? h('p', { class: 'ifx-muted ifx-pg-votes' }, `${number(cat.severity.votes)} of ${number(cat.totalVotes)} voters chose “${cat.severity.label}”`) : null,
      plain.length ? h('ul', { class: 'ifx-pg-items' }, plain.map((i) => h('li', null, i.text))) : null,
      spoilers.length
        ? h('details', { class: 'ifx-spoilers' }, h('summary', null, `Spoilers (${spoilers.length})`), h('ul', { class: 'ifx-pg-items' }, spoilers.map((i) => h('li', null, i.text))))
        : null,
      cat.totalItems > cat.items.length ? h('p', { class: 'ifx-note ifx-muted' }, `Showing ${cat.items.length} of ${cat.totalItems} notes.`) : null
    );
  };

  const parentsPanel = ({ reason, categories }) => {
    if (!categories.length && !reason) return empty('No parents guide yet.');
    return h('div', { class: 'ifx-parents' }, reason ? h('p', { class: 'ifx-reason' }, reason) : null, categories.map(parentsCategory));
  };

  const CORE_GROUPS = /^(directors?|writers?|cast|producers?|composers?|cinematographers?|editors?|casting directors?|production designers?|art directors?|set decorators?|costume designers?)$/i;
  const CAST_PREVIEW = 30;

  // IMDb notes arrive both bare ("written by") and already bracketed ("(as Ellen Page)").
  const bracketed = (note) => (note.startsWith('(') ? note : `(${note})`);

  const creditRow = (item, hidden) =>
    h(
      'li',
      { hidden },
      h('span', { class: 'ifx-name' }, item.name),
      item.characters ? h('span', { class: 'ifx-muted' }, ` as ${item.characters}`) : null,
      item.note ? h('span', { class: 'ifx-muted' }, ` ${bracketed(item.note)}`) : null
    );

  const creditGroup = (group) => {
    const preview = /^cast$/i.test(group.name) ? CAST_PREVIEW : Infinity;
    const rows = group.items.map((item, idx) => creditRow(item, idx >= preview));
    const showAll =
      rows.length > preview
        ? h(
            'button',
            {
              type: 'button',
              class: 'ifx-link',
              onclick: (e) => {
                rows.forEach((row) => (row.hidden = false));
                e.currentTarget.remove();
              },
            },
            `Show all ${number(rows.length)}`
          )
        : null;
    const count = group.total > group.items.length ? ` (${group.items.length} of ${number(group.total)})` : '';
    return h('section', { class: 'ifx-credit-group' }, h('h3', null, group.name, h('span', { class: 'ifx-muted' }, count)), h('ul', { class: 'ifx-credit-list' }, rows), showAll);
  };

  const castPanel = (groups) => {
    const core = groups.filter((g) => CORE_GROUPS.test(g.name));
    const other = groups.filter((g) => !CORE_GROUPS.test(g.name));
    return h(
      'div',
      { class: 'ifx-cast' },
      core.map(creditGroup),
      other.length ? h('details', { class: 'ifx-other-crew' }, h('summary', null, `Other departments (${other.length})`), other.map(creditGroup)) : null
    );
  };

  const resultRow = (t) =>
    h(
      'a',
      { class: 'ifx-result', href: `/title/${t.id}/` },
      t.poster ? h('img', { src: imageUrl(t.poster, 160), alt: '', width: 64, height: 95, loading: 'lazy' }) : h('div', { class: 'ifx-result-noimg', 'aria-hidden': 'true' }),
      h(
        'div',
        { class: 'ifx-result-body' },
        h('h2', null, t.title),
        h('p', { class: 'ifx-meta' }, dotted([t.type, t.years, t.runtime, t.certificate])),
        t.rating != null ? h('p', { class: 'ifx-result-score' }, h('span', { class: 'ifx-star', 'aria-hidden': 'true' }, '★'), t.rating.toFixed(1), t.votes ? h('span', { class: 'ifx-muted' }, ` · ${compact(t.votes)} votes`) : null) : null,
        t.genres.length ? h('p', { class: 'ifx-muted' }, t.genres.join(', ')) : null,
        t.plot ? h('p', { class: 'ifx-result-plot' }, t.plot) : null
      )
    );

  const results = (query, list) =>
    list.length
      ? h('div', { class: 'ifx-results' }, h('p', { class: 'ifx-muted ifx-results-head' }, `Titles matching “${query}”`), list.map(resultRow))
      : h('div', { class: 'ifx-message' }, h('p', null, `No titles found for “${query}”.`));

  IFX.views = { shell, home, blocked, loading, failure, titleHero, tabs, ratingsPanel, reviewsPanel, parentsPanel, castPanel, results };
})();
