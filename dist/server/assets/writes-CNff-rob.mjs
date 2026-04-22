import { t as triggerSync } from "./router-kvjOiOR_.mjs";
function now() {
  return Date.now();
}
async function insertLocal(table, row) {
  const t = now();
  await table.put({
    ...row,
    updatedAt: t,
    deletedAt: null,
    rev: 1,
    _dirty: 1
  });
  triggerSync();
}
async function updateLocal(table, key, patch) {
  const existing = await table.get(key);
  if (!existing) return;
  const t = now();
  await table.put({
    ...existing,
    ...patch,
    updatedAt: t,
    rev: (existing.rev ?? 0) + 1,
    _dirty: 1
  });
  triggerSync();
}
async function softDeleteLocal(table, key) {
  const existing = await table.get(key);
  if (!existing) return;
  const t = now();
  await table.put({
    ...existing,
    deletedAt: t,
    updatedAt: t,
    rev: (existing.rev ?? 0) + 1,
    _dirty: 1
  });
  triggerSync();
}
export {
  insertLocal as i,
  softDeleteLocal as s,
  updateLocal as u
};
