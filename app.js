const contentPath = "data/site-content.json";

const render = async () => {
  const response = await fetch(contentPath);
  const data = await response.json();

  renderNav(data.nav || []);
  renderHero(data.hero || {});
  renderQuickLinks(data.quickLinks || []);
  renderUpdates(data.updates || []);

  const footerText = document.getElementById("footerText");
  footerText.textContent = data.footer?.text || "";
};

const renderNav = (items) => {
  const nav = document.getElementById("primaryNav");
  nav.innerHTML = items
    .map(
      (item) =>
        `<li><a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.label}</a></li>`
    )
    .join("");
};

const renderHero = (hero) => {
  document.getElementById("heroSummary").textContent = hero.summary || "";
  document.getElementById("nextEventText").textContent = hero.nextEvent || "";

  const actionContainer = document.getElementById("heroActions");
  actionContainer.innerHTML = (hero.actions || [])
    .map((action) => {
      const classes = action.primary
        ? "button button-primary"
        : "button button-secondary";
      return `<a class="${classes}" href="${action.href}" target="_blank" rel="noopener noreferrer">${action.label}</a>`;
    })
    .join("");
};

const renderQuickLinks = (links) => {
  const container = document.getElementById("quickLinks");
  container.innerHTML = links
    .map(
      (link) => `
        <article class="card">
          <h3>${link.title}</h3>
          <p>${link.description}</p>
          <a href="${link.href}" target="_blank" rel="noopener noreferrer">Open</a>
        </article>`
    )
    .join("");
};

const renderUpdates = (updates) => {
  const container = document.getElementById("updatesList");
  container.innerHTML = updates
    .map(
      (item) => `
        <article class="update-item">
          <h3>${item.title}</h3>
          <p class="update-meta">${formatDate(item.date)} • ${item.owner}</p>
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

render().catch((error) => {
  console.error("Failed to load site content", error);
});
