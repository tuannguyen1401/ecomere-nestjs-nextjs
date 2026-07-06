import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");

  if (!tag) {
    return NextResponse.json({ message: "Missing tag query parameter" }, { status: 400 });
  }

  try {
    (revalidateTag as any)(tag);
    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to revalidate" }, { status: 500 });
  }
}
