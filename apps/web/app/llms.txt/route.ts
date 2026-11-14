import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "llms.txt");
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    content = `# KIVO — Cloud Restaurant Management Platform & POS
Developer: Madhur Dhadve
Organization: FUTORA GROUP OF COMPANIES
URL: https://www.kivo.futoragroup.in`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
