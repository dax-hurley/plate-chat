function newId() {
  return crypto.randomUUID();
}
function nowMs() {
  return Date.now();
}
export {
  nowMs as a,
  newId as n
};
