import { computeMidpoint, mapBoardState, sortByPosition } from "/static/domain/adapters.js";

const state = {
  boards: [],
  boardId: null,
  tagFilter: "",
  boardState: null,
  draggingCardId: null,
};

const els = {
  status: document.getElementById("global-status"),
  app: document.getElementById("app"),
  boardSelect: document.getElementById("board-select"),
  createBoard: document.getElementById("create-board"),
  createColumn: document.getElementById("create-column"),
  tagFilter: document.getElementById("tag-filter"),
  applyFilter: document.getElementById("apply-filter"),
  saveView: document.getElementById("save-view"),
  viewSelect: document.getElementById("saved-view-select"),
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  return data;
}

async function bootstrap() {
  setStatus("Loading data…");
  try {
    const payload = await api("/api/bootstrap");
    state.boards = payload.boards;
    state.boardId = state.boards[0]?.id || null;
    renderBoardSelect();
    await loadBoardState();
    bindToolbar();
    setStatus("Ready");
  } catch (err) {
    setStatus(`Bootstrap failed: ${err.message}`, true);
  }
}

function bindToolbar() {
  els.boardSelect.onchange = async () => {
    state.boardId = els.boardSelect.value;
    await loadBoardState();
  };

  els.createBoard.onclick = async () => {
    const name = prompt("Board name:", "New Board");
    if (!name) return;
    await api("/api/boards", { method: "POST", body: JSON.stringify({ name }) });
    await bootstrap();
  };

  els.createColumn.onclick = async () => {
    if (!state.boardId) return;
    const name = prompt("List name:", "New List");
    if (!name) return;
    await api(`/api/boards/${state.boardId}/columns`, { method: "POST", body: JSON.stringify({ name }) });
    await loadBoardState();
  };

  els.applyFilter.onclick = async () => {
    state.tagFilter = els.tagFilter.value.trim();
    await loadBoardState();
  };

  els.saveView.onclick = async () => {
    if (!state.boardId) return;
    const name = prompt("Save view as:", "Filtered View");
    if (!name) return;
    await api(`/api/boards/${state.boardId}/views`, {
      method: "POST",
      body: JSON.stringify({ name, filter: { tag: state.tagFilter } }),
    });
    await loadBoardState();
  };

  els.viewSelect.onchange = async () => {
    const selected = state.boardState?.views.find((v) => v.id === els.viewSelect.value);
    if (!selected) return;
    state.tagFilter = selected.filter.tag || "";
    els.tagFilter.value = state.tagFilter;
    await loadBoardState();
  };
}

async function loadBoardState() {
  if (!state.boardId) {
    els.app.innerHTML = "<p class='muted'>No boards yet.</p>";
    return;
  }
  const query = state.tagFilter ? `?tag=${encodeURIComponent(state.tagFilter)}` : "";
  const payload = await api(`/api/boards/${state.boardId}/state${query}`);
  state.boardState = mapBoardState(payload);
  renderViews();
  renderBoard();
}

function renderBoardSelect() {
  els.boardSelect.innerHTML = "";
  for (const board of state.boards) {
    const opt = document.createElement("option");
    opt.value = board.id;
    opt.textContent = board.name;
    if (board.id === state.boardId) opt.selected = true;
    els.boardSelect.appendChild(opt);
  }
}

function renderViews() {
  const current = els.viewSelect.value;
  els.viewSelect.innerHTML = `<option value="">Saved Views</option>`;
  for (const view of state.boardState.views || []) {
    const opt = document.createElement("option");
    opt.value = view.id;
    opt.textContent = view.name;
    if (view.id === current) opt.selected = true;
    els.viewSelect.appendChild(opt);
  }
}

function renderBoard() {
  const columnTpl = document.getElementById("column-template");
  const cardTpl = document.getElementById("card-template");
  els.app.innerHTML = "";

  for (const column of state.boardState.columns) {
    const node = columnTpl.content.firstElementChild.cloneNode(true);
    node.dataset.columnId = column.id;
    node.querySelector(".column-header").textContent = column.name;

    const cardsBox = node.querySelector(".cards");
    const cards = [...(state.boardState.cardsByColumn[column.id] || [])].sort(sortByPosition);
    for (const card of cards) {
      const cardNode = cardTpl.content.firstElementChild.cloneNode(true);
      cardNode.dataset.cardId = card.id;
      cardNode.dataset.columnId = column.id;
      cardNode.querySelector(".title").textContent = card.title;
      cardNode.querySelector(".desc").textContent = card.description || "";
      const tags = cardNode.querySelector(".tags");
      for (const tag of card.tags) {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag.name;
        tags.appendChild(span);
      }

      cardNode.addEventListener("dblclick", () => editCard(card));
      wireCardDnD(cardNode);
      cardsBox.appendChild(cardNode);
    }

    cardsBox.addEventListener("dragover", (ev) => ev.preventDefault());
    cardsBox.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      if (!state.draggingCardId) return;
      const afterEl = getDropAfterElement(cardsBox, ev.clientY);
      const currentCards = (state.boardState.cardsByColumn[column.id] || []).sort(sortByPosition);
      let prev = null;
      let next = null;

      if (!afterEl) {
        prev = currentCards[currentCards.length - 1] || null;
      } else {
        const idx = currentCards.findIndex((c) => c.id === afterEl.dataset.cardId);
        next = idx >= 0 ? currentCards[idx] : null;
        prev = idx > 0 ? currentCards[idx - 1] : null;
      }

      const position = computeMidpoint(prev, next);
      await api(`/api/cards/${state.draggingCardId}/move`, {
        method: "POST",
        body: JSON.stringify({ to_column_id: column.id, prev_position: prev?.position ?? null, next_position: next?.position ?? null, position }),
      });
      await loadBoardState();
    });

    node.querySelector(".add-card").onclick = async () => {
      const title = prompt("Card title:", "New Card");
      if (!title) return;
      await api("/api/cards", {
        method: "POST",
        body: JSON.stringify({ board_id: state.boardId, column_id: column.id, title, card_type: "task", tags: [] }),
      });
      await loadBoardState();
    };

    els.app.appendChild(node);
  }
}

function wireCardDnD(node) {
  node.addEventListener("dragstart", () => {
    state.draggingCardId = node.dataset.cardId;
    node.classList.add("dragging");
  });
  node.addEventListener("dragend", () => {
    node.classList.remove("dragging");
    state.draggingCardId = null;
  });
}

function getDropAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".card:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null },
  ).element;
}

async function editCard(card) {
  const title = prompt("Title", card.title);
  if (title == null) return;
  const description = prompt("Description", card.description || "") ?? "";
  const tagsText = prompt("Tags (comma separated)", (card.tags || []).map((t) => t.name).join(", ")) ?? "";
  const tags = tagsText.split(",").map((s) => s.trim()).filter(Boolean);

  await api(`/api/cards/${card.id}`, {
    method: "PATCH",
    body: JSON.stringify({ title, description, metadata: card.metadata || {}, tags }),
  });
  await loadBoardState();
}

function setStatus(text, isError = false) {
  els.status.textContent = text;
  els.status.className = isError ? "error" : "muted";
}

bootstrap();
