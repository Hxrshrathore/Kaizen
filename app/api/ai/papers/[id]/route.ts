import { NextResponse } from "next/server";
import { deleteSavedPaper } from "@/lib/paper-storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing paper ID" }, { status: 400 });
    }

    const success = await deleteSavedPaper(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("DELETE /api/ai/papers/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete paper" }, { status: 500 });
  }
}
