const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type MemoryCandidate = {
  title: string;
  alternateTitles: string[];
  year: number | null;
  type: "movie" | "tv" | "unknown";
  confidence: number;
  reason: string;
  searchTerms: string[];
};

type MemoryResponse = {
  interpretation: string;
  candidates: MemoryCandidate[];
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normaliseCandidate(
  candidate: Partial<MemoryCandidate>,
): MemoryCandidate {
  return {
    title: typeof candidate.title === "string" ? candidate.title.trim() : "",
    alternateTitles: Array.isArray(candidate.alternateTitles)
      ? candidate.alternateTitles
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [],
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
    confidence: Math.max(
      0,
      Math.min(
        1,
        typeof candidate.confidence === "number" ? candidate.confidence : 0,
      ),
    ),
    reason:
      typeof candidate.reason === "string" ? candidate.reason.trim() : "",
    searchTerms: Array.isArray(candidate.searchTerms)
      ? candidate.searchTerms
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [],
  };
}

const denoRuntime = globalThis as typeof globalThis & {
  Deno: {
    env: {
      get(name: string): string | undefined;
    };
    serve(
      handler: (request: Request) => Response | Promise<Response>,
    ): void;
  };
};

denoRuntime.Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const groqKey = denoRuntime.Deno.env.get("GROQ_API_KEY");

  if (!groqKey) {
    return json({ error: "GROQ_API_KEY is not configured." }, 500);
  }

  let body: { clue?: unknown };

  try {
    body = (await request.json()) as { clue?: unknown };
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const clue = typeof body.clue === "string" ? body.clue.trim() : "";

  if (!clue) {
    return json({ error: "A memory clue is required." }, 400);
  }

  if (clue.length > 1200) {
    return json(
      { error: "Memory clues are limited to 1200 characters." },
      400,
    );
  }

  const model = "openai/gpt-oss-120b";

  const systemPrompt = `You are Movo's movie-memory assistant.

Your job is to interpret a user's vague recollection of a movie or TV show and propose a small ranked list of real title candidates that can later be verified against TMDb.

Important rules:
- The user may remember only plot fragments, scenes, characters, visual details, approximate time period, language, country, genre, or where they watched it.
- Think broadly enough to handle imperfect or partially wrong memories.
- Prefer real titles that plausibly match the clues.
- Never pretend certainty. Confidence is only a ranking signal, not proof.
- Return at most 6 candidates.
- Use the canonical title when you know it and put common alternate/original titles in alternateTitles.
- searchTerms must be short title-search strings useful for a metadata database such as TMDb. Do not put full plot descriptions there.
- reason should briefly explain why the candidate matches the clues.
- Do not add a title merely because it is popular.
- If the clues are vague, still return the best plausible candidates.
- Do not fabricate a year. Use null when unknown.
- type must be movie, tv, or unknown.
- Return ONLY valid JSON matching this shape:
{
  "interpretation": "short summary of what the user seems to remember",
  "candidates": [
    {
      "title": "string",
      "alternateTitles": ["string"],
      "year": 2000,
      "type": "movie",
      "confidence": 0.0,
      "reason": "string",
      "searchTerms": ["string"]
    }
  ]
}`;

  const userPrompt = `The user remembers:

${clue}

Interpret those clues and rank the most plausible real movie/TV candidates.`;

  let groqResponse: Response;

  try {
    groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 1400,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      },
    );
  } catch (error) {
    console.error("Groq request failed:", error);
    return json(
      { error: "Unable to reach the free Memory AI service." },
      502,
    );
  }

  if (!groqResponse.ok) {
    const details = await groqResponse.text();
    console.error("Groq memory-search error:", details);

    return json(
      {
        error:
          groqResponse.status === 429
            ? "Memory AI is temporarily rate-limited. Please try again later."
            : "The free Memory AI service returned an error.",
      },
      502,
    );
  }

  const payload = (await groqResponse.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const outputText = payload.choices?.[0]?.message?.content?.trim() ?? "";

  if (!outputText) {
    return json(
      { error: "Memory AI returned no usable result." },
      502,
    );
  }

  let parsed: {
    interpretation?: unknown;
    candidates?: unknown;
  };

  try {
    parsed = JSON.parse(outputText) as {
      interpretation?: unknown;
      candidates?: unknown;
    };
  } catch (error) {
    console.error("Failed to parse Groq memory response:", error);
    return json(
      { error: "Memory AI returned malformed candidate data." },
      502,
    );
  }

  if (
    typeof parsed.interpretation !== "string" ||
    !Array.isArray(parsed.candidates)
  ) {
    return json(
      { error: "Memory AI returned incomplete candidate data." },
      502,
    );
  }

  const candidates = parsed.candidates
    .filter(
      (candidate): candidate is Partial<MemoryCandidate> =>
        Boolean(candidate) && typeof candidate === "object",
    )
    .map(normaliseCandidate)
    .filter((candidate) => candidate.title.length > 0)
    .slice(0, 6);

  const result: MemoryResponse = {
    interpretation: parsed.interpretation.trim().slice(0, 280),
    candidates,
  };

  return json(result);
});
