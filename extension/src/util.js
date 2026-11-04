(() => {
  const IFX = (self.IFX = self.IFX || {});

  const addChildren = (el, kids) => {
    for (const kid of kids) {
      if (kid == null || kid === false) continue;
      if (Array.isArray(kid)) addChildren(el, kid);
      else el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
  };

  // h('div', { class: 'x', onclick: fn }, 'text', childNode, [more, nodes])
  // Strings always become text nodes, so IMDb data can never inject markup.
  IFX.h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(props || {})) {
      if (val == null || val === false) continue;
      if (key === 'class') el.className = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2), val);
      else el.setAttribute(key, val === true ? '' : val);
    }
    addChildren(el, kids);
    return el;
  };

  // IMDb ships some text as HTML ("can&#39;t", "<br/>"). Parse it in an inert
  // document and keep only the text, with <br> turned into line breaks.
  IFX.htmlToText = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(String(html).replace(/<br\s*\/?>/gi, '\n'), 'text/html');
    return (doc.body.textContent || '').trim();
  };

  const compactFmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  const numberFmt = new Intl.NumberFormat('en');
  IFX.compact = (n) => (n == null ? '' : compactFmt.format(n));
  IFX.number = (n) => (n == null ? '' : numberFmt.format(n));

  IFX.runtime = (seconds) => {
    if (!seconds) return '';
    const mins = Math.round(seconds / 60);
    const hrs = Math.floor(mins / 60);
    return hrs ? `${hrs}h${mins % 60 ? ` ${mins % 60}m` : ''}` : `${mins}m`;
  };

  IFX.years = (year, endYear, type) => {
    if (!year) return '';
    if (endYear && endYear !== year) return `${year}–${endYear}`;
    // A series with no end year is still running.
    return endYear === null && /Series/.test(type) ? `${year}–` : String(year);
  };

  IFX.date = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // IMDb poster URLs end in "._V1_.jpg"; a size suffix asks the CDN for a smaller file.
  IFX.imageUrl = (url, width) => (url ? url.replace(/\._V1_[^/]*\.(jpe?g|png)$/i, `._V1_QL75_UX${width}_.$1`) : '');
})();
