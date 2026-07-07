import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const ALL_TAGS = ['featured-products', 'categories', 'products'];

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");
  const action = request.nextUrl.searchParams.get("action");

  // Clear all cache
  if (action === 'clearAll' || tag === 'all') {
    try {
      for (const t of ALL_TAGS) {
        (revalidateTag as any)(t);
      }
      return NextResponse.json({ revalidated: true, tags: ALL_TAGS, now: Date.now() });
    } catch (error: any) {
      return NextResponse.json({ message: error.message || 'Failed to revalidate' }, { status: 500 });
    }
  }

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
