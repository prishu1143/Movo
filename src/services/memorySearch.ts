import { supabase } from "./supabase";

export type MemoryCandidate = {
  title: string;
  alternateTitles: string[];
  year: number | null;
  type: "movie" | "tv" | "unknown";
  confidence: number;
  reason: string;
  searchTerms: string[];
};

export type MemorySearchResponse = {
  interpretation: string;
  candidates: MemoryCandidate[];
};

export async function findMemoryCandidates(
  clue: string
): Promise<MemorySearchResponse> {
  const cleaned = clue.trim();

  if (!cleaned) {
    throw new Error("Write a few clues you remember first.");
  }

  const { data, error } = await supabase.functions.invoke("super-endpoint", {
    body: { clue: cleaned },
  });

  if (error) {
    throw new Error(
      error.message ||
        "Movo's memory search is not connected yet. Deploy the memory-search function in Supabase."
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("Memory search returned an invalid response.");
  }

  const response = data as Partial<MemorySearchResponse>;

  if (
    typeof response.interpretation !== "string" ||
    !Array.isArray(response.candidates)
  ) {
    throw new Error("Memory search returned an incomplete response.");
  }

  const candidates: MemoryCandidate[] = response.candidates
    .filter(
      (candidate): candidate is MemoryCandidate =>
        Boolean(candidate) &&
        typeof candidate === "object" &&
        typeof candidate.title === "string" &&
        typeof candidate.confidence === "number" &&
        typeof candidate.reason === "string" &&
        Array.isArray(candidate.alternateTitles) &&
        Array.isArray(candidate.searchTerms)
    )
    .map((candidate): MemoryCandidate => ({
      title: candidate.title.trim(),
      alternateTitles: candidate.alternateTitles
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 4),
      year:
        typeof candidate.year === "number" &&
        Number.isInteger(candidate.year) &&
        candidate.year > 1800 &&
        candidate.year < 2200
          ? candidate.year
          : null,
      type:
        candidate.type === "movie" || candidate.type === "tv"
          ? candidate.type
          : "unknown",
      confidence: Math.max(0, Math.min(1, candidate.confidence)),
      reason: candidate.reason.trim(),
      searchTerms: candidate.searchTerms
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 4),
    }))
    .filter((candidate) => candidate.title.length > 0)
    .slice(0, 6);

  return {
    interpretation: response.interpretation.trim(),
    candidates,
  };
}
