import { s as saveTokens } from "./router-CUOzYYmk.mjs";
async function bootstrapDeviceSession(args) {
  const res = await fetch("/api/auth/device-tokens", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceName: args.deviceName ?? "" })
  });
  if (!res.ok) {
    throw new Error(`device-tokens ${res.status}`);
  }
  const data = await res.json();
  const bundle = {
    ...data,
    userId: args.userId,
    email: args.email,
    name: args.name ?? null
  };
  await saveTokens(bundle);
  return bundle;
}
export {
  bootstrapDeviceSession as b
};
