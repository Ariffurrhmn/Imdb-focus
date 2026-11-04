(() => {
  const IFX = (self.IFX = self.IFX || {});
  const { htmlToText, runtime, years } = IFX;

  // Every IMDb page embeds its data as JSON for its own React app. We read that
  // instead of scraping the rendered DOM, which uses generated class names.

  const TYPE_LABELS = {
    movie: 'Movie',
    tvSeries: 'TV Series',
    tvMiniSeries: 'TV Mini Series',
    tvMovie: 'TV Movie',
    tvEpisode: 'TV Episode',
    tvSpecial: 'TV Special',
    tvShort: 'TV Short',
    short: 'Short',
    video: 'Video',
    videoGame: 'Video Game',
    musicVideo: 'Music Video',
    podcastSeries: 'Podcast',
    podcastEpisode: 'Podcast Episode',
  };
  const typeLabel = (t) => t?.text || TYPE_LABELS[t?.id] || '';

  // Unrated titles come through as 0.0 with no votes; treat that as "no rating".
  const ratingIfVoted = (summary) => (summary?.voteCount ? summary.aggregateRating ?? null : null);

  const readPageProps = (doc) => {
    const el = doc.getElementById('__NEXT_DATA__');
    if (!el) throw new Error('IMDb did not send its page data. It may be showing a verification check.');
    let pageProps;
    try {
      pageProps = JSON.parse(el.textContent).props.pageProps;
    } catch {
      throw new Error('Could not read the data on this IMDb page.');
    }
    if (!pageProps) throw new Error('Could not read the data on this IMDb page.');
    return pageProps;
  };

  const fetchPageProps = async (path) => {
    const res = await fetch(path, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`IMDb answered with an error (${res.status}).`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    return readPageProps(doc);
  };

  const parseTitle = (pp) => {
    const a = pp.aboveTheFoldData;
    const m = pp.mainColumnData || {};
    if (!a?.id) throw Object.assign(new Error("That title wasn't found. Try searching for it above."), { notFound: true });

    const prestige = m.prestigiousAwardSummary;
    let prestigeLine = '';
    if (prestige?.award?.text) {
      const n = prestige.wins > 0 ? prestige.wins : prestige.nominations;
      const verb = prestige.wins > 0 ? 'Won' : 'Nominated for';
      prestigeLine = `${verb} ${n} ${prestige.award.text}${n > 1 ? 's' : ''}`;
    }
    const wins = m.wins?.total || 0;
    const noms = m.nominationsExcludeWins?.total || 0;
    const totals = [wins && `${wins} win${wins > 1 ? 's' : ''}`, noms && `${noms} nomination${noms > 1 ? 's' : ''}`].filter(Boolean).join(' & ');

    const type = typeLabel(a.titleType);

    return {
      id: a.id,
      title: a.titleText?.text || '',
      originalTitle: a.originalTitleText?.text && a.originalTitleText.text !== a.titleText?.text ? a.originalTitleText.text : '',
      type,
      years: years(a.releaseYear?.year, a.releaseYear?.endYear ?? null, type),
      runtime: a.runtime?.displayableProperty?.value?.plainText || runtime(a.runtime?.seconds),
      certificate: a.certificate?.rating || '',
      genres: (a.genres?.genres || []).map((g) => g.text),
      plot: a.plot?.plotText?.plainText || '',
      poster: a.primaryImage?.url || '',
      rating: ratingIfVoted(a.ratingsSummary),
      votes: a.ratingsSummary?.voteCount ?? 0,
      metascore: a.metacritic?.metascore?.score ?? null,
      histogram: (m.aggregateRatingsBreakdown?.histogram?.histogramValues || []).map((v) => ({ rating: v.rating, votes: v.voteCount })),
      reviewCount: m.reviews?.total ?? a.reviews?.total ?? null,
      credits: (a.principalCreditsV2 || [])
        .map((g) => ({
          label: g.grouping?.text,
          names: (g.credits || []).map((c) => c.name?.nameText?.text).filter(Boolean),
        }))
        .filter((g) => g.label && g.names.length),
      awards: { highlight: prestigeLine, totals },
    };
  };

  const parseSearch = (pp) => {
    const list = pp.titleResults?.results;
    if (!list) throw new Error('No title results found on the search page.');
    return list
      .map((r) => r.listItem)
      .filter((t) => t && /^tt\d+$/.test(t.titleId || ''))
      .map((t) => ({
        id: t.titleId,
        title: t.titleText || '',
        type: typeLabel(t.titleType),
        years: years(t.releaseYear, t.endYear ?? null, typeLabel(t.titleType)),
        runtime: runtime(t.runtime),
        certificate: t.certificate || '',
        genres: t.genres || [],
        plot: t.plot || '',
        poster: t.primaryImage?.url || '',
        rating: ratingIfVoted(t.ratingSummary),
        votes: t.ratingSummary?.voteCount ?? 0,
      }));
  };

  const parseReviews = (pp) => {
    const rv = pp.contentData?.data?.title?.reviews;
    if (!rv) throw new Error('No reviews found on the page.');
    return {
      total: rv.total ?? 0,
      reviews: (rv.edges || [])
        .map((e) => e.node)
        .filter(Boolean)
        .map((n) => ({
          id: n.id,
          author: n.author?.username?.text || 'Anonymous',
          title: n.summary?.originalText || '',
          text: htmlToText(n.text?.originalText?.plaidHtml ?? n.text?.originalText?.plainText),
          rating: n.authorRating ?? null,
          date: n.submissionDate || '',
          helpful: n.helpfulness?.upVotes ?? 0,
          spoiler: !!n.spoiler,
        })),
    };
  };

  const severityId = (id) => String(id || '').replace(/Votes$/, '');

  const parseParentsGuide = (pp) => {
    const c = pp.contentData;
    if (!c?.categories) throw new Error('No parents guide found on the page.');
    const reason = c.data?.title?.ratingReason?.edges?.[0]?.node?.ratingReason ?? c.contentRatingData?.ratingReason;
    return {
      reason: htmlToText(reason),
      categories: c.categories.map((cat) => ({
        id: cat.id,
        title: cat.title,
        severity: cat.severitySummary ? { id: severityId(cat.severitySummary.id), label: cat.severitySummary.text, votes: cat.severitySummary.votes } : null,
        totalVotes: cat.totalSeverityVotes || 0,
        breakdown: (cat.severityBreakdown || []).map((b) => ({ id: severityId(b.id), label: b.text, votes: b.votes })),
        items: (cat.items || []).map((i) => ({ text: htmlToText(i.text), spoiler: !!i.isSpoiler })),
        totalItems: cat.pagination?.totalItems ?? (cat.items || []).length,
      })),
    };
  };

  const parseCredits = (pp) => {
    const cats = pp.contentData?.categories;
    if (!cats) throw new Error('No cast and crew found on the page.');
    return cats
      .map((c) => ({
        name: c.name,
        total: c.section?.total ?? c.section?.items?.length ?? 0,
        items: (c.section?.items || []).map((i) => ({
          name: i.rowTitle,
          characters: (i.characters || []).join(' / '),
          note: i.attributes || '',
        })),
      }))
      .filter((g) => g.items.length);
  };

  IFX.imdb = { readPageProps, fetchPageProps, parseTitle, parseSearch, parseReviews, parseParentsGuide, parseCredits };
})();
