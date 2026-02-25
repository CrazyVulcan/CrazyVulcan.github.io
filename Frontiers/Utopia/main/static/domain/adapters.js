export function mapBoardState(payload) {
  const board = payload.board;
  const columns = [...payload.columns].sort((a, b) => sortByPosition(a, b));
  const cards = [...payload.cards].sort((a, b) => sortByPosition(a, b));

  const cardsByColumn = {};
  for (const column of columns) cardsByColumn[column.id] = [];
  for (const card of cards) {
    if (!cardsByColumn[card.column_id]) cardsByColumn[card.column_id] = [];
    cardsByColumn[card.column_id].push({
      ...card,
      tags: card.tags || [],
      metadata: card.metadata || {},
    });
  }

  return {
    board,
    columns,
    cardsByColumn,
    views: (payload.views || []).map((v) => ({
      ...v,
      filter: safeJson(v.filter_json),
      sort: safeJson(v.sort_json),
    })),
  };
}

export function sortByPosition(a, b) {
  const ap = Number(a.position ?? 0);
  const bp = Number(b.position ?? 0);
  if (ap !== bp) return ap - bp;
  return String(a.id).localeCompare(String(b.id));
}

export function computeMidpoint(prev, next) {
  const prevPos = prev?.position != null ? Number(prev.position) : null;
  const nextPos = next?.position != null ? Number(next.position) : null;

  if (prevPos == null && nextPos == null) return 1000;
  if (prevPos == null) return nextPos / 2;
  if (nextPos == null) return prevPos + 1000;
  return (prevPos + nextPos) / 2;
}

function safeJson(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
