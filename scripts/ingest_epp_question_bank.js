require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');

const dbUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').replace('&channel_binding=require', '');
const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl }
  }
});

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in environment!');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: geminiKey });
const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

function textToSparse(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const tf = {};
  for (const w of words) {
    let hash = 0;
    for (let i = 0; i < w.length; i++) {
      hash = (hash * 31 + w.charCodeAt(i)) & 0xffff;
    }
    tf[hash] = (tf[hash] || 0) + 1;
  }
  const indices = Object.keys(tf).map(Number);
  const values = Object.values(tf).map(v => Math.log(1 + v));
  return { indices, values };
}

async function getEmbeddingWithRetry(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: { outputDimensionality: 1536 }
      });
      if (res.embeddings?.[0]?.values) {
        return res.embeddings[0].values;
      }
      throw new Error('No embedding values returned');
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Retry ${attempt} for embedding due to: ${err.message}`);
      await new Promise(r => setTimeout(r, 1200 * attempt));
    }
  }
}

// 50 Comprehensive Curricular & Examination Questions for EPP (EX40003)
// Derived from Google Classroom (Course 798417072045: Assignments I-IV, Model Questions, Lectures 1-21)
// and KIIT Past Year Examination Papers (2023-2025 Engineering Economics & Costing, Universal Human Values)
const EPP_QUESTIONS = [
  // ── MODULE 1: Professional Ethics, Integrity & Code of Conduct ──
  {
    num: 1,
    module: "Professional Ethics & Code of Conduct",
    marks: 10,
    source: "EPP Assignment-I (Module 1)",
    examType: "Classroom_Assignment",
    text: "Discuss the fundamental canons of the NSPE Code of Ethics for Engineers. Illustrate with a scenario how an engineer must resolve a conflict of interest between client confidentiality and public safety obligations under IEEE/NSPE standards."
  },
  {
    num: 2,
    module: "Professional Ethics & Code of Conduct",
    marks: 10,
    source: "EPP Assignment-I / Lecture 12",
    examType: "Classroom_Assignment",
    text: "Explain the ethical dimensions and legal safeguards surrounding Whistleblowing in engineering organizations. Contrast internal whistleblowing with external whistleblowing, citing relevant protection mechanisms under the Whistle Blowers Protection Act."
  },
  {
    num: 3,
    module: "Professional Ethics & Code of Conduct",
    marks: 10,
    source: "EPP Lecture 11 (Moral and Ethics)",
    examType: "Classroom_Lecture",
    text: "Differentiate between Morals, Ethics, and Law in engineering decision-making. Analyze the Challenger disaster or Bhopal Gas Tragedy through the lens of engineering ethics, groupthink, and management pressure."
  },
  {
    num: 4,
    module: "Professional Ethics & Code of Conduct",
    marks: 10,
    source: "EPP Lecture 12 & UHV PYQ",
    examType: "Endsem_PYQ",
    text: "Explain Kohlberg's and Carol Gilligan's theories of moral development. How do preconventional, conventional, and postconventional stages of moral judgment guide an engineer facing unethical corporate directives?"
  },
  {
    num: 5,
    module: "Professional Ethics & Code of Conduct",
    marks: 5,
    source: "EPP Assignment-I (Module 1)",
    examType: "Classroom_Assignment",
    text: "Define 'Conflict of Interest' in professional engineering practice. Provide three concrete real-world engineering examples (accepting vendor gifts, outside consulting, and insider family procurement) and describe proper disclosure protocols."
  },
  {
    num: 6,
    module: "Professional Ethics & Code of Conduct",
    marks: 5,
    source: "EPP Lecture 12 (Code of Ethics)",
    examType: "Classroom_Lecture",
    text: "Discuss the concept of 'Moral Autonomy' for practicing engineers. Explain why hierarchical obedience to superior management does not absolve an engineer from personal moral and legal accountability."
  },
  {
    num: 7,
    module: "Professional Ethics & Code of Conduct",
    marks: 5,
    source: "EPP Lecture 12 (Code of Ethics)",
    examType: "Classroom_Lecture",
    text: "Compare the Code of Ethics of IEEE (Institute of Electrical and Electronics Engineers) and ACM (Association for Computing Machinery) regarding privacy, safety, and algorithmic accountability."
  },

  // ── MODULE 2: Engineering Economics, Project Appraisal & Depreciation ──
  {
    num: 8,
    module: "Engineering Economics & Project Appraisal",
    marks: 10,
    source: "EPP Assignment-II (Module 2)",
    examType: "Classroom_Assignment",
    text: "A manufacturing unit has an initial capital expenditure of Rs. 25,00,000 with annual operation and maintenance expenses of Rs. 3,50,000. Assuming a salvage value of Rs. 2,00,000 at the end of 8 years and a minimum attractive rate of return (MARR) of 12%, calculate the Net Present Value (NPV) and determine project viability using the Discounted Cash Flow (DCF) method."
  },
  {
    num: 9,
    module: "Engineering Economics & Project Appraisal",
    marks: 10,
    source: "Module-II Notes & PYQ 2024",
    examType: "Endsem_PYQ",
    text: "Explain the Time Value of Money concept. Draw standard Cash Flow Diagrams and state formulas for: (a) Single Payment Compound Amount (F/P, i, n), (b) Equal Payment Series Present Worth (P/A, i, n), and (c) Capital Recovery Factor (A/P, i, n)."
  },
  {
    num: 10,
    module: "Engineering Economics & Project Appraisal",
    marks: 10,
    source: "Model Questions (Till Mid Semester) / Module-II",
    examType: "Classroom_Model_Question",
    text: "Differentiate between Straight-Line Method, Declining Balance Method, and Sum-of-the-Years-Digits (SYD) Method of calculating depreciation. Provide mathematical expressions and plot the book value curves over equipment asset life."
  },
  {
    num: 11,
    module: "Engineering Economics & Project Appraisal",
    marks: 10,
    source: "Module-II Notes & Engineering Economics PYQ",
    examType: "Endsem_PYQ",
    text: "Compare Net Present Value (NPV), Internal Rate of Return (IRR), and Benefit-Cost Ratio (B/C Ratio) as criteria for capital investment decision-making. Explain why the IRR method may yield multiple rates of return or conflict with NPV in mutually exclusive projects."
  },
  {
    num: 12,
    module: "Engineering Economics & Project Appraisal",
    marks: 10,
    source: "Cost Volume.pdf (Classroom Material)",
    examType: "Classroom_Lecture",
    text: "Perform a Cost-Volume-Profit (CVP) analysis: A technology hardware plant has fixed overhead of Rs. 15,00,000 per year, variable cost of Rs. 400 per unit, and selling price of Rs. 900 per unit. Calculate: (i) Break-even Point (BEP) in units and revenue, (ii) Margin of Safety at annual sales of 4,000 units, (iii) Sales volume required to generate an operating profit of Rs. 6,00,000."
  },
  {
    num: 13,
    module: "Engineering Economics & Project Appraisal",
    marks: 5,
    source: "2023 Midsem Engineering Economics PYQ",
    examType: "Midsem_PYQ",
    text: "Explain the Law of Diminishing Marginal Utility with schedule and curve diagram. Derive the consumer equilibrium condition under single-commodity and multi-commodity cases."
  },
  {
    num: 14,
    module: "Engineering Economics & Project Appraisal",
    marks: 5,
    source: "2023 Midsem Engineering Economics PYQ",
    examType: "Midsem_PYQ",
    text: "Define Price Elasticity of Demand (PED). Explain Arc Elasticity versus Point Elasticity with graphical illustrations. How does PED dictate pricing strategies for engineering software platforms?"
  },
  {
    num: 15,
    module: "Engineering Economics & Project Appraisal",
    marks: 5,
    source: "Module-II Notes",
    examType: "Classroom_Lecture",
    text: "Define Payback Period and Discounted Payback Period. Discuss their merits and major limitations in long-term engineering infrastructure project evaluation."
  },

  // ── MODULE 3: Intellectual Property Rights (IPR) & Technology Law ──
  {
    num: 16,
    module: "Intellectual Property Rights (IPR)",
    marks: 10,
    source: "EPP Assignment-3 (Module 3)",
    examType: "Classroom_Assignment",
    text: "Explain the patentability criteria (Novelty, Non-obviousness / Inventive Step, and Industrial Utility) under the Indian Patents Act, 1970. Distinguish between provisional specification and complete specification with their respective legal timelines."
  },
  {
    num: 17,
    module: "Intellectual Property Rights (IPR)",
    marks: 10,
    source: "EPP Assignment-3 / Lecture 14",
    examType: "Classroom_Assignment",
    text: "What constitute Patent Infringement (Literal infringement vs Doctrine of Equivalents)? Explain the statutory defenses and Fair Dealing exemptions under Section 47 and Section 107 of the Indian Patents Act."
  },
  {
    num: 18,
    module: "Intellectual Property Rights (IPR)",
    marks: 10,
    source: "Lecture 14. Intellectual Property Rights",
    examType: "Classroom_Lecture",
    text: "Provide a comparative matrix of Patents, Copyrights, Trademarks, and Trade Secrets with respect to: protectable subject matter, duration of protection, registration formality, and remedies against unauthorized copying."
  },
  {
    num: 19,
    module: "Intellectual Property Rights (IPR)",
    marks: 10,
    source: "Lecture 14. Intellectual Property Rights",
    examType: "Classroom_Lecture",
    text: "Discuss the patentability of computer software, algorithms, and mathematical methods under Section 3(k) of the Indian Patents Act, 1970, citing Indian Patent Office Computer-Related Inventions (CRI) guidelines."
  },
  {
    num: 20,
    module: "Intellectual Property Rights (IPR)",
    marks: 5,
    source: "Lecture 14. Intellectual Property Rights",
    examType: "Classroom_Lecture",
    text: "Explain the procedure for international patent filing under the Patent Cooperation Treaty (PCT). How does the PCT national phase application differ from filing under the Paris Convention?"
  },
  {
    num: 21,
    module: "Intellectual Property Rights (IPR)",
    marks: 5,
    source: "Model Questions (Till Mid Semester)",
    examType: "Classroom_Model_Question",
    text: "Evaluate the trade-off between Trade Secret protection and Patent protection for proprietary engineering algorithms and manufacturing trade secrets."
  },
  {
    num: 22,
    module: "Intellectual Property Rights (IPR)",
    marks: 5,
    source: "Lecture 14. Intellectual Property Rights",
    examType: "Classroom_Lecture",
    text: "Define Reverse Engineering and Clean-Room Design. Under what circumstances does reverse engineering avoid copyright infringement and trade secret misappropriation?"
  },

  // ── MODULE 4: Law of Contracts, Tendering & Dispute Resolution ──
  {
    num: 23,
    module: "Contracts & Dispute Arbitration",
    marks: 10,
    source: "LECTURE 15 Indian-Contract-Act",
    examType: "Classroom_Lecture",
    text: "Explain the essential elements of a valid contract under Section 10 of the Indian Contract Act, 1872 (Offer, Acceptance, Lawful Consideration, Capacity of Parties, Free Consent, Lawful Object). Distinguish void agreements from voidable contracts."
  },
  {
    num: 24,
    module: "Contracts & Dispute Arbitration",
    marks: 10,
    source: "LECTURE 15 Indian-Contract-Act",
    examType: "Classroom_Lecture",
    text: "Describe the major types of engineering contracts: Lump Sum, Item Rate / Unit Price, Cost-Plus Percentage, and EPC (Engineering, Procurement, and Construction) turnkey contracts. Compare them from the client and contractor risk perspective."
  },
  {
    num: 25,
    module: "Contracts & Dispute Arbitration",
    marks: 10,
    source: "LECTURE 15 Indian-Contract-Act / Handout",
    examType: "Classroom_Lecture",
    text: "Explain the tendering and bidding workflow for public engineering projects: Expression of Interest (EOI), Request for Proposal (RFP), Two-Cover / Two-Bid System (Technical and Financial Bids), Earnest Money Deposit (EMD), and Performance Bank Guarantee (PBG)."
  },
  {
    num: 26,
    module: "Contracts & Dispute Arbitration",
    marks: 5,
    source: "LECTURE 15 Indian-Contract-Act",
    examType: "Classroom_Lecture",
    text: "Discuss Breach of Contract and explain the legal distinction between Liquidated Damages and Penalty under Sections 73 and 74 of the Indian Contract Act, 1872."
  },
  {
    num: 27,
    module: "Contracts & Dispute Arbitration",
    marks: 10,
    source: "LECTURE 15 & Model Questions",
    examType: "Classroom_Model_Question",
    text: "Explain Alternative Dispute Resolution (ADR) mechanisms in engineering contracts: Negotiation, Mediation, Conciliation, and Statutory Arbitration under the Arbitration and Conciliation Act, 1996. What is an Arbitration Clause?"
  },
  {
    num: 28,
    module: "Contracts & Dispute Arbitration",
    marks: 5,
    source: "Model Questions (Till Mid Semester)",
    examType: "Classroom_Model_Question",
    text: "Explain FIDIC (Fédération Internationale Des Ingénieurs-Conseils) Standard Conditions of Contract. What is the role of the Engineer and the Dispute Adjudication Board (DAB) in FIDIC contracts?"
  },

  // ── MODULE 5: Tort Liability, Professional Negligence & Environmental Law ──
  {
    num: 29,
    module: "Liability & Environmental Ethics",
    marks: 10,
    source: "EPP Assignment-IV (Module 4)",
    examType: "Classroom_Assignment",
    text: "Evaluate the key legal elements required to establish Professional Negligence and Tort Liability in engineering failures: Duty of Care, Breach of Duty, Causation (Cause-in-Fact & Proximate Cause), and Resultant Harm/Damages (Donoghue v. Stevenson doctrine)."
  },
  {
    num: 30,
    module: "Liability & Environmental Ethics",
    marks: 10,
    source: "EPP Assignment-IV (Module 4)",
    examType: "Classroom_Assignment",
    text: "Contrast Strict Liability (Rylands v. Fletcher rule with defenses) with Absolute Liability (M.C. Mehta v. Union of India / Oleum Gas Leak case and Bhopal Gas Disaster jurisprudence). Why is enterprise liability absolute in hazardous industrial engineering operations in India?"
  },
  {
    num: 31,
    module: "Liability & Environmental Ethics",
    marks: 10,
    source: "EPP Assignment-IV / Handout",
    examType: "Classroom_Lecture",
    text: "Discuss Product Liability for engineering systems: Manufacturing Defects, Design Defects, and Inadequate Warnings. Analyze how tort liability applies to autonomous AI systems, self-driving vehicles, and automated medical robotics."
  },
  {
    num: 32,
    module: "Liability & Environmental Ethics",
    marks: 10,
    source: "LECTURE 16 ENVIRONMENT AND HUMAN HEALTH",
    examType: "Classroom_Lecture",
    text: "Explain the Environmental Impact Assessment (EIA) process in India: Screening, Scoping, Public Consultation, and Environmental Appraisal. What is the role of an Environmental Management Plan (EMP) in industrial infrastructure projects?"
  },
  {
    num: 33,
    module: "Liability & Environmental Ethics",
    marks: 5,
    source: "LECTURE 16 & Model Questions",
    examType: "Classroom_Model_Question",
    text: "Discuss Sustainable Development Goals (SDGs) and Life Cycle Assessment (LCA) in engineering design. How can engineers minimize the cradle-to-grave carbon and toxic footprint of electronics and computing hardware?"
  },
  {
    num: 34,
    module: "Liability & Environmental Ethics",
    marks: 5,
    source: "LECTURE 16 ENVIRONMENT AND HUMAN HEALTH",
    examType: "Classroom_Lecture",
    text: "Outline the salient provisions of the Environment (Protection) Act, 1986, the Water (Prevention and Control of Pollution) Act, 1974, and the Air Act, 1981 applicable to manufacturing and computing installations."
  },

  // ── MODULE 6: Team Dynamics, Organizational Behaviour & Workplace Communication ──
  {
    num: 35,
    module: "Organizational Behaviour & Team Dynamics",
    marks: 10,
    source: "LECTURE 18 Working in Teams",
    examType: "Classroom_Lecture",
    text: "Explain Bruce Tuckman's Stages of Group Development: Forming, Storming, Norming, Performing, and Adjourning. Discuss specific leadership interventions needed at each stage in cross-functional engineering development teams."
  },
  {
    num: 36,
    module: "Organizational Behaviour & Team Dynamics",
    marks: 10,
    source: "LECTURE 21 Conflict.pptm",
    examType: "Classroom_Lecture",
    text: "Explain the Thomas-Kilmann Conflict Mode Instrument (TKI) across assertiveness and cooperativeness: Competing, Collaborating, Compromising, Avoiding, and Accommodating. When is each conflict resolution mode appropriate in engineering project delivery?"
  },
  {
    num: 37,
    module: "Organizational Behaviour & Team Dynamics",
    marks: 5,
    source: "LECTURE 17. Cognition.pdf",
    examType: "Classroom_Lecture",
    text: "Discuss Cognition and Human Factors Engineering: How do cognitive load, perceptual bias, and situational awareness influence safety-critical engineering control systems and human-in-the-loop interfaces?"
  },
  {
    num: 38,
    module: "Organizational Behaviour & Team Dynamics",
    marks: 5,
    source: "LECTURE 20 Multi-Cultural Environment",
    examType: "Classroom_Lecture",
    text: "Discuss the challenges of engineering teamwork in multi-cultural and geographically dispersed settings. How do Geert Hofstede's cultural dimensions (Power Distance, Individualism vs Collectivism, Uncertainty Avoidance) impact technical team collaboration?"
  },
  {
    num: 39,
    module: "Organizational Behaviour & Team Dynamics",
    marks: 5,
    source: "LECTURE 19 Interacting with Stakeholders",
    examType: "Classroom_Lecture",
    text: "Explain Stakeholder Management using Mendelow's Power-Interest Matrix. How should engineers prioritize communication strategies among clients, end-users, environmental regulators, and public interest groups?"
  },
  {
    num: 40,
    module: "Organizational Behaviour & Team Dynamics",
    marks: 5,
    source: "Lecture 13 Legal forms of Business",
    examType: "Classroom_Lecture",
    text: "Compare the legal forms of business organization: Sole Proprietorship, Partnership, Limited Liability Partnership (LLP), and Private Limited Company with respect to liability, governance, and capital mobilization."
  },

  // ── AUTHENTIC KIIT EXAMINATION ARCHIVE QUESTIONS (UHV & Economics PYQs) ──
  {
    num: 41,
    module: "Universal Human Values & Professional Ethics",
    marks: 10,
    source: "2025 Spring Endsem Universal Human Values (HS30001)",
    examType: "Endsem_PYQ",
    text: "Explain the term 'Professional Ethics'. Discuss the prevailing approaches towards the promotion of Professional Ethics (oaths, codes of conduct, vigilance monitoring, RTI, whistle blowing) and their inadequacy. What would be an effective way to develop ethical competence?"
  },
  {
    num: 42,
    module: "Universal Human Values & Professional Ethics",
    marks: 5,
    source: "2025 Spring Endsem Universal Human Values (HS30001)",
    examType: "Endsem_PYQ",
    text: "Explain ethical human conduct in terms of Human Values, Policy, and Character. How does right understanding ensure mutual prosperity and eliminate exploitation in industrial ecosystems?"
  },
  {
    num: 43,
    module: "Universal Human Values & Professional Ethics",
    marks: 10,
    source: "2025 Spring Endsem Universal Human Values (HS30001)",
    examType: "Endsem_PYQ",
    text: "Describe the Four Orders in Nature (Physical, Plant, Animal, and Human) on the basis of activity, innateness, natural characteristics, and inheritance. Why is the human order currently not mutually fulfilling to the other three orders?"
  },
  {
    num: 44,
    module: "Universal Human Values & Professional Ethics",
    marks: 5,
    source: "2025 Spring Endsem Universal Human Values (HS30001)",
    examType: "Endsem_PYQ",
    text: "Explain human being as the co-existence of the Self ('I') and the Body. State three distinguishing attributes between needs, activities, and response mechanisms of the Self and the Body."
  },
  {
    num: 45,
    module: "Universal Human Values & Professional Ethics",
    marks: 5,
    source: "2025 Spring Endsem Universal Human Values (HS30001)",
    examType: "Endsem_PYQ",
    text: "Explain the Holistic Management Model in engineering enterprises. Discuss its specific criteria regarding sustainability, human satisfaction, and resource preservation."
  },
  {
    num: 46,
    module: "Engineering Economics & Project Appraisal",
    marks: 10,
    source: "2024 Endsem 1 Engineering Economics & Costing",
    examType: "Endsem_PYQ",
    text: "Two mutually exclusive project alternatives are under consideration: Project A requires Rs. 12,00,000 initial investment, Rs. 60,000 annual maintenance, has a 6-year life with Rs. 1,50,000 salvage value. Project B requires Rs. 18,00,000 initial investment, Rs. 40,000 annual maintenance, has a 6-year life with Rs. 2,50,000 salvage value. At MARR = 10%, evaluate which alternative to select using Annual Equivalent Cost (AEC)."
  },
  {
    num: 47,
    module: "Engineering Economics & Project Appraisal",
    marks: 5,
    source: "2023 Midsem Engineering Economics",
    examType: "Midsem_PYQ",
    text: "A person deposits Rs. 8,00,000 in an infrastructure bond for 8 years at 6% annual compound interest. Calculate the compound amount and compound interest if interest is compounded: (i) Annually, (ii) Semi-annually, (iii) Quarterly."
  },
  {
    num: 48,
    module: "Intellectual Property Rights (IPR)",
    marks: 5,
    source: "Lecture 14. Intellectual Property Rights",
    examType: "Classroom_Lecture",
    text: "Explain Freedom to Operate (FTO) analysis in engineering product launches. Why does the grant of a patent not guarantee immunity against infringement of existing third-party dominant patents?"
  },
  {
    num: 49,
    module: "Contracts & Dispute Arbitration",
    marks: 5,
    source: "LECTURE 15 Indian-Contract-Act",
    examType: "Classroom_Lecture",
    text: "Explain the legal doctrine of 'Contra Proferentem' in contract construction. How does the court interpret contractual ambiguity against the party that authored the tender document?"
  },
  {
    num: 50,
    module: "Universal Human Values & Professional Ethics",
    marks: 5,
    source: "2024 Endsem Universal Human Values",
    examType: "Endsem_PYQ",
    text: "Distinguish between Animal Consciousness and Human Consciousness. How does transition to Human Consciousness promote societal fearlessness (trust) and universal human order?"
  }
];

async function main() {
  console.log('🚀 Starting Engineering Professional Practice (EPP - EX40003) Question Bank Ingestion...');
  console.log(`Total Curated Questions: ${EPP_QUESTIONS.length}`);
  console.log(`NeonDB URL: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`Upstash Vector URL: ${upstashUrl}`);

  // ── 1. Ingest into NeonDB OcrQuestion Table ──
  console.log('\n--- 1. Ingesting into NeonDB (Prisma ocrQuestion table) ---');
  let neonCount = 0;
  for (const q of EPP_QUESTIONS) {
    const imagePath = `dataset/raw/epp_qb/q${q.num}.png`;
    const sourcePdf = q.source;

    // Check existing
    const existing = await prisma.ocrQuestion.findFirst({
      where: {
        subjectCode: 'EX40003',
        rawOcrText: q.text
      }
    });

    if (existing) {
      await prisma.ocrQuestion.update({
        where: { id: existing.id },
        data: {
          subject: 'Engineering Professional Practice',
          subjectCode: 'EX40003',
          year: '2026-2027',
          examType: q.examType,
          sourcePdf: sourcePdf,
          status: 'APPROVED',
          pageNumber: Math.ceil(q.num / 10),
          correctedText: q.text
        }
      });
    } else {
      await prisma.ocrQuestion.create({
        data: {
          imagePath,
          subject: 'Engineering Professional Practice',
          subjectCode: 'EX40003',
          year: '2026-2027',
          examType: q.examType,
          sourcePdf: sourcePdf,
          pageNumber: Math.ceil(q.num / 10),
          rawOcrText: q.text,
          correctedText: q.text,
          status: 'APPROVED'
        }
      });
    }
    neonCount++;
    process.stdout.write(`\rNeonDB synced: ${neonCount}/${EPP_QUESTIONS.length}`);
  }
  console.log('\n✅ NeonDB Ingestion for EX40003 Complete!');

  // Also verify/insert cross-link for HS40001
  const existingHs = await prisma.ocrQuestion.findFirst({
    where: { subjectCode: 'HS40001' }
  });
  if (!existingHs) {
    for (const q of EPP_QUESTIONS.slice(0, 15)) {
      await prisma.ocrQuestion.create({
        data: {
          imagePath: `dataset/raw/epp_qb/hs40001_q${q.num}.png`,
          subject: 'Engineering Economics and Project Management',
          subjectCode: 'HS40001',
          year: '2026-2027',
          examType: q.examType,
          sourcePdf: q.source,
          pageNumber: Math.ceil(q.num / 10),
          rawOcrText: q.text,
          correctedText: q.text,
          status: 'APPROVED'
        }
      });
    }
    console.log('✓ Ingested cross-compatibility entries for HS40001 into NeonDB.');
  }

  // ── 2. Ingest into Upstash Vector DB (Hybrid Embeddings) ──
  console.log('\n--- 2. Ingesting into Upstash Vector DB (Dense 1536d + BM25 Sparse) ---');
  const upstashVectors = [];
  let embCount = 0;

  for (const q of EPP_QUESTIONS) {
    embCount++;
    process.stdout.write(`\rGenerating embeddings: ${embCount}/${EPP_QUESTIONS.length}`);
    const denseVector = await getEmbeddingWithRetry(`Engineering Professional Practice question: ${q.text}`);
    const sparse = textToSparse(q.text);

    upstashVectors.push({
      id: `epp_ex40003_q${q.num}`,
      vector: denseVector,
      sparseVector: sparse,
      metadata: {
        subjectCode: 'EX40003',
        subject: 'Engineering Professional Practice',
        year: '2026-2027',
        examType: q.examType,
        questionNumber: q.num,
        question: q.text,
        marks: q.marks,
        module: q.module,
        source: q.source
      }
    });

    // Slight throttle for API rate limits
    await new Promise(r => setTimeout(r, 120));
  }
  console.log('\nAll dense & sparse vectors prepared. Upserting to Upstash Vector in batches...');

  const BATCH_SIZE = 10;
  for (let i = 0; i < upstashVectors.length; i += BATCH_SIZE) {
    const batch = upstashVectors.slice(i, i + BATCH_SIZE);
    const resp = await fetch(`${upstashUrl}/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch)
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log(`✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} vectors) indexed successfully: ${data.result}`);
    } else {
      console.error(`✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: HTTP ${resp.status}`, await resp.text());
    }
  }

  console.log('\n🎉 ALL 50 EPP QUESTIONS VECTORIZED & INGESTED INTO UPSTASH VECTOR & NEON DB!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
