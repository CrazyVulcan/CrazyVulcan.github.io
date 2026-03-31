const contentPath = "data/site-content.json";

const renderSite = async () => {
  const response = await fetch(contentPath);
  const content = await response.json();

  renderWordmark(content.brand?.wordmarkPath);
  renderNav(content.nav || []);
  renderHero(content.hero || {});
  renderAudience(content.audiences || []);
  renderUpdates(content.updates || []);

  document.getElementById("boilerplate").textContent = content.about?.boilerplate || "";
  document.getElementById("footerMaintenance").textContent = content.footer?.maintenance || "";
  document.getElementById("legalLine").textContent = content.footer?.legal || "";
};

const renderWordmark = (path) => {
  const img = document.getElementById("brandWordmark");
  img.src = path || "";
  img.onerror = () => {
    img.replaceWith(buildFallbackTitle());
  };
};

const buildFallbackTitle = () => {
  const fallback = document.createElement("span");
  fallback.className = "wordmark-fallback";
  fallback.textContent = "X-WING ALLIANCE";
  return fallback;
};

const renderNav = (items) => {
  const nav = document.getElementById("primaryNav");
  nav.innerHTML = items
    .map((item) => `<li><a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.label}</a></li>`)
    .join("");
};

const renderHero = (hero) => {
  document.getElementById("heroEyebrow").textContent = hero.eyebrow || "";
  document.getElementById("hero-heading").textContent = hero.heading || "";
  document.getElementById("heroSummary").textContent = hero.summary || "";
  document.getElementById("nextPriority").textContent = hero.priority || "";

  document.getElementById("heroActions").innerHTML = (hero.actions || [])
    .map((action) => {
      const roleClass = action.primary ? "primary" : "secondary";
      return `<a class="button ${roleClass}" href="${action.href}" target="_blank" rel="noopener noreferrer">${action.label}</a>`;
    })
    .join("");
};

const renderAudience = (cards) => {
  document.getElementById("audienceCards").innerHTML = cards
    .map(
      (card) => `
      <article class="card">
        <h3>${card.title}</h3>
        <p>${card.summary}</p>
        <a href="${card.href}" target="_blank" rel="noopener noreferrer">${card.cta}</a>
      </article>`
    )
    .join("");
};

const renderUpdates = (updates) => {
  document.getElementById("updatesList").innerHTML = updates
    .map(
      (item) => `
      <article class="update-item">
        <h3>${item.title}</h3>
        <p class="meta">${formatDate(item.date)} • ${item.owner}</p>
        <p>${item.summary}</p>
        <a href="${item.href}" target="_blank" rel="noopener noreferrer">Read update</a>
      </article>`
    )
    .join("");
};

const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });

renderSite().catch((error) => {
  console.error("Failed to render site content", error);
});
