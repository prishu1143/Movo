const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
}

export interface TmdbMovieSearchResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

if (!TMDB_API_KEY) {
  console.warn(
    "TMDb API key is missing. Make sure VITE_TMDB_API_KEY exists in .env."
  );
}

async function tmdbRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDb API key is missing.");
  }

  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...params,
  });

  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `TMDb request failed with status ${response.status}.`
    );
  }

  return response.json() as Promise<T>;
}

export async function searchMovies(
  query: string
): Promise<TmdbMovie[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const data = await tmdbRequest<TmdbMovieSearchResponse>(
    "/search/movie",
    {
      query: trimmedQuery,
      language: "en-US",
      include_adult: "false",
      page: "1",
    }
  );

  return data.results;
}

export async function discoverMovies(): Promise<TmdbMovie[]> {
  const data = await tmdbRequest<TmdbMovieSearchResponse>(
    "/discover/movie",
    {
      language: "en-US",
      include_adult: "false",
      include_video: "false",
      sort_by: "popularity.desc",
      page: "1",
      vote_count_gte: "100",
    }
  );

  return data.results;
}

export function getTmdbImageUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" | "original" = "w500"
): string {
  if (!path) {
    return "";
  }

  return `https://image.tmdb.org/t/p/${size}${path}`;
}