/**
 * Upstash Redis & Upstash Vector Unified REST Client
 * Zero external native dependencies — runs on Next.js server, edge, and routes.
 */

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  "https://creative-bass-185678.upstash.io";
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "gQAAAAAAAtVOAAIgcDJlYTMzMmE1MmE0NDA0YWQ4OTI5NzYwZGNhZGY2YWVlZQ";

const VECTOR_URL =
  process.env.UPSTASH_VECTOR_REST_URL ||
  "https://healthy-gannet-73484-us1-vector.upstash.io";
const VECTOR_TOKEN =
  process.env.UPSTASH_VECTOR_REST_TOKEN ||
  "ABgFMGhlYWx0aHktZ2FubmV0LTczNDg0LXVzMWFkbWluTVRabVltVXpNVGt0TkRjeFl5MDBNVGsxTFdFNU1tVXRaV0k0WlRZeE5UTmtaRGt4";

// ── REDIS CLIENT ─────────────────────────────────────────────────────────────
async function redisCommand<T = any>(command: any[]): Promise<T> {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upstash Redis error [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Upstash Redis error: ${data.error}`);
  }
  return data.result as T;
}

export const upstashRedis = {
  async get<T = any>(key: string): Promise<T | null> {
    const raw = await redisCommand<string | null>(["GET", key]);
    if (raw === null || raw === undefined) return null;
    try {
      let parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      while (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
      }
      return parsed as T;
    } catch {
      return raw as unknown as T;
    }
  },

  async set(key: string, value: any, options?: { ex?: number }): Promise<boolean> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const cmd: any[] = ["SET", key, serialized];
    if (options?.ex) {
      cmd.push("EX", options.ex);
    }
    const res = await redisCommand<string>(cmd);
    return res === "OK";
  },

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await redisCommand<number>(["DEL", ...keys]);
  },

  async keys(pattern: string): Promise<string[]> {
    return await redisCommand<string[]>(["KEYS", pattern]);
  },

  async lpush(key: string, ...values: any[]): Promise<number> {
    const serialized = values.map((v) =>
      typeof v === "string" ? v : JSON.stringify(v)
    );
    return await redisCommand<number>(["LPUSH", key, ...serialized]);
  },

  async rpush(key: string, ...values: any[]): Promise<number> {
    const serialized = values.map((v) =>
      typeof v === "string" ? v : JSON.stringify(v)
    );
    return await redisCommand<number>(["RPUSH", key, ...serialized]);
  },

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const rawList = await redisCommand<string[]>(["LRANGE", key, start, stop]);
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item) => {
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    });
  },

  async lrem(key: string, count: number, value: any): Promise<number> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    return await redisCommand<number>(["LREM", key, count, serialized]);
  },

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return await redisCommand<number>(["SADD", key, ...members]);
  },

  async smembers(key: string): Promise<string[]> {
    return await redisCommand<string[]>(["SMEMBERS", key]);
  },

  async srem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return await redisCommand<number>(["SREM", key, ...members]);
  },
};

// ── VECTOR CLIENT ────────────────────────────────────────────────────────────
export interface UpstashVectorItem {
  id: string;
  vector?: number[];
  data?: string; // Automatically embedded if vector index has hybrid / embedding model
  metadata?: Record<string, any>;
}

export const upstashVector = {
  async upsert(items: UpstashVectorItem | UpstashVectorItem[]): Promise<boolean> {
    const payload = Array.isArray(items) ? items : [items];
    const res = await fetch(`${VECTOR_URL}/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VECTOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upstash Vector upsert error: ${err}`);
    }
    const data = await res.json();
    return data.result === "Success";
  },

  async query(options: {
    vector?: number[];
    data?: string;
    topK?: number;
    includeMetadata?: boolean;
    includeVectors?: boolean;
    filter?: string;
  }): Promise<
    Array<{
      id: string;
      score: number;
      metadata?: any;
    }>
  > {
    const res = await fetch(`${VECTOR_URL}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VECTOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topK: options.topK || 5,
        includeMetadata: options.includeMetadata ?? true,
        includeVectors: options.includeVectors ?? false,
        filter: options.filter,
        ...(options.vector ? { vector: options.vector } : {}),
        ...(options.data ? { data: options.data } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upstash Vector query error: ${err}`);
    }
    const data = await res.json();
    return data.result || [];
  },

  async delete(ids: string | string[]): Promise<boolean> {
    const payload = Array.isArray(ids) ? ids : [ids];
    const res = await fetch(`${VECTOR_URL}/delete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VECTOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  },

  async info(): Promise<any> {
    const res = await fetch(`${VECTOR_URL}/info`, {
      method: "GET",
      headers: { Authorization: `Bearer ${VECTOR_TOKEN}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  },
};

// ── TYPES & STAGING MODELS ───────────────────────────────────────────────────
export type DocumentContentType =
  | "PYQ"
  | "NOTES"
  | "ASSIGNMENT"
  | "QUESTION_BANK"
  | "SYLLABUS";

export interface StagedQuestion {
  id: string;
  sourceDoc: string;
  pageNumber: number;
  contentType: DocumentContentType;
  subject: string;
  subjectCode: string;
  year: string;
  examType: string;
  questionNumber?: string;
  rawOcrText: string;
  cleanText: string;
  subParts?: string[];
  options?: string[];
  marks?: string | number;
  solution?: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  pageWidth?: number;
  pageHeight?: number;
  rotation?: number;
  imageUrl?: string;
  status: "PENDING_REVIEW" | "EDITED" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string;
}

