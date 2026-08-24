const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const languageFilter = document.getElementById("languageFilter");
const starsFilter = document.getElementById("starsFilter");
const sortFilter = document.getElementById("sortFilter");
const results = document.getElementById("results");
const statusText = document.getElementById("status");
const resultCount = document.getElementById("resultCount");
const favoriteCount = document.getElementById("favoriteCount");
const favoritesButton = document.getElementById("favoritesButton");
const clearCacheButton = document.getElementById("clearCacheButton");
const profilePanel = document.getElementById("profilePanel");

const CACHE_TIME = 10 * 60 * 1000;
const MAX_USERS = 5;
const MAX_REPOS_PER_USER = 8;

let repositories = [];
let showFavorites = false;
let favorites = JSON.parse(localStorage.getItem("indiaGithubFavorites") || "[]");

function cacheKey(type, value) {
  return `indiaGithub_${type}_${value.toLowerCase().trim()}`;
}

function getCache(key) {
  try {
    const item = JSON.parse(localStorage.getItem(key));
    if (!item) return null;
    if (Date.now() - item.time > CACHE_TIME) {
      localStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

function saveCache(key, data) {
  localStorage.setItem(key, JSON.stringify({
    time: Date.now(),
    data
  }));
}

async function githubFetch(url) {
  const response = await fetch(url);

  if (response.status === 403 || response.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return response.json();
}

async function searchIndiaRepositories() {
  const keyword = searchInput.value.trim();
  showFavorites = false;
  results.innerHTML = "";
  profilePanel.classList.add("hidden");
  statusText.textContent = "Finding India-based developers...";

  try {
    const query = keyword ? `${keyword} location:India` : "location:India";
    const userKey = cacheKey("users", query);

    let users = getCache(userKey);

    if (users) {
      statusText.textContent = "Loaded developers from browser cache...";
    } else {
      const userUrl =
        `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=${MAX_USERS}`;

      const userData = await githubFetch(userUrl);
      users = userData.items;
      saveCache(userKey, users);
    }

    if (!users.length) {
      repositories = [];
      render();
      statusText.textContent = "No India-based developers found.";
      return;
    }

    statusText.textContent =
      `Found ${users.length} developers. Loading their repositories...`;

    const groups = await Promise.all(
      users.map(async (user) => {
        const repoKey = cacheKey("repos", user.login);
        const cachedRepos = getCache(repoKey);

        if (cachedRepos) return cachedRepos;

        try {
          const repoUrl =
            `https://api.github.com/users/${encodeURIComponent(user.login)}/repos?sort=stars&direction=desc&per_page=${MAX_REPOS_PER_USER}`;

          const repos = await githubFetch(repoUrl);
          saveCache(repoKey, repos);
          return repos;
        } catch (error) {
          if (error.message === "RATE_LIMIT") throw error;
          return [];
        }
      })
    );

    repositories = groups.flat();

    if (keyword) {
      const term = keyword.toLowerCase();

      repositories = repositories.filter((repo) => {
        const text = [
          repo.name,
          repo.description,
          repo.language,
          ...(repo.topics || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(term);
      });
    }

    const unique = new Map();
    repositories.forEach((repo) => unique.set(repo.id, repo));
    repositories = Array.from(unique.values());

    statusText.textContent =
      `Showing repositories from India-based GitHub developers.`;
    render();

  } catch (error) {
    console.error(error);
    repositories = [];
    resultCount.textContent = "0";

    if (error.message === "RATE_LIMIT") {
      statusText.textContent = "GitHub API rate limit reached.";

      results.innerHTML = `
        <div class="message rate-limit">
          <strong>⚠️ GitHub API rate limit reached.</strong>
          <p style="margin-top:8px">
            The public API allows limited unauthenticated requests.
            Cached searches can still work. Try again after GitHub resets the limit.
          </p>
        </div>
      `;
    } else {
      statusText.textContent = "Unable to load GitHub data.";
      results.innerHTML = `
        <div class="message">
          <strong>Request failed.</strong><br>
          Check your internet connection and try again.
        </div>
      `;
    }
  }
}

function render() {
  let filtered = [...repositories];

  const language = languageFilter.value.toLowerCase();
  const minStars = Number(starsFilter.value);

  if (language) {
    filtered = filtered.filter(
      repo => (repo.language || "").toLowerCase() === language
    );
  }

  filtered = filtered.filter(
    repo => repo.stargazers_count >= minStars
  );

  if (showFavorites) {
    filtered = filtered.filter(repo => favorites.includes(repo.id));
  }

  if (sortFilter.value === "stars") {
    filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
  }

  if (sortFilter.value === "updated") {
    filtered.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  }

  if (sortFilter.value === "name") {
    filtered.sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
  }

  resultCount.textContent = filtered.length;
  favoriteCount.textContent = favorites.length;

  if (!filtered.length) {
    results.innerHTML = `
      <div class="message">
        No repositories match the selected filters.
      </div>
    `;
    return;
  }

  results.innerHTML = "";

  filtered.forEach((repo) => {
    const isFavorite = favorites.includes(repo.id);
    const card = document.createElement("article");
    card.className = "repo-card";

    card.innerHTML = `
      <button class="favorite" title="Favorite">
        ${isFavorite ? "⭐" : "☆"}
      </button>

      <h3 class="repo-title">
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          ${escapeHTML(repo.full_name)}
        </a>
      </h3>

      <p class="owner">
        Developer: ${escapeHTML(repo.owner.login)}
      </p>

      <span class="location">🇮🇳 India-based profile</span>

      <p class="description">
        ${escapeHTML(repo.description || "No description available.")}
      </p>

      <div class="repo-info">
        <span>⭐ ${repo.stargazers_count.toLocaleString()}</span>
        <span>🍴 ${repo.forks_count.toLocaleString()}</span>
        <span>🐛 ${repo.open_issues_count.toLocaleString()} issues</span>
        <span class="language">${escapeHTML(repo.language || "Unknown")}</span>
      </div>

      <div class="card-actions">
        <a class="view-btn" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          View on GitHub →
        </a>
        <button class="profile-btn">Developer profile</button>
      </div>
    `;

    card.querySelector(".favorite").addEventListener("click", () => {
      toggleFavorite(repo.id);
    });

    card.querySelector(".profile-btn").addEventListener("click", () => {
      loadProfile(repo.owner.login);
    });

    results.appendChild(card);
  });
}

async function loadProfile(username) {
  profilePanel.classList.remove("hidden");
  profilePanel.innerHTML = "<p>Loading developer profile...</p>";

  const key = cacheKey("profile", username);
  let user = getCache(key);

  try {
    if (!user) {
      user = await githubFetch(
        `https://api.github.com/users/${encodeURIComponent(username)}`
      );
      saveCache(key, user);
    }

    profilePanel.innerHTML = `
      <div class="profile-head">
        <img class="avatar" src="${user.avatar_url}" alt="GitHub avatar">
        <div>
          <h2>${escapeHTML(user.name || user.login)}</h2>
          <p class="muted">
            @${escapeHTML(user.login)} ·
            ${escapeHTML(user.location || "Location not provided")}
          </p>
        </div>
      </div>

      <p style="margin-top:18px">
        ${escapeHTML(user.bio || "No public bio available.")}
      </p>

      <div class="repo-info" style="margin-top:15px">
        <span>👥 ${user.followers.toLocaleString()} followers</span>
        <span>📦 ${user.public_repos.toLocaleString()} public repos</span>
      </div>

      <div class="profile-links">
        <a href="${user.html_url}" target="_blank" rel="noopener noreferrer">
          Open GitHub Profile →
        </a>
      </div>
    `;

    profilePanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (error) {
    if (error.message === "RATE_LIMIT") {
      profilePanel.innerHTML =
        "<p>GitHub API rate limit reached. Try again after the reset.</p>";
    } else {
      profilePanel.innerHTML =
        "<p>Could not load the developer profile.</p>";
    }
  }
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(item => item !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem(
    "indiaGithubFavorites",
    JSON.stringify(favorites)
  );

  render();
}

function clearCache() {
  Object.keys(localStorage)
    .filter(key => key.startsWith("indiaGithub_"))
    .forEach(key => localStorage.removeItem(key));

  statusText.textContent =
    "Cache cleared. The next search will request fresh data.";
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchButton.addEventListener("click", searchIndiaRepositories);

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    searchIndiaRepositories();
  }
});

[languageFilter, starsFilter, sortFilter].forEach(element => {
  element.addEventListener("change", render);
});

favoritesButton.addEventListener("click", () => {
  showFavorites = !showFavorites;
  favoritesButton.innerHTML = showFavorites
    ? "⭐ All repositories"
    : `⭐ Favorites (<span id="favoriteCount">${favorites.length}</span>)`;
  render();
});

clearCacheButton.addEventListener("click", clearCache);

document.querySelectorAll(".quick-searches button").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    searchIndiaRepositories();
  });
});

favoriteCount.textContent = favorites.length;
