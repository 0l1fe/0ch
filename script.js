// Optimized Script to fetch RSS feeds and render with LaTeX support via MathJax

// MathJax Configuration
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
  svg: { fontCache: 'global' }
};

// Load MathJax asynchronously
(function loadMathJax() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
  script.async = true;
  document.head.appendChild(script);
})();

(async function main() {
  const feedUrls = [
    'http://rss.arxiv.org/rss/math.RA/'
  ];

  const proxyBase = 'https://api.rss2json.com/v1/api.json?rss_url=';
  const feedContainer = document.getElementById('feed');
  const fragment = document.createDocumentFragment();

  try {
    // Fetch and process feeds in parallel
    const responses = await Promise.all(
      feedUrls.map(url => fetch(proxyBase + encodeURIComponent(url)).then(res => res.json()))
    );

    // Collect and sort items
    const allItems = responses.flatMap((data, i) => 
      (data.status === 'ok' && Array.isArray(data.items))
        ? data.items.map(item => ({ ...item, __source: feedUrls[i] }))
        : []
    )
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    if (!allItems.length) {
      feedContainer.innerHTML = '<p>No items could be loaded from any feed.</p>';
      return;
    }

    // Render each item
    allItems.forEach(item => {
      const article = document.createElement('article');
      article.className = 'card mb-4';

      article.innerHTML = `
        <header class="card-header">
          <h2 class="card-title">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
              ${item.title}
            </a>
          </h2>
          <time class="card-meta">${new Date(item.pubDate).toLocaleString()}</time>
        </header>
        <div class="card-body">
          <p>${item.contentSnippet || ''}</p>
        </div>
        <footer class="card-footer">
          <small>Source: <a href="${item.__source}" target="_blank" rel="noopener noreferrer">${new URL(item.__source).hostname}</a></small>
        </footer>
      `;

      fragment.appendChild(article);
    });

    feedContainer.appendChild(fragment);

    // Typeset LaTeX
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise()
        .catch(err => console.error('MathJax typesetting failed:', err));
    }
  } catch (error) {
    feedContainer.innerHTML = `<p style="color:red">Error loading feeds: ${error.message}</p>`;
    console.error('Feed fetch error:', error);
  }
})();
