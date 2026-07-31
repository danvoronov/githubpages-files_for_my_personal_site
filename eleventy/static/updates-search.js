(async function () {
  const input = document.getElementById("updates-search-input");
  const status = document.getElementById("updates-search-status");
  const resultsRoot = document.getElementById("updates-search-results");

  if (!input || !status || !resultsRoot) {
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scorePost(post, query) {
    const haystack = [
      post.title,
      post.excerpt,
      post.content,
      Array.isArray(post.tags) ? post.tags.join(" ") : ""
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(query)) {
      return -1;
    }

    let score = 0;

    if (post.title.toLowerCase().includes(query)) {
      score += 6;
    }

    if ((post.excerpt || "").toLowerCase().includes(query)) {
      score += 3;
    }

    if (Array.isArray(post.tags) && post.tags.join(" ").toLowerCase().includes(query)) {
      score += 2;
    }

    return score;
  }

  function renderResults(items, query) {
    if (!items.length) {
      resultsRoot.innerHTML = "";
      status.textContent = query ? "No matches." : "Type to search the archive.";
      return;
    }

    status.textContent = `${items.length} match${items.length === 1 ? "" : "es"}.`;
    resultsRoot.innerHTML = items
      .map(
        (post) => `
          <article class="update-card">
            <div class="update-card__meta">
              <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date.slice(0, 10))}</time>
              <span>${escapeHtml(post.mediaKind || "update")}</span>
            </div>
            <h2><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></h2>
            <p>${escapeHtml(post.excerpt || "")}</p>
            <a class="update-card__link" href="${escapeHtml(post.url)}">Open update</a>
          </article>
        `
      )
      .join("");
  }

  let searchIndex = [];

  try {
    const response = await fetch("/updates/search.json");
    searchIndex = await response.json();
  } catch (_error) {
    status.textContent = "Could not load the search index.";
    return;
  }

  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  input.value = initialQuery;

  function runSearch(rawQuery) {
    const query = rawQuery.trim().toLowerCase();

    if (!query) {
      renderResults([], "");
      return;
    }

    const matches = searchIndex
      .map((post) => ({ post, score: scorePost(post, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return right.post.date.localeCompare(left.post.date);
      })
      .slice(0, 60)
      .map((entry) => entry.post);

    renderResults(matches, query);
  }

  input.addEventListener("input", function () {
    const nextQuery = input.value.trim();
    const url = new URL(window.location.href);

    if (nextQuery) {
      url.searchParams.set("q", nextQuery);
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState({}, "", url);
    runSearch(nextQuery);
  });

  status.textContent = "Type to search the archive.";
  runSearch(initialQuery);
})();

