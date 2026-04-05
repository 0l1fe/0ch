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
  const feedUrls = ['http://rss.arxiv.org/rss/math.RA/'];
  const proxyBase = 'https://api.rss2json.com/v1/api.json?rss_url=';
  const feedContainer = document.getElementById('feed');

  try {
    const responses = await Promise.all(
      feedUrls.map(url => fetch(proxyBase + encodeURIComponent(url)).then(res => res.json()))
    );
    
    let liveItems = responses.flatMap((data, i) => 
      (data.status === 'ok' && Array.isArray(data.items))
        ? data.items.map(item => ({ ...item, __source: feedUrls[i] }))
        : []
    ).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    if (liveItems.length) {
      renderItems(liveItems, feedContainer);
    } else {
      feedContainer.innerHTML = '';
    }

    const logoBtn = document.querySelector('.navbar .container .navbar-brand');
    if (logoBtn) {
      logoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload(); 
      });
    }

    const navContainer = document.querySelector('.navbar .container');
    if (navContainer) {
      const archiveBtn = document.createElement('a');
      archiveBtn.href = '#';
      archiveBtn.className = 'navbar-brand'; 
      archiveBtn.textContent = ' [Archive]';
      navContainer.appendChild(archiveBtn);

      let isArchiveView = false;
      let archiveItems = null; 

      archiveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        isArchiveView = !isArchiveView;
        archiveBtn.textContent = isArchiveView ? ' [Back to Feed]' : ' [Archive]';
        
        feedContainer.innerHTML = ''; 
        
        if (isArchiveView) {
          feedContainer.innerHTML = `
            <div class="card mb-4">
              <div class="card-body" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <label for="archive-date" style="margin: 0; font-weight: 600;">Filter by Date:</label>
                <input type="date" id="archive-date" class="form-control" style="flex-grow: 1; max-width: 200px;">
                <button id="clear-date" class="btn btn-secondary">Clear</button>
              </div>
            </div>
            <div id="archive-content"></div>
          `;
          
          const contentContainer = document.getElementById('archive-content');
          const dateInput = document.getElementById('archive-date');
          const clearBtn = document.getElementById('clear-date');

          if (!archiveItems) {
            try {
              const res = await fetch('./archive.json');
              archiveItems = await res.json();
            } catch (err) {
              archiveItems = []; 
            }
          }
          
          renderItems(archiveItems, contentContainer);

          dateInput.addEventListener('change', (event) => {
            const selectedDate = event.target.value; 
            if (!selectedDate) {
              return renderItems(archiveItems, contentContainer);
            }

            const filteredItems = archiveItems.filter(item => {
              const itemDate = new Date(item.pubDate).toISOString().split('T')[0];
              return itemDate === selectedDate;
            });

            renderItems(filteredItems, contentContainer);
          });

          clearBtn.addEventListener('click', () => {
            dateInput.value = '';
            renderItems(archiveItems, contentContainer);
          });

        } else {
          renderItems(liveItems, feedContainer);
        }
      });
    }

  } catch (error) {
    feedContainer.innerHTML = '';
  }
})();

function renderItems(items, container) {
  container.innerHTML = ''; 
  if (!items || items.length === 0) return;

  const fragment = document.createDocumentFragment();
  const dateOptions = { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };

  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'card mb-4';
    
    const formattedDate = new Date(item.pubDate).toLocaleDateString('en-GB', dateOptions);
    const authors = item.author ? item.author : '';
    const subjects = (item.categories && item.categories.length > 0) 
      ? item.categories.join(', ') 
      : '';

    article.innerHTML = `
      <header class="card-header">
        <h2 class="card-title">
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
        </h2>
        <time class="card-meta">${formattedDate}</time>
      </header>
      <div class="card-body">
        <p>${item.contentSnippet || ''}</p>
      </div>
      <footer class="card-footer">
        ${authors ? `<small><strong>Authors:</strong> ${authors}</small><br>` : ''}
        ${subjects ? `<small><strong>Subjects:</strong> ${subjects}</small>` : ''}
      </footer>
    `;
    fragment.appendChild(article);
  });
  
  container.appendChild(fragment);
  
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise().catch(() => {});
  }
}
