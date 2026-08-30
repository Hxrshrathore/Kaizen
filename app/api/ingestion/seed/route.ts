import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sample questions to seed the annotation queue for demonstration
const SEED_QUESTIONS = [
  {
    subject: "Data Structures",
    year: "2023",
    examType: "end_sem",
    rawOcrText: "Explain the concept of AVL Trees and perform rotations for the sequence 10, 20, 30. Also derive the time complexity of search in an AVL tree.",
    imagePath: "",
    sourcePdf: "DS_EndSem_2023.pdf",
    pageNumber: 2,
  },
  {
    subject: "Computer Networks",
    year: "2022",
    examType: "mid_sem",
    rawOcrText: "Describe the 7 layers of the OSI model with their functions. Give examples of protocols at each layer.",
    imagePath: "",
    sourcePdf: "CN_MidSem_2022.pdf",
    pageNumber: 1,
  },
  {
    subject: "Operating Systems",
    year: "2023",
    examType: "end_sem",
    rawOcrText: "Discuss the Banker's Algorithm for deadlock avoidance with a suitable numerical example. Show the safe state sequence.",
    imagePath: "",
    sourcePdf: "OS_EndSem_2023.pdf",
    pageNumber: 3,
  },
  {
    subject: "Digital Electronics",
    year: "2022",
    examType: "end_sem",
    rawOcrText: "Simplify the Boolean expression F(A,B,C,D) = Σm(0,1,2,5,8,9,10) using Karnaugh Map. Draw the simplified logic circuit.",
    imagePath: "",
    sourcePdf: "DE_EndSem_2022.pdf",
    pageNumber: 4,
  },
  {
    subject: "Software Engineering",
    year: "2021",
    examType: "end_sem",
    rawOcrText: "Explain the SDLC Waterfall model with all its phases. What are its advantages and disadvantages compared to Agile methodology?",
    imagePath: "",
    sourcePdf: "SE_EndSem_2021.pdf",
    pageNumber: 1,
  },
  {
    subject: "Microprocessors",
    year: "2023",
    examType: "mid_sem",
    rawOcrText: "Describe the interrupt structure of 8086 microprocessor. Differentiate between maskable and non-maskable interrupts with examples.",
    imagePath: "",
    sourcePdf: "MP_MidSem_2023.pdf",
    pageNumber: 2,
  },
  {
    subject: "Data Structures",
    year: "2022",
    examType: "end_sem",
    rawOcrText: "Write the algorithm for Dijkstra's shortest path algorithm. Trace it on a graph with 5 vertices. What is its time complexity?",
    imagePath: "",
    sourcePdf: "DS_EndSem_2022.pdf",
    pageNumber: 5,
  },
  {
    subject: "Computer Networks",
    year: "2023",
    examType: "end_sem",
    rawOcrText: "Explain subnetting with a numerical example. Given the IP address 192.168.10.0/24, divide it into 4 equal subnets.",
    imagePath: "",
    sourcePdf: "CN_EndSem_2023.pdf",
    pageNumber: 3,
  },
  {
    subject: "Operating Systems",
    year: "2022",
    examType: "end_sem",
    rawOcrText: "Explain CPU scheduling algorithms: FCFS, SJF (Preemptive and Non-preemptive), and Round Robin. Calculate average waiting time for a given set of processes.",
    imagePath: "",
    sourcePdf: "OS_EndSem_2022.pdf",
    pageNumber: 4,
  },
  {
    subject: "Digital Electronics",
    year: "2023",
    examType: "end_sem",
    rawOcrText: "Design a 4-bit synchronous binary counter using JK flip-flops. Draw the state diagram and timing diagram.",
    imagePath: "",
    sourcePdf: "DE_EndSem_2023.pdf",
    pageNumber: 2,
  },
];

export async function POST() {
  try {
    // Don't re-seed if records already exist
    const existingCount = await prisma.ocrQuestion.count();
    if (existingCount > 0) {
      return NextResponse.json({
        message: `Already seeded. ${existingCount} records exist.`,
        count: existingCount,
        skipped: true,
      });
    }

    const created = await prisma.ocrQuestion.createMany({
      data: SEED_QUESTIONS.map(q => ({
        ...q,
        status: "PENDING",
      })),
    });

    return NextResponse.json({
      message: `Successfully seeded ${created.count} sample questions into the annotation queue.`,
      count: created.count,
    });
  } catch (error: any) {
    console.error("[SEED] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
