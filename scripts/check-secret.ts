import { signSession } from "../src/lib/session-token";

(process.env as { NODE_ENV?: string }).NODE_ENV = "production";

signSession({ sub: "check", role: "ADMIN", email: "a@b.c", name: "Check" })
  .then(() => console.log("secret accepted"))
  .catch((error: unknown) => console.log(error instanceof Error ? error.message : "unknown"));
