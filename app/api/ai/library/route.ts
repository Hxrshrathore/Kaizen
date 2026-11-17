import { NextResponse } from "next/server";
import { 
  getSavedPapers, 
  deleteSavedPaper, 
  getSavedFlashcards, 
  deleteSavedFlashcard 
} from "@/lib/paper-storage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectCode = searchParams.get("subject") || undefined;

    const [papers, flashcards] = await Promise.all([
      getSavedPapers(subjectCode, 50),
      getSavedFlashcards(50),
    ]);

    const totalCount = papers.length + flashcards.length;

    return NextResponse.json({
      papers,
      flashcards,
      totalCount,
    });
  } catch (error: any) {
    console.error("Library query failed:", error);
    return NextResponse.json(
      { error: "Failed to load library items", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // 'paper' | 'flashcard'

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    if (type === "flashcard") {
      const success = await deleteSavedFlashcard(id);
      return NextResponse.json({ success });
    }

    // Default to paper
    const success = await deleteSavedPaper(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("Failed to delete library item:", error);
    return NextResponse.json(
      { error: "Failed to delete item", details: error.message },
      { status: 500 }
    );
  }
}
