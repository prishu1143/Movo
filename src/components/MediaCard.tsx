import "./MediaCard.css";

export type MediaType =
  | "Movie"
  | "TV"
  | "Anime"
  | "Documentary";

export interface MediaItem {
  id: number;
  title: string;
  year: number;
  type: MediaType;
  genres: string[];
  poster: string;
  rating?: number;
}

interface MediaCardProps {
  item: MediaItem;
  onWatched?: (item: MediaItem) => void;
  onWatchlist?: (item: MediaItem) => void;
  onSkip?: (item: MediaItem) => void;
}

function MediaCard({
  item,
  onWatched,
  onWatchlist,
  onSkip,
}: MediaCardProps) {
  return (
    <article className="media-card">
      <div className="media-poster">
        <img
          src={item.poster}
          alt={`${item.title} poster`}
          loading="lazy"
        />

        <div className="media-type">
          {item.type}
        </div>

        <div className="media-overlay">
          <div className="media-actions">
            <button
              className="media-action watched"
              onClick={() => onWatched?.(item)}
            >
              <span>✓</span>
              Watched
            </button>

            <button
              className="media-action watchlist"
              onClick={() => onWatchlist?.(item)}
            >
              <span>＋</span>
              Watchlist
            </button>

            <button
              className="media-action skip"
              onClick={() => onSkip?.(item)}
            >
              <span>×</span>
              Skip
            </button>
          </div>
        </div>
      </div>

      <div className="media-info">
        <div className="media-title-row">
          <h3>{item.title}</h3>

          {item.rating !== undefined && (
            <span className="media-rating">
              ★ {item.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="media-meta">
          <span>{item.year}</span>
          <span className="meta-dot">•</span>
          <span>{item.genres.slice(0, 2).join(" · ")}</span>
        </div>
      </div>
    </article>
  );
}

export default MediaCard;