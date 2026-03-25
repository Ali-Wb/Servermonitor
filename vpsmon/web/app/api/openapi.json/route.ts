import { cacheLife } from "next/cache";

import { buildOpenApiDocument } from "@/lib/openapi";

export async function GET() {
  "use cache";
  cacheLife("hours");
  const plainDoc = JSON.parse(JSON.stringify(buildOpenApiDocument()));
  return new Response(JSON.stringify(plainDoc), {
    headers: { "content-type": "application/json" },
  });
}
