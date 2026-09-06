import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import "./App.css";
import MediaCard, { type MediaItem } from "./components/MediaCard";
import Auth from "./components/Auth";
import {
  discoverMovies,
  getTmdbImageUrl,
  type TmdbMovie,
} from "./services/tmdb";
import { supabase } from "./services/supabase";
import { findMemoryCandidates } from "./services/memorySearch";

type View =
  | "home"
  | "memory"
  | "watchlist"
  | "history"
  | "statistics"
  | "settings";

type UserMediaMeta = {
  watchedAt: string | null;
  watchCount: number;
};

type TmdbPageResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
};

type HomeFilters = {
  mediaType: string;
  yearFrom: string;
  yearTo: string;
  genre: string;
  country: string;
  language: string;
  minRating: string;
  certificationCountry: string;
  certification: string;
};

type HomeSearchFilters = {
  mediaType: "all" | "movie" | "tv";
  country: string;
  genre: string;
  language: string;
};

type CustomRatingKey =
  // Movie marks
  | "masterpiece"
  | "absolute-cinema"
  | "favourite"
  | "cult-classic"
  | "heartbreakingly-beautiful"
  | "forever-rewatchable"
  | "pure-nostalgia"
  | "comfort-movie"
  | "now-thats-what-you-call-a-thriller"
  | "actually-hilarious"
  | "so-bad-its-good"
  | "actually-scary"
  | "nightmare-fuel"
  | "adrenaline-rush"
  | "soul-crusher"
  | "made-me-believe"
  | "mind-bender"
  | "visual-magic"
  | "world-i-wish-i-lived-in"
  | "soundtrack-lives-rent-free"
  | "hidden-gem"
  | "emotionally-devastating"
  | "one-and-done"
  | "guilty-pleasure"
  | "disappointed"
  | "despite-what-anyone-says-i-like-it"
  | "so-much-praise-dont-get-the-hype"
  | "unpopular-opinion-it-sucks"
  | "overrated-as-fuck"
  | "perfect-to-the-minute-detail"
  | "defending-this-with-my-life"
  | "critics-were-wrong-actually"
  | "everyone-loves-it-not-me"
  | "this-is-my-roman-empire"
  | "quote-this-forever"
  // Series marks
  | "peak-television"
  | "this-show-owns-me"
  | "binge-until-sunrise"
  | "one-more-episode"
  | "perfect-arc"
  | "stuck-the-landing"
  | "legendary-characters"
  | "season-one-hooked-me"
  | "finale-broke-me"
  | "slow-burn-worth-it"
  | "comfort-series"
  | "rewatchable-series"
  | "cult-series"
  | "cancelled-too-soon"
  | "need-to-finish"
  | "started-strong-lost-me"
  | "finale-sucked-series"
  | "watched-once-forgot-series"
  | "should-have-ended-series"
  | "lost-the-plot-series"
  | "dragged-forever-series"
  | "it-fell-off"
  | "prestige-drama"
  | "sitcom-gold"
  | "mystery-box-addiction"
  | "romcom-champion"
  | "fantasy-would-move-there"
  | "sci-fi-big-brain"
  | "crime-series-crack"
  | "horror-kept-me-awake"
  | "documentary-feels"
  | "soundtrack-is-the-character"
  | "intro-never-skipped"
  | "quotes-lives-rent-free"
  | "internet-made-me-watch"
  | "everyone-was-talking-about-it"
  | "rewatched-before-the-reboot"
  | "core-memory-unlocked-series"
  | "peak-2010s-energy"
  | "early-2000s-comfort"
  | "we-are-so-back-series"
  | "main-character-energy-series"
  | "emotionally-held-hostage"
  | "ship-ruined-my-life-series"
  | "not-the-same-after-this-series"
  | "could-have-been-an-all-timer"
  | "overhyped-series"
  | "despite-the-hype-i-like-it-series"
  | "so-much-praise-no-idea-why-series"
  | "unpopular-opinion-series-sucks"
  | "defending-this-series-with-my-life"
  | "perfect-series-until-the-finale"
  | "this-series-is-my-roman-empire"
  // Anime marks
  | "superrrr"
  | "peak-anime"
  | "nakama-energy"
  | "fight-of-the-arc"
  | "power-up-was-insane"
  | "villain-stole-the-show"
  | "training-arc-approved"
  | "filler-what-filler"
  | "opening-never-skipped"
  | "ending-never-skipped"
  | "world-building-goes-hard"
  | "emotional-damage"
  | "anime-nostalgia"
  | "forever-rewatchable-anime"
  | "dropped-it"
  | "finale-sucked-anime"
  | "watched-once-forgot-anime"
  | "filler-hell"
  | "lost-the-sauce-anime"
  | "power-scaling-broke-anime"
  | "it-fell-off-anime"
  | "despite-the-hype-i-love-this-anime"
  | "this-anime-is-my-roman-empire"
  | "defending-this-anime-with-my-life"
  | "perfect-anime-until-the-ending"
  | "so-much-praise-i-dont-see-it-anime"
  | "unpopular-opinion-this-anime-sucks"
  | "shonen-goes-brrr"
  | "seinen-brain-food"
  | "romance-made-me-suffer"
  | "comedy-gag-master"
  | "horror-nope"
  | "isekai-i-would-actually-choose"
  | "mecha-metal-screams"
  | "sports-anime-hype"
  | "slice-of-life-healing"
  | "mystery-kept-me-guessing"
  | "villain-had-a-point"
  | "character-development-went-crazy"
  | "that-scene-broke-the-internet"
  | "op-is-on-repeat"
  | "ost-is-immaculate"
  | "peak-2000s-anime"
  | "childhood-core-memory"
  | "late-night-anime-runs"
  | "nostalgia-kick"
  | "cosplay-in-my-soul"
  | "meme-certified"
  | "we-are-so-back-anime"
  | "nah-id-win-anime"
  | "locked-in"
  | "agenda-approved"
  | "brotherhood-forever"
  | "not-the-same-after-this-anime"
  | "could-have-been-peak"
  | "overhyped-anime"
  | "background-watch-anime";
type CustomRatingDefinition = {
  key: CustomRatingKey;
  symbol: string;
  label: string;
  description: string;
  rank: number;
};

type CustomRatingProfile = "movie" | "series" | "anime";

const MOVIE_RATINGS: CustomRatingDefinition[] = [
  { key: "masterpiece", symbol: "✦", label: "Masterpiece", description: "A rare film that feels complete, lasting, and extraordinary.", rank: 130 },
  { key: "absolute-cinema", symbol: "◈", label: "Absolute Cinema", description: "The kind of filmmaking that reminds me why I love movies.", rank: 125 },
  { key: "favourite", symbol: "♥", label: "Favourite", description: "I have a special attachment to this one, beyond the score.", rank: 120 },
  { key: "cult-classic", symbol: "♜", label: "Cult Classic", description: "The kind of movie that grows its own devoted little world around it.", rank: 115 },
  { key: "heartbreakingly-beautiful", symbol: "❦", label: "Heartbreakingly Beautiful", description: "Beautiful in a way that hurts. I may love it more than I want to revisit it.", rank: 112 },
  { key: "forever-rewatchable", symbol: "↻", label: "Forever Rewatchable", description: "I could put this on again and again and still love it.", rank: 110 },
  { key: "pure-nostalgia", symbol: "⌁", label: "Pure Nostalgia", description: "It feels like a memory, an era, or a version of myself I want to visit again.", rank: 106 },
  { key: "comfort-movie", symbol: "⌂", label: "Comfort Movie", description: "A familiar place I can return to whenever I need it.", rank: 103 },
  { key: "now-thats-what-you-call-a-thriller", symbol: "!", label: "Now That's What You Call a Thriller", description: "Tension, momentum, dread — exactly what I want from a thriller.", rank: 100 },
  { key: "actually-hilarious", symbol: "≋", label: "Actually Hilarious", description: "It genuinely made me laugh instead of merely being called a comedy.", rank: 97 },
  { key: "so-bad-its-good", symbol: "⌁", label: "So Bad, It's Good", description: "It is gloriously terrible in exactly the right way.", rank: 95 },
  { key: "actually-scary", symbol: "☠", label: "Actually Scary", description: "It really got under my skin and made me uneasy.", rank: 94 },
  { key: "nightmare-fuel", symbol: "☽", label: "Nightmare Fuel", description: "The images, ideas, or atmosphere are going to stay with me at 2 a.m.", rank: 92 },
  { key: "adrenaline-rush", symbol: "ϟ", label: "Adrenaline Rush", description: "Pure momentum. I was locked in from start to finish.", rank: 90 },
  { key: "soul-crusher", symbol: "♢", label: "Soul Crusher", description: "It hit somewhere deep and left emotional damage behind.", rank: 88 },
  { key: "made-me-believe", symbol: "♡", label: "Made Me Believe", description: "For a while, it made love, people, or life feel a little more beautiful.", rank: 86 },
  { key: "mind-bender", symbol: "∞", label: "Mind-Bender", description: "The kind of story that makes me sit there afterwards and piece it together.", rank: 84 },
  { key: "visual-magic", symbol: "✧", label: "Visual Magic", description: "The imagery, animation, composition, or visual language is a huge part of the experience.", rank: 82 },
  { key: "world-i-wish-i-lived-in", symbol: "⌘", label: "World I Wish I Lived In", description: "I loved the world so much that I wanted to stay inside it.", rank: 80 },
  { key: "soundtrack-lives-rent-free", symbol: "♫", label: "Soundtrack Lives Rent-Free", description: "The music became part of the memory of the movie for me.", rank: 78 },
  { key: "hidden-gem", symbol: "◇", label: "Hidden Gem", description: "It deserves far more love than it seems to get.", rank: 74 },
  { key: "emotionally-devastating", symbol: "♡", label: "Emotionally Devastating", description: "It left a mark on me. Beautiful, painful, unforgettable, or all three.", rank: 70 },
  { key: "one-and-done", symbol: "→", label: "One & Done", description: "I value this movie, but once was enough for me.", rank: 55 },
  { key: "guilty-pleasure", symbol: "♢", label: "Guilty Pleasure", description: "I know exactly what it is, and I still enjoy it.", rank: 58 },
  { key: "despite-what-anyone-says-i-like-it", symbol: "♥", label: "Despite What Anyone Says, I Like It", description: "Maybe the discourse hates it. Maybe everyone says it is bad. I watched it and had a great time anyway.", rank: 54 },
  { key: "this-is-my-roman-empire", symbol: "∞", label: "This Is My Roman Empire", description: "I bring this movie up far more often than is probably reasonable.", rank: 50 },
  { key: "defending-this-with-my-life", symbol: "♜", label: "Defending This With My Life", description: "Say what you want. I have a prepared three-hour defense.", rank: 46 },
  { key: "quote-this-forever", symbol: "≋", label: "Quote This Forever", description: "The dialogue has permanently entered my vocabulary and brain.", rank: 42 },
  { key: "perfect-to-the-minute-detail", symbol: "✦", label: "Perfect to the Minute Detail", description: "Every little choice feels deliberate. Nothing feels accidentally there.", rank: 39 },
  { key: "critics-were-wrong-actually", symbol: "◈", label: "Critics Were Wrong, Actually", description: "The praise or criticism missed what worked for me. I saw something different in it.", rank: 34 },
  { key: "so-much-praise-dont-get-the-hype", symbol: "▽", label: "So Much Praise, I Don't Get the Hype", description: "I understand why people love it. I just cannot find the magic everyone else seems to see.", rank: 24 },
  { key: "everyone-loves-it-not-me", symbol: "▽", label: "Everyone Loves It, Not Me", description: "The consensus and my personal reaction are standing on completely different planets.", rank: 19 },
  { key: "unpopular-opinion-it-sucks", symbol: "╳", label: "Unpopular Opinion: It Sucks", description: "I know this is sacrilege to say, but I genuinely think it is bad.", rank: 14 },
  { key: "overrated-as-fuck", symbol: "╳", label: "Overrated as F*ck", description: "The reputation is doing far more work than the actual movie for me.", rank: 10 },
  { key: "disappointed", symbol: "▽", label: "Disappointed", description: "I expected more, especially because I cared about this one.", rank: 6 },
];

const SERIES_RATINGS: CustomRatingDefinition[] = [
  { key: "peak-television", symbol: "✦", label: "Peak Television", description: "This is the kind of long-form storytelling that sets the bar for TV.", rank: 140 },
  { key: "prestige-drama", symbol: "◈", label: "Prestige Drama", description: "The performances, writing, and direction all feel ridiculously locked in.", rank: 137 },
  { key: "this-show-owns-me", symbol: "♥", label: "This Show Owns Me", description: "I am emotionally invested. These characters and this world have me completely.", rank: 134 },
  { key: "we-are-so-back-series", symbol: "↗", label: "We Are So Back", description: "One episode and suddenly I remembered exactly why I loved this show.", rank: 132 },
  { key: "binge-until-sunrise", symbol: "↻", label: "Binge Until Sunrise", description: "I kept saying one more episode until it was suddenly morning.", rank: 128 },
  { key: "one-more-episode", symbol: "→", label: "One More Episode", description: "The kind of show that makes stopping feel impossible.", rank: 124 },
  { key: "perfect-arc", symbol: "◇", label: "Perfect Arc", description: "A storyline landed exactly where it needed to.", rank: 121 },
  { key: "stuck-the-landing", symbol: "◈", label: "Stuck the Landing", description: "The ending respected everything that came before it.", rank: 118 },
  { key: "legendary-characters", symbol: "♜", label: "Legendary Characters", description: "The characters are the reason this show stays with me.", rank: 115 },
  { key: "season-one-hooked-me", symbol: "!", label: "Season One Hooked Me", description: "The first season grabbed me and made the next episode feel mandatory.", rank: 112 },
  { key: "sitcom-gold", symbol: "≋", label: "Sitcom Gold", description: "The jokes, chemistry, and comfort factor are firing on all cylinders.", rank: 109 },
  { key: "mystery-box-addiction", symbol: "?", label: "Mystery Box Addiction", description: "I needed answers so badly that theories became part of the experience.", rank: 106 },
  { key: "crime-series-crack", symbol: "♢", label: "Crime Series Crack", description: "Every episode had me chasing the next clue, case, or bad decision.", rank: 103 },
  { key: "romcom-champion", symbol: "♡", label: "Rom-Com Champion", description: "The chemistry, chaos, and payoff worked exactly how I wanted.", rank: 101 },
  { key: "fantasy-would-move-there", symbol: "⌂", label: "Fantasy World I'd Move To", description: "The world-building was strong enough that I wanted an address there.", rank: 98 },
  { key: "sci-fi-big-brain", symbol: "∞", label: "Sci-Fi Big Brain", description: "It made me stare at the ceiling and rethink the rules of the universe.", rank: 96 },
  { key: "horror-kept-me-awake", symbol: "☽", label: "Horror Kept Me Awake", description: "The kind of horror that followed me after I turned the screen off.", rank: 94 },
  { key: "finale-broke-me", symbol: "♡", label: "Finale Broke Me", description: "The ending hit hard enough that I needed a minute afterwards.", rank: 92 },
  { key: "slow-burn-worth-it", symbol: "…", label: "Slow Burn Worth It", description: "It took its time, and the payoff made the patience worth it.", rank: 89 },
  { key: "comfort-series", symbol: "⌂", label: "Comfort Series", description: "A familiar world I can return to whenever I want company.", rank: 86 },
  { key: "rewatchable-series", symbol: "↺", label: "Forever Rewatchable", description: "I know what happens and still want to come back for the ride.", rank: 84 },
  { key: "early-2000s-comfort", symbol: "⌁", label: "Early-2000s Comfort", description: "It has that old-school TV feeling that instantly puts me in another era.", rank: 81 },
  { key: "peak-2010s-energy", symbol: "⌁", label: "Peak 2010s Energy", description: "The style, pacing, memes, and era-specific vibe hit a very particular sweet spot.", rank: 79 },
  { key: "core-memory-unlocked-series", symbol: "⌁", label: "Core Memory Unlocked", description: "It takes me straight back to a specific time in my life.", rank: 77 },
  { key: "internet-made-me-watch", symbol: "◌", label: "Internet Made Me Watch", description: "The discourse, clips, edits, or memes finally got me to press play.", rank: 74 },
  { key: "everyone-was-talking-about-it", symbol: "!", label: "Everyone Was Talking About It", description: "It became one of those shows that felt impossible to miss culturally.", rank: 71 },
  { key: "soundtrack-is-the-character", symbol: "♫", label: "Soundtrack Is the Character", description: "The music carries so much of the identity that the show feels incomplete without it.", rank: 68 },
  { key: "quotes-lives-rent-free", symbol: "≋", label: "Quotes Live Rent-Free", description: "I keep remembering lines from this long after the episode ends.", rank: 65 },
  { key: "intro-never-skipped", symbol: "▶", label: "Intro Never Skipped", description: "That opening became part of the ritual every time I watched.", rank: 62 },
  { key: "rewatched-before-the-reboot", symbol: "↺", label: "Rewatched Before the Reboot", description: "The announcement was all the excuse I needed to revisit the whole thing.", rank: 59 },
  { key: "cult-series", symbol: "♞", label: "Cult Series", description: "It has that special devoted following and identity of its own.", rank: 56 },
  { key: "cancelled-too-soon", symbol: "╳", label: "Cancelled Too Soon", description: "It had more story in it and deserved another season.", rank: 52 },
  { key: "need-to-finish", symbol: "⌛", label: "Need to Finish", description: "I am invested, but I still have episodes waiting for me.", rank: 48 },
  { key: "emotionally-held-hostage", symbol: "♧", label: "Emotionally Held Hostage", description: "I know this is stressing me out, yet I keep pressing Next Episode.", rank: 40 },
  { key: "ship-ruined-my-life-series", symbol: "♡", label: "This Ship Ruined My Life", description: "The relationship drama permanently altered my emotional stability.", rank: 37 },
  { key: "not-the-same-after-this-series", symbol: "∞", label: "Not the Same After This", description: "It changed the way I think about a genre, character, or story.", rank: 34 },
  { key: "started-strong-lost-me", symbol: "↘", label: "Started Strong, Lost Me", description: "The beginning had me; somewhere along the way it stopped working for me.", rank: 28 },
  { key: "finale-sucked-series", symbol: "╳", label: "Finale Sucked", description: "I made it all the way there and the ending still managed to fumble it.", rank: 24 },
  { key: "watched-once-forgot-series", symbol: "…", label: "Watched Once, Forgot It Existed", description: "I finished it, and somehow most of it disappeared from my brain immediately.", rank: 22 },
  { key: "should-have-ended-series", symbol: "⌛", label: "Should've Ended Earlier", description: "It had a good run, but it stayed on screen longer than the story deserved.", rank: 18 },
  { key: "lost-the-plot-series", symbol: "?", label: "Lost the Plot", description: "I stopped understanding where the story was going, and not in the fun way.", rank: 16 },
  { key: "dragged-forever-series", symbol: "→", label: "Dragged Forever", description: "Too much setup, too many episodes, not enough payoff.", rank: 13 },
  { key: "despite-the-hype-i-like-it-series", symbol: "♥", label: "Despite the Hype, I Like It", description: "The backlash made me expect worse. I watched it and actually enjoyed myself.", rank: 22 },
  { key: "so-much-praise-no-idea-why-series", symbol: "▽", label: "So Much Praise, No Idea Why", description: "I get that it is beloved. I just cannot find the thing everyone else is seeing.", rank: 18 },
  { key: "perfect-series-until-the-finale", symbol: "↘", label: "Perfect Until the Finale", description: "Almost flawless right up until the moment it had to stick the landing.", rank: 14 },
  { key: "defending-this-series-with-my-life", symbol: "♜", label: "Defending This With My Life", description: "I will happily argue for this show against the entire timeline.", rank: 12 },
  { key: "this-series-is-my-roman-empire", symbol: "∞", label: "This Series Is My Roman Empire", description: "I somehow bring it up in conversations where it has absolutely no business being mentioned.", rank: 9 },
  { key: "unpopular-opinion-series-sucks", symbol: "╳", label: "Unpopular Opinion: It Sucks", description: "I know the fanbase will disagree. I genuinely think the show is bad.", rank: 5 },
  { key: "overhyped-series", symbol: "▽", label: "Overhyped", description: "The cultural hype promised more than the actual show delivered for me.", rank: 3 },
  { key: "it-fell-off", symbol: "▽", label: "It Fell Off", description: "There was a point where the show stopped being what I loved about it.", rank: 1 },
];

const ANIME_RATINGS: CustomRatingDefinition[] = [
  { key: "peak-anime", symbol: "✦", label: "Peak Anime", description: "This is anime firing on every cylinder — storytelling, style, feeling, everything.", rank: 145 },
  { key: "superrrr", symbol: "★", label: "SUPERRRRR!", description: "Full Franky energy. I absolutely loved what I was watching.", rank: 142 },
  { key: "shonen-goes-brrr", symbol: "ϟ", label: "Shonen Goes Brrr", description: "Big fights, bigger emotions, and the kind of hype only battle anime can deliver.", rank: 138 },
  { key: "nakama-energy", symbol: "♥", label: "Nakama Energy", description: "The bonds between the characters are a huge part of why I love it.", rank: 135 },
  { key: "fight-of-the-arc", symbol: "ϟ", label: "Fight of the Arc", description: "A fight so good it became a memory of the whole show.", rank: 132 },
  { key: "power-up-was-insane", symbol: "↗", label: "Power-Up Was Insane", description: "That moment made me sit up and lose my mind a little.", rank: 129 },
  { key: "villain-stole-the-show", symbol: "☠", label: "Villain Stole the Show", description: "The antagonist became one of the best reasons to keep watching.", rank: 126 },
  { key: "villain-had-a-point", symbol: "☠", label: "Villain Had a Point", description: "I did not agree with them, but I absolutely understood why they believed they were right.", rank: 123 },
  { key: "training-arc-approved", symbol: "∞", label: "Training Arc Approved", description: "Give me the grind, the progression, and the payoff.", rank: 120 },
  { key: "character-development-went-crazy", symbol: "↗", label: "Character Development Went Crazy", description: "Somebody started one way and ended somewhere completely different in the best possible way.", rank: 117 },
  { key: "filler-what-filler", symbol: "→", label: "Filler? What Filler?", description: "Even the detours somehow kept me invested.", rank: 114 },
  { key: "sports-anime-hype", symbol: "🏁", label: "Sports Anime Hype", description: "A completely ordinary activity became the most important event in the universe.", rank: 111 },
  { key: "seinen-brain-food", symbol: "∞", label: "Seinen Brain Food", description: "The themes, psychology, or moral ambiguity gave me plenty to chew on.", rank: 108 },
  { key: "slice-of-life-healing", symbol: "⌂", label: "Slice-of-Life Healing", description: "Nothing needed to explode. I was perfectly happy just existing with these characters.", rank: 105 },
  { key: "romance-made-me-suffer", symbol: "♡", label: "Romance Made Me Suffer", description: "The feelings were immaculate and my emotional stability was not.", rank: 102 },
  { key: "comedy-gag-master", symbol: "≋", label: "Gag Master", description: "The comedy timing and running jokes actually landed for me.", rank: 99 },
  { key: "horror-nope", symbol: "☠", label: "Horror? Nope.", description: "It crossed the line from fun spooky to absolutely not, thank you.", rank: 96 },
  { key: "isekai-i-would-actually-choose", symbol: "⌂", label: "Isekai I'd Actually Choose", description: "For once, I would genuinely take the fantasy respawn offer.", rank: 93 },
  { key: "mecha-metal-screams", symbol: "⚙", label: "Mecha Metal Screams", description: "Giant robots, absurd stakes, and machinery that made my inner child very happy.", rank: 90 },
  { key: "mystery-kept-me-guessing", symbol: "?", label: "Mystery Kept Me Guessing", description: "I kept changing theories because the show refused to let me settle.", rank: 87 },
  { key: "opening-never-skipped", symbol: "♫", label: "Opening Never Skipped", description: "That opening became part of the experience.", rank: 84 },
  { key: "ending-never-skipped", symbol: "♪", label: "Ending Never Skipped", description: "I stayed through the credits because the ending was worth it.", rank: 82 },
  { key: "op-is-on-repeat", symbol: "♫", label: "OP Is on Repeat", description: "The opening song escaped the anime and took over my playlist.", rank: 79 },
  { key: "ost-is-immaculate", symbol: "♫", label: "OST Is Immaculate", description: "The soundtrack made scenes hit harder and memories stick longer.", rank: 76 },
  { key: "world-building-goes-hard", symbol: "⌘", label: "World-Building Goes Hard", description: "The lore and world were half the reason I was hooked.", rank: 73 },
  { key: "that-scene-broke-the-internet", symbol: "!", label: "That Scene Broke the Internet", description: "I still remember everyone talking about that moment.", rank: 70 },
  { key: "meme-certified", symbol: "≋", label: "Meme Certified", description: "It produced at least one moment I will never be able to see normally again.", rank: 67 },
  { key: "peak-2000s-anime", symbol: "⌁", label: "Peak 2000s Anime", description: "The visual style, soundtrack, pacing, and era-specific weirdness hit the nostalgia button perfectly.", rank: 64 },
  { key: "childhood-core-memory", symbol: "⌁", label: "Childhood Core Memory", description: "This one is welded to a part of growing up for me.", rank: 61 },
  { key: "late-night-anime-runs", symbol: "☾", label: "Late-Night Anime Runs", description: "It reminds me of staying up way too late just to watch one more episode.", rank: 58 },
  { key: "nostalgia-kick", symbol: "⌁", label: "Nostalgia Kick", description: "It instantly brought back a specific era, fandom, or feeling I had forgotten.", rank: 55 },
  { key: "anime-nostalgia", symbol: "⌁", label: "Pure Nostalgia", description: "It takes me straight back to an era of my life I still miss.", rank: 52 },
  { key: "forever-rewatchable-anime", symbol: "↻", label: "Forever Rewatchable", description: "I can revisit it even knowing every major beat.", rank: 50 },
  { key: "cosplay-in-my-soul", symbol: "✧", label: "Cosplay in My Soul", description: "The character designs were so good they permanently occupied my brain.", rank: 47 },
  { key: "locked-in", symbol: "◉", label: "Locked In", description: "Once the episode started, nothing else was getting my attention.", rank: 44 },
  { key: "agenda-approved", symbol: "★", label: "Agenda Approved", description: "I will defend this character, ship, arc, or opinion with unreasonable confidence.", rank: 41 },
  { key: "brotherhood-forever", symbol: "♥", label: "Brotherhood Forever", description: "The bonds and loyalty between characters are what made it special to me.", rank: 38 },
  { key: "we-are-so-back-anime", symbol: "↗", label: "We Are So Back", description: "A new episode dropped and suddenly the fandom was alive again.", rank: 35 },
  { key: "nah-id-win-anime", symbol: "ϟ", label: "Nah, I'd Win", description: "It gave me the exact kind of ridiculous confidence anime is supposed to create.", rank: 32 },
  { key: "not-the-same-after-this-anime", symbol: "∞", label: "Not the Same After This", description: "It permanently changed what I expect from anime or from a particular genre.", rank: 29 },
  { key: "emotional-damage", symbol: "♡", label: "Emotional Damage", description: "It hurt me, and I mean that as a compliment.", rank: 26 },
  { key: "dropped-it", symbol: "×", label: "Dropped It", description: "I lost the urge to keep going, even if I liked parts of it.", rank: 22 },
  { key: "finale-sucked-anime", symbol: "╳", label: "Finale Sucked", description: "After all that buildup, the ending left me wondering why I bothered.", rank: 19 },
  { key: "watched-once-forgot-anime", symbol: "…", label: "Watched Once, Forgot It Existed", description: "I finished it, blinked, and somehow forgot almost everything about it.", rank: 17 },
  { key: "filler-hell", symbol: "⌛", label: "Filler Hell", description: "There was so much padding that the actual story started feeling optional.", rank: 14 },
  { key: "lost-the-sauce-anime", symbol: "↘", label: "Lost the Sauce", description: "It had something special once, and then somehow it just disappeared.", rank: 12 },
  { key: "power-scaling-broke-anime", symbol: "↯", label: "Power Scaling Broke It", description: "The stakes stopped making sense and every new power-up felt like another reset button.", rank: 9 },
  { key: "despite-the-hype-i-love-this-anime", symbol: "♥", label: "Despite the Hype, I Love This", description: "The discourse can argue. I had a genuinely great time with it.", rank: 15 },
  { key: "this-anime-is-my-roman-empire", symbol: "∞", label: "This Anime Is My Roman Empire", description: "I keep finding excuses to bring it up because it lives permanently in my head.", rank: 12 },
  { key: "defending-this-anime-with-my-life", symbol: "♜", label: "Defending This With My Life", description: "I will defend this character, arc, or opinion until the credits roll on the argument.", rank: 10 },
  { key: "perfect-anime-until-the-ending", symbol: "↘", label: "Perfect Until the Ending", description: "Everything was landing beautifully until the final stretch lost me.", rank: 8 },
  { key: "so-much-praise-i-dont-see-it-anime", symbol: "▽", label: "So Much Praise, I Don't See It", description: "The fandom calls it peak. I kept waiting for the moment it clicked for me.", rank: 6 },
  { key: "unpopular-opinion-this-anime-sucks", symbol: "╳", label: "Unpopular Opinion: This Anime Sucks", description: "I know that is fighting words in some circles, but that is honestly how I felt.", rank: 4 },
  { key: "overhyped-anime", symbol: "▽", label: "Overhyped", description: "The fandom sold me something legendary and I found something merely fine.", rank: 2 },
  { key: "it-fell-off-anime", symbol: "▽", label: "It Fell Off", description: "Something changed and the magic stopped hitting the same.", rank: 1 },
];

const CUSTOM_RATINGS: CustomRatingDefinition[] = [
  ...MOVIE_RATINGS,
  ...SERIES_RATINGS,
  ...ANIME_RATINGS,
];

const CUSTOM_RATING_MAP = Object.fromEntries(CUSTOM_RATINGS.map((rating) => [rating.key, rating])) as Record<CustomRatingKey, CustomRatingDefinition>;

function getCustomRatingProfile(item: MediaItem): CustomRatingProfile {
  const contextual = item as MediaItem & { isAnime?: boolean };
  const rawType = String(item.type ?? "").toLowerCase();
  if (contextual.isAnime || rawType === "anime") return "anime";
  if (rawType === "movie") return "movie";
  return "series";
}

function getCustomRatingsForItem(item: MediaItem): CustomRatingDefinition[] {
  const profile = getCustomRatingProfile(item);
  if (profile === "anime") return ANIME_RATINGS;
  if (profile === "series") return SERIES_RATINGS;
  return MOVIE_RATINGS;
}

const CURRENT_YEAR = new Date().getFullYear();
const SAVED_LIST_YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, index) => CURRENT_YEAR - index);

type SavedListFilters = {
  type: string;
  genre: string;
  yearFrom: string;
  yearTo: string;
  customRating: string;
  sort:
    | "recent"
    | "oldest"
    | "title-asc"
    | "title-desc"
    | "year-desc"
    | "year-asc"
    | "rating-desc"
    | "rating-asc"
    | "custom-desc"
    | "custom-asc";
};

type MediaDetailPerson = {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profilePath?: string | null;
};

type MediaDetails = {
  id: number;
  type: "movie" | "tv";
  title: string;
  originalTitle: string;
  overview: string;
  year: number;
  releaseDate: string;
  runtime: number | null;
  genres: string[];
  countries: string[];
  languages: string[];
  certification: string | null;
  poster: string;
  backdrop: string;
  tmdbRating: number | null;
  tmdbVotes: number | null;
  imdbId: string | null;
  imdbRating: number | null;
  metacriticScore: number | null;
  rottenTomatoesScore: number | null;
  rottenTomatoesAudienceScore: number | null;
  cast: MediaDetailPerson[];
  directors: MediaDetailPerson[];
  writers: MediaDetailPerson[];
  similar: MediaItem[];
};

const navItems: { label: string; icon: string; view: View }[] = [
  { label: "Home", icon: "⌂", view: "home" },
  { label: "Memory", icon: "◌", view: "memory" },
  { label: "Watchlist", icon: "＋", view: "watchlist" },
  { label: "History", icon: "◷", view: "history" },
  { label: "Statistics", icon: "◒", view: "statistics" },
  { label: "Settings", icon: "⚙", view: "settings" },
];

const libraryItems = [
  {
    title: "Your library",
    subtitle: "Movies, shows, anime & more",
    icon: "▦",
    view: "home" as View,
  },
  {
    title: "History",
    subtitle: "Everything you've watched",
    icon: "◷",
    view: "history" as View,
  },
  {
    title: "Watchlist",
    subtitle: "Things you want to see",
    icon: "＋",
    view: "watchlist" as View,
  },
];

const genreMap: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Sci-Fi",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
};

const cinemaOptions = [
  { label: "India", country: "IN", language: "hi", region: "IN" },
  { label: "United States", country: "US", language: "en", region: "US" },
  { label: "United Kingdom", country: "GB", language: "en", region: "GB" },
  { label: "Canada", country: "CA", language: "en", region: "CA" },
  { label: "Australia", country: "AU", language: "en", region: "AU" },
  { label: "Japan", country: "JP", language: "ja", region: "JP" },
  { label: "South Korea", country: "KR", language: "ko", region: "KR" },
  { label: "China", country: "CN", language: "zh", region: "CN" },
  { label: "Taiwan", country: "TW", language: "zh", region: "TW" },
  { label: "Hong Kong", country: "HK", language: "zh", region: "HK" },
  { label: "France", country: "FR", language: "fr", region: "FR" },
  { label: "Germany", country: "DE", language: "de", region: "DE" },
  { label: "Italy", country: "IT", language: "it", region: "IT" },
  { label: "Spain", country: "ES", language: "es", region: "ES" },
  { label: "Mexico", country: "MX", language: "es", region: "MX" },
  { label: "Brazil", country: "BR", language: "pt", region: "BR" },
  { label: "Thailand", country: "TH", language: "th", region: "TH" },
  { label: "Turkey", country: "TR", language: "tr", region: "TR" },
  { label: "Sweden", country: "SE", language: "sv", region: "SE" },
  { label: "Norway", country: "NO", language: "no", region: "NO" },
  { label: "Russia", country: "RU", language: "ru", region: "RU" },
  { label: "Iran", country: "IR", language: "fa", region: "IR" },
  { label: "Nigeria", country: "NG", language: "en", region: "NG" },
  { label: "Indonesia", country: "ID", language: "id", region: "ID" },
  { label: "Philippines", country: "PH", language: "tl", region: "PH" },
  { label: "Poland", country: "PL", language: "pl", region: "PL" },
  { label: "Denmark", country: "DK", language: "da", region: "DK" },
  { label: "Finland", country: "FI", language: "fi", region: "FI" },
  { label: "Netherlands", country: "NL", language: "nl", region: "NL" },
  { label: "Belgium", country: "BE", language: "fr", region: "BE" },
];

const countryNameMap: Record<string, string> = Object.fromEntries(
  cinemaOptions.map((option) => [option.country, option.label])
);

const memoryDecades = ["Before 1980", "1980s", "1990s", "2000s", "2010s", "2020s"];


const STREMIO_API_BASE = "https://api.strem.io/api";
const STREMIO_LINK_BASE = "https://link.stremio.com/api/v2";
const STREMIO_STORAGE_PREFIX = "movo-stremio-auth:";
const STREMIO_SKIPPED_PREFIX = "movo-skipped:";
const STREMIO_LIBRARY_COLLECTION = "libraryItem";

type StremioLibraryItem = {
  _id?: string;
  id?: string;
  removed?: boolean;
  temp?: boolean;
  type?: string;
  name?: string;
  poster?: string;
  _ctime?: string;
  _mtime?: string;
  state?: {
    last_watched?: string | null;
    lastWatched?: string | null;
    time_watched?: number;
    timeWatched?: number;
    time_offset?: number;
    timeOffset?: number;
    overall_time_watched?: number;
    overallTimeWatched?: number;
    times_watched?: number;
    timesWatched?: number;
    flagged_watched?: number;
    flaggedWatched?: number;
    duration?: number;
    video_id?: string | null;
    videoId?: string | null;
    watched?: unknown;
  };
};

type StremioLibraryEntry = {
  imdbId: string;
  stremioType: "movie" | "series" | "other";
  name: string;
  poster: string | null;
  lastWatched: string | null;
  timesWatched: number;
  isWatched: boolean;
};

type StremioApiResponse<T> = {
  result?: T;
  error?: unknown;
};

function getStremioStorageKey(userId: string): string {
  return `${STREMIO_STORAGE_PREFIX}${userId}`;
}

function getSkippedStorageKey(userId: string): string {
  return `${STREMIO_SKIPPED_PREFIX}${userId}`;
}

function loadStoredStremioAuthKey(userId: string | null): string | null {
  if (!userId) return null;

  try {
    const key = window.localStorage.getItem(getStremioStorageKey(userId));
    return key?.trim() || null;
  } catch (error) {
    console.error("Failed to load Stremio connection:", error);
    return null;
  }
}

function saveStoredStremioAuthKey(userId: string, authKey: string): void {
  window.localStorage.setItem(getStremioStorageKey(userId), authKey);
}

function clearStoredStremioAuthKey(userId: string): void {
  window.localStorage.removeItem(getStremioStorageKey(userId));
}

async function createStremioLink(): Promise<{ code: string; link: string }> {
  const response = await fetch(`${STREMIO_LINK_BASE}/create?type=Create`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Stremio link creation failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    result?: { code?: string; link?: string };
    code?: string;
    link?: string;
  };

  const result = data.result ?? data;
  const code = String(result.code ?? "").trim();
  const link = String(result.link ?? "").trim();

  if (!code || !link) {
    throw new Error("Stremio did not return a valid account-link request.");
  }

  return { code, link };
}

async function readStremioLink(code: string): Promise<string | null> {
  const query = new URLSearchParams({ type: "Read", code });
  const response = await fetch(`${STREMIO_LINK_BASE}/read?${query.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Stremio account-link check failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    result?: { success?: boolean; authKey?: string; token?: string };
  };

  const result = data.result;
  if (!result?.success) {
    return null;
  }

  const token = String(result.authKey ?? result.token ?? "").trim();
  return token || null;
}

async function exchangeStremioLinkToken(token: string): Promise<string> {
  const response = await fetch(`${STREMIO_API_BASE}/loginWithToken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "LoginWithToken", token }),
  });

  if (!response.ok) {
    throw new Error(`Stremio token exchange failed (${response.status}).`);
  }

  const data = (await response.json()) as StremioApiResponse<{ authKey?: string }>;
  const authKey = String(data.result?.authKey ?? "").trim();

  if (!authKey) {
    throw new Error("Stremio did not return an authenticated session key.");
  }

  return authKey;
}

async function fetchStremioLibrary(authKey: string): Promise<StremioLibraryEntry[]> {
  const response = await fetch(`${STREMIO_API_BASE}/datastoreGet`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authKey,
      collection: STREMIO_LIBRARY_COLLECTION,
      all: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Stremio library lookup failed (${response.status}).`);
  }

  const data = (await response.json()) as StremioApiResponse<unknown>;
  if (data.error || (data.result && typeof data.result === "object" && "error" in data.result)) {
    throw new Error("Stremio rejected the library lookup. Reconnect Stremio in Settings.");
  }

  const rawItems: unknown[] = [];
  const result = data.result;

  if (Array.isArray(result)) {
    rawItems.push(...result);
  } else if (result && typeof result === "object") {
    const items = (result as Record<string, unknown>).items;
    if (Array.isArray(items)) {
      rawItems.push(...items);
    }
  }

  const entries: StremioLibraryEntry[] = [];

  rawItems.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const libraryItem = item as StremioLibraryItem;
    const imdbId = String(libraryItem._id ?? libraryItem.id ?? "").trim();
    if (!imdbId || libraryItem.removed) return;

    const rawType = String(libraryItem.type ?? "").trim().toLowerCase();
    const stremioType: StremioLibraryEntry["stremioType"] =
      rawType === "movie" ? "movie" : rawType === "series" ? "series" : "other";

    const state = libraryItem.state;
    const timesWatched = Number(state?.times_watched ?? state?.timesWatched ?? 0);
    const flaggedWatched = Number(state?.flagged_watched ?? state?.flaggedWatched ?? 0);
    const isWatched = timesWatched > 0 || flaggedWatched > 0;
    const rawLastWatched = state?.last_watched ?? state?.lastWatched ?? null;

    entries.push({
      imdbId,
      stremioType,
      name: String(libraryItem.name ?? "").trim(),
      poster: typeof libraryItem.poster === "string" ? libraryItem.poster : null,
      lastWatched: typeof rawLastWatched === "string" ? rawLastWatched : null,
      timesWatched: Number.isFinite(timesWatched) ? timesWatched : 0,
      isWatched,
    });
  });

  return entries;
}

function getYear(releaseDate: string): number {
  if (!releaseDate) {
    return 0;
  }

  return Number(releaseDate.slice(0, 4));
}

function convertMovie(movie: TmdbMovie): MediaItem {
  const genres = movie.genre_ids
    .map((genreId) => genreMap[genreId])
    .filter(Boolean)
    .slice(0, 2);

  return {
    id: movie.id,
    title: movie.title,
    year: getYear(movie.release_date),
    type: "Movie",
    genres: genres.length > 0 ? genres : ["Movie"],
    poster: getTmdbImageUrl(movie.poster_path, "w500"),
    rating: movie.vote_average,
  };
}

function convertTvResult(tv: Record<string, unknown>): MediaItem | null {
  const id = typeof tv.id === "number" ? tv.id : Number(tv.id);
  const title = String(tv.name ?? "").trim();
  const posterPath = typeof tv.poster_path === "string" ? tv.poster_path : "";
  if (!Number.isFinite(id) || !title || !posterPath) {
    return null;
  }

  const genreIds = Array.isArray(tv.genre_ids)
    ? tv.genre_ids.filter((value): value is number => typeof value === "number")
    : [];
  const genres = genreIds.map((genreId) => genreMap[genreId]).filter(Boolean).slice(0, 2);
  const rating = typeof tv.vote_average === "number" ? tv.vote_average : 0;

  const rawLanguage = String(tv.original_language ?? "").trim().toLowerCase();
  const originCountries = Array.isArray(tv.origin_country)
    ? tv.origin_country.filter((value): value is string => typeof value === "string")
    : [];
  const isAnime = genreIds.includes(16) && (rawLanguage === "ja" || originCountries.includes("JP"));

  return {
    id,
    title,
    year: getYear(String(tv.first_air_date ?? "")),
    type: "TV",
    genres: genres.length > 0 ? genres : ["TV"],
    poster: getTmdbImageUrl(posterPath, "w500"),
    rating,
    ...(isAnime ? { isAnime: true } : {}),
  } as MediaItem;
}

function convertSimilarResult(result: Record<string, unknown>, isTv: boolean): MediaItem | null {
  if (isTv) {
    return convertTvResult(result);
  }

  const id = typeof result.id === "number" ? result.id : Number(result.id);
  const title = String(result.title ?? "").trim();
  const posterPath = typeof result.poster_path === "string" ? result.poster_path : "";
  if (!Number.isFinite(id) || !title || !posterPath) {
    return null;
  }

  const genreIds = Array.isArray(result.genre_ids)
    ? result.genre_ids.filter((value): value is number => typeof value === "number")
    : [];
  const genres = genreIds.map((genreId) => genreMap[genreId]).filter(Boolean).slice(0, 2);

  return {
    id,
    title,
    year: getYear(String(result.release_date ?? "")),
    type: "Movie",
    genres: genres.length > 0 ? genres : ["Movie"],
    poster: getTmdbImageUrl(posterPath, "w500"),
    rating: typeof result.vote_average === "number" ? result.vote_average : 0,
  };
}

function convertStoredMedia(media: {
  tmdb_id: number;
  title: string;
  release_date: string | null;
  poster_path: string | null;
  media_type: string | null;
  genres: string[] | null;
  original_language?: string | null;
}): MediaItem {
  const type = media.media_type === "TV" ? "TV" : "Movie";
  const isAnime = type === "TV" && Boolean(media.genres?.includes("Animation")) && String(media.original_language ?? "").toLowerCase() === "ja";
  const converted = {
    id: media.tmdb_id,
    title: media.title,
    year: getYear(media.release_date ?? ""),
    type,
    genres:
      media.genres && media.genres.length > 0
        ? media.genres.slice(0, 2)
        : [type],
    poster:
      media.poster_path?.startsWith("http")
        ? media.poster_path
        : media.poster_path
        ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
        : "",
    rating: undefined,
  };
  return (isAnime ? { ...converted, isAnime: true } : converted) as MediaItem;
}


function getDisplayName(
  user: { user_metadata?: Record<string, unknown>; email?: string } | null
): string {
  const metadataName =
    typeof user?.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";

  if (metadataName) {
    return metadataName;
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "Movo user";
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "M";
}

function getViewFromHash(): View {
  const hash = window.location.hash.replace(/^#/, "");

  switch (hash) {
    case "memory":
    case "watchlist":
    case "history":
    case "statistics":
    case "settings":
      return hash;
    default:
      return "home";
  }
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function decadeBounds(decade: string): { start: string; end: string } | null {
  switch (decade) {
    case "Before 1980":
      return { start: "1900-01-01", end: "1979-12-31" };
    case "1980s":
      return { start: "1980-01-01", end: "1989-12-31" };
    case "1990s":
      return { start: "1990-01-01", end: "1999-12-31" };
    case "2000s":
      return { start: "2000-01-01", end: "2009-12-31" };
    case "2010s":
      return { start: "2010-01-01", end: "2019-12-31" };
    case "2020s":
      return { start: "2020-01-01", end: "2029-12-31" };
    default:
      return null;
  }
}

function getTmdbApiKey(): string {
  const key = import.meta.env.VITE_TMDB_API_KEY;

  if (!key) {
    throw new Error("TMDb API key is missing from your .env file.");
  }

  return key;
}

async function fetchTmdbMovies(
  params: Record<string, string | number | boolean>
): Promise<TmdbPageResponse> {
  const query = new URLSearchParams();
  query.set("api_key", getTmdbApiKey());
  query.set("include_adult", "false");
  query.set("include_video", "false");
  query.set("sort_by", "popularity.desc");

  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });

  const response = await fetch(
    `https://api.themoviedb.org/3/discover/movie?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`TMDb discovery failed (${response.status}).`);
  }

  const data = (await response.json()) as TmdbPageResponse;
  return data;
}

async function fetchTmdbTv(
  params: Record<string, string | number | boolean>
): Promise<{ page: number; total_pages: number; total_results: number; results: Array<Record<string, unknown>> }> {
  const query = new URLSearchParams();
  query.set("api_key", getTmdbApiKey());
  query.set("include_adult", "false");
  query.set("sort_by", "popularity.desc");

  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });

  const response = await fetch(
    `https://api.themoviedb.org/3/discover/tv?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`TMDb TV discovery failed (${response.status}).`);
  }

  return (await response.json()) as {
    page: number;
    total_pages: number;
    total_results: number;
    results: Array<Record<string, unknown>>;
  };
}

async function searchTmdbTv(queryText: string): Promise<{ results: Array<Record<string, unknown>> }> {
  const query = new URLSearchParams();
  query.set("api_key", getTmdbApiKey());
  query.set("query", queryText.trim());
  query.set("include_adult", "false");
  query.set("page", "1");

  const response = await fetch(
    `https://api.themoviedb.org/3/search/tv?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`TMDb TV search failed (${response.status}).`);
  }

  return (await response.json()) as { results: Array<Record<string, unknown>> };
}

async function searchTmdbMovies(queryText: string): Promise<TmdbPageResponse> {
  const query = new URLSearchParams();
  query.set("api_key", getTmdbApiKey());
  query.set("query", queryText.trim());
  query.set("include_adult", "false");
  query.set("page", "1");

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`TMDb search failed (${response.status}).`);
  }

  return (await response.json()) as TmdbPageResponse;
}

function convertDetailsToMediaItem(details: MediaDetails): MediaItem {
  const type = details.type === "tv" ? "TV" : "Movie";
  const isAnime = type === "TV" && details.genres.includes("Animation") && details.countries.some((country) => country.toLowerCase() === "japan");
  const converted = {
    id: details.id,
    title: details.title,
    year: details.year,
    type,
    genres: details.genres.length > 0 ? details.genres.slice(0, 2) : [type],
    poster: details.poster,
    rating: details.tmdbRating ?? 0,
  };
  return (isAnime ? { ...converted, isAnime: true } : converted) as MediaItem;
}

async function fetchMediaDetails(item: MediaItem): Promise<MediaDetails> {
  const apiKey = getTmdbApiKey();
  const isTv = item.type === "TV";
  const endpoint = isTv ? `tv/${item.id}` : `movie/${item.id}`;
  const query = new URLSearchParams({
    api_key: apiKey,
    append_to_response: isTv
      ? "credits,external_ids,content_ratings,similar"
      : "credits,external_ids,release_dates,similar",
  });

  const response = await fetch(`https://api.themoviedb.org/3/${endpoint}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDb details failed (${response.status}).`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const credits = (data.credits ?? {}) as Record<string, unknown>;
  const castRaw = Array.isArray(credits.cast) ? credits.cast : [];
  const crewRaw = Array.isArray(credits.crew) ? credits.crew : [];

  const cast = castRaw
    .filter((person): person is Record<string, unknown> => Boolean(person && typeof person === "object"))
    .slice(0, 16)
    .map((person) => ({
      id: Number(person.id),
      name: String(person.name ?? "Unknown"),
      character: typeof person.character === "string" ? person.character : undefined,
      profilePath: typeof person.profile_path === "string" ? person.profile_path : null,
    }));

  const directors = crewRaw
    .filter((person): person is Record<string, unknown> => Boolean(person && typeof person === "object"))
    .filter((person) => String(person.job ?? "").toLowerCase() === "director")
    .slice(0, 8)
    .map((person) => ({
      id: Number(person.id),
      name: String(person.name ?? "Unknown"),
      job: "Director",
      profilePath: typeof person.profile_path === "string" ? person.profile_path : null,
    }));

  const writers = crewRaw
    .filter((person): person is Record<string, unknown> => Boolean(person && typeof person === "object"))
    .filter((person) => {
      const department = String(person.department ?? "").toLowerCase();
      const job = String(person.job ?? "").toLowerCase();
      return department === "writing" || job.includes("writer") || job === "screenplay" || job === "story";
    })
    .slice(0, 10)
    .map((person) => ({
      id: Number(person.id),
      name: String(person.name ?? "Unknown"),
      job: String(person.job ?? "Writer"),
      profilePath: typeof person.profile_path === "string" ? person.profile_path : null,
    }));

  const genres = Array.isArray(data.genres)
    ? data.genres
        .filter((genre): genre is Record<string, unknown> => Boolean(genre && typeof genre === "object"))
        .map((genre) => String(genre.name ?? ""))
        .filter(Boolean)
    : [];

  const countryValues = isTv ? data.origin_country : data.production_countries;
  const countries = Array.isArray(countryValues)
    ? countryValues
        .map((value) => {
          if (typeof value === "string") return countryNameMap[value] ?? value;
          if (value && typeof value === "object") {
            const objectValue = value as Record<string, unknown>;
            const code = String(objectValue.iso_3166_1 ?? "");
            return String(objectValue.name ?? countryNameMap[code] ?? code);
          }
          return "";
        })
        .filter(Boolean)
    : [];

  const languageValues = Array.isArray(data.spoken_languages) ? data.spoken_languages : [];
  const languages = languageValues
    .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object"))
    .map((value) => String(value.english_name ?? value.name ?? value.iso_639_1 ?? ""))
    .filter(Boolean);

  let certification: string | null = null;
  if (isTv) {
    const ratings = (data.content_ratings ?? {}) as Record<string, unknown>;
    const results = Array.isArray(ratings.results) ? ratings.results : [];
    const preferred = results.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as Record<string, unknown>;
      return record.iso_3166_1 === "IN";
    });
    const fallback = results.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).rating);
    const ratingEntry = preferred ?? fallback;
    if (ratingEntry && typeof ratingEntry === "object") {
      certification = String((ratingEntry as Record<string, unknown>).rating || "") || null;
    }
  } else {
    const releaseDates = (data.release_dates ?? {}) as Record<string, unknown>;
    const results = Array.isArray(releaseDates.results) ? releaseDates.results : [];
    const preferred = results.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).iso_3166_1 === "IN");
    const fallback = results.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).iso_3166_1 === "US");
    const releaseEntry = preferred ?? fallback;
    if (releaseEntry && typeof releaseEntry === "object") {
      const release = releaseEntry as Record<string, unknown>;
      const dates = Array.isArray(release.release_dates) ? release.release_dates : [];
      const certified = dates.find((entry) => entry && typeof entry === "object" && String((entry as Record<string, unknown>).certification ?? "").trim());
      if (certified && typeof certified === "object") {
        certification = String((certified as Record<string, unknown>).certification ?? "").trim() || null;
      }
    }
  }

  const similarRaw = ((data.similar ?? {}) as Record<string, unknown>).results;
  const similar = Array.isArray(similarRaw)
    ? similarRaw
        .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object"))
        .slice(0, 12)
        .map((result) => convertSimilarResult(result, isTv))
        .filter((result): result is MediaItem => Boolean(result))
    : [];

  const externalIds = (data.external_ids ?? {}) as Record<string, unknown>;
  const imdbId = typeof externalIds.imdb_id === "string" ? externalIds.imdb_id : null;

  let imdbRating: number | null = null;
  let metacriticScore: number | null = null;
  let rottenTomatoesScore: number | null = null;
  let rottenTomatoesAudienceScore: number | null = null;

  if (imdbId) {
    try {
      const cinemetaType = isTv ? "series" : "movie";
      const cinemetaResponse = await fetch(
        `https://v3-cinemeta.strem.io/meta/${cinemetaType}/${encodeURIComponent(imdbId)}.json`
      );
      if (cinemetaResponse.ok) {
        const cinemetaData = (await cinemetaResponse.json()) as {
          meta?: { imdbRating?: string | number };
        };
        const parsed = Number(cinemetaData.meta?.imdbRating);
        if (Number.isFinite(parsed) && parsed > 0) {
          imdbRating = parsed;
        }
      }
    } catch {
      // IMDb score stays unavailable when Cinemeta does not return one.
    }

    const omdbKey = import.meta.env.VITE_OMDB_API_KEY as string | undefined;
    if (omdbKey) {
      try {
        const omdbResponse = await fetch(
          `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbKey)}&i=${encodeURIComponent(imdbId)}&tomatoes=true`
        );

        if (omdbResponse.ok) {
          const omdbData = (await omdbResponse.json()) as Record<string, unknown>;
          const responseOk = String(omdbData.Response ?? "").toLowerCase() === "true";

          if (responseOk) {
            const parsedMeta = Number(omdbData.Metascore);
            if (Number.isFinite(parsedMeta)) {
              metacriticScore = parsedMeta;
            }

            const ratings = Array.isArray(omdbData.Ratings) ? omdbData.Ratings : [];
            ratings.forEach((entry) => {
              if (!entry || typeof entry !== "object") return;
              const record = entry as Record<string, unknown>;
              const source = String(record.Source ?? "").toLowerCase();
              const value = String(record.Value ?? "").trim();
              const score = Number(value.replace("%", "").replace("/100", ""));

              if (source === "rotten tomatoes" && Number.isFinite(score)) {
                rottenTomatoesScore = score;
              }
            });

            const tomatoesCritic = Number(omdbData.tomatoMeter);
            const tomatoesAudience = Number(omdbData.tomatoUserMeter);
            if (Number.isFinite(tomatoesCritic) && tomatoesCritic >= 0) {
              rottenTomatoesScore = tomatoesCritic;
            }
            if (Number.isFinite(tomatoesAudience) && tomatoesAudience >= 0) {
              rottenTomatoesAudienceScore = tomatoesAudience;
            }
          }
        }
      } catch {
        // Third-party ratings stay unavailable when OMDb cannot be reached.
      }
    }
  }

  const releaseDate = String(data.release_date ?? data.first_air_date ?? "");
  const year = getYear(releaseDate);
  const runtime = isTv
    ? Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0
      ? Number(data.episode_run_time[0])
      : null
    : typeof data.runtime === "number"
    ? data.runtime
    : null;

  return {
    id: item.id,
    type: isTv ? "tv" : "movie",
    title: String(data.title ?? data.name ?? item.title),
    originalTitle: String(data.original_title ?? data.original_name ?? item.title),
    overview: String(data.overview ?? ""),
    year,
    releaseDate,
    runtime: Number.isFinite(runtime ?? NaN) ? runtime : null,
    genres,
    countries,
    languages,
    certification,
    poster: item.poster,
    backdrop: typeof data.backdrop_path === "string" ? getTmdbImageUrl(data.backdrop_path, "original") : "",
    tmdbRating: typeof data.vote_average === "number" ? data.vote_average : null,
    tmdbVotes: typeof data.vote_count === "number" ? data.vote_count : null,
    imdbId,
    imdbRating,
    metacriticScore,
    rottenTomatoesScore,
    rottenTomatoesAudienceScore,
    cast,
    directors,
    writers,
    similar,
  };
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<View>(getViewFromHash);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    initial: string;
  } | null>(null);

  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [watchedItems, setWatchedItems] = useState<MediaItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<MediaItem[]>([]);
  const [skippedItems, setSkippedItems] = useState<MediaItem[]>([]);
  const [watchedMeta, setWatchedMeta] = useState<Record<number, UserMediaMeta>>({});

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");

  const [memorySearch, setMemorySearch] = useState("");
  const [memoryResults, setMemoryResults] = useState<MediaItem[]>([]);
  const [memoryLane, setMemoryLane] = useState<{
    cinema: string;
    decade: string;
    genre: string;
  } | null>(null);
  const [memorySearchLoading, setMemorySearchLoading] = useState(false);
  const [memoryRandomLoading, setMemoryRandomLoading] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [memoryInterpretation, setMemoryInterpretation] = useState<string | null>(null);

  const [pendingRatingItem, setPendingRatingItem] =
    useState<MediaItem | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [personalRatings, setPersonalRatings] =
    useState<Record<number, number>>({});
  const [personalCustomRatings, setPersonalCustomRatings] = useState<Record<number, CustomRatingKey[]>>({});
  const [ratingMode, setRatingMode] = useState<"stars" | "custom">("stars");
  const [selectedCustomRating, setSelectedCustomRating] = useState<CustomRatingKey[]>([]);

  const [homeSearchOpen, setHomeSearchOpen] = useState(false);
  const [homeSearch, setHomeSearch] = useState("");
  const [homeSearchLoading, setHomeSearchLoading] = useState(false);
  const [homeSearchResults, setHomeSearchResults] = useState<MediaItem[]>([]);
  const [homeSearchError, setHomeSearchError] = useState<string | null>(null);
  const [homeSearchFilters, setHomeSearchFilters] = useState<HomeSearchFilters>({
    mediaType: "all",
    country: "",
    genre: "",
    language: "",
  });
  const [homeFilterOpen, setHomeFilterOpen] = useState(false);
  const [homeFilters, setHomeFilters] = useState<HomeFilters>({
    mediaType: "all",
    yearFrom: "",
    yearTo: "",
    genre: "",
    country: "",
    language: "",
    minRating: "",
    certificationCountry: "IN",
    certification: "",
  });
  const [watchlistFilters, setWatchlistFilters] = useState<SavedListFilters>({
    type: "all",
    genre: "",
    yearFrom: "",
    yearTo: "",
    customRating: "",
    sort: "recent",
  });
  const [historyFilters, setHistoryFilters] = useState<SavedListFilters>({
    type: "all",
    genre: "",
    yearFrom: "",
    yearTo: "",
    customRating: "",
    sort: "recent",
  });
  const [watchlistFilterOpen, setWatchlistFilterOpen] = useState(false);
  const [watchlistSection, setWatchlistSection] = useState<"watchlist" | "skipped">("watchlist");
  const [historyFilterOpen, setHistoryFilterOpen] = useState(false);
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [mediaDetailsLoading, setMediaDetailsLoading] = useState(false);
  const [mediaDetailsError, setMediaDetailsError] = useState<string | null>(null);

  const [stremioAuthKey, setStremioAuthKey] = useState<string | null>(null);
  const [stremioLibraryIds, setStremioLibraryIds] = useState<Set<string>>(new Set());
  const [stremioSyncing, setStremioSyncing] = useState(false);
  const [stremioLinking, setStremioLinking] = useState(false);
  const [stremioMessage, setStremioMessage] = useState<string | null>(null);
  const [stremioPendingTitleId, setStremioPendingTitleId] = useState<string | null>(null);

  // Home suggestions are kept per user so a browser refresh does not reset
  // the current recommendation list back to TMDb's default first page.
  const hydratedSuggestionUserRef = useRef<string | null>(null);
  const hydratedSkippedUserRef = useRef<string | null>(null);

  const navigateToView = (view: View) => {
    const nextHash = view === "home" ? "" : `#${view}`;

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }

    setCurrentView(view);
    setActionMessage(null);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentView(getViewFromHash());
      setActionMessage(null);
    };

    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (session?.user) {
        const user = session.user;
        const name = getDisplayName(user);
        setCurrentUser({
          id: user.id,
          name,
          email: user.email ?? "",
          initial: getInitial(name),
        });
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (session?.user) {
        const user = session.user;
        const name = getDisplayName(user);
        setCurrentUser({
          id: user.id,
          name,
          email: user.email ?? "",
          initial: getInitial(name),
        });
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const testSupabaseConnection = async () => {
      const { error } = await supabase.from("media").select("id").limit(1);

      if (error) {
        console.error("Supabase connection test failed:", error);
        setSupabaseStatus("error");
        return;
      }

      setSupabaseStatus("connected");
    };

    void testSupabaseConnection();
  }, []);

  const loadUserMedia = async (): Promise<{
    watchedIds: number[];
    watchlistIds: number[];
  }> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Unable to get current user:", userError);
        return { watchedIds: [], watchlistIds: [] };
      }

      const { data: userMediaRows, error: userMediaError } = await supabase
        .from("user_media")
        .select("media_id, status, watched_at, watch_count")
        .eq("user_id", user.id);

      if (userMediaError) {
        console.error("Failed to load user media:", userMediaError);
        return { watchedIds: [], watchlistIds: [] };
      }

      if (!userMediaRows || userMediaRows.length === 0) {
        setWatchedItems([]);
        setWatchlistItems([]);
        setWatchedMeta({});
        return { watchedIds: [], watchlistIds: [] };
      }

      const mediaIds = userMediaRows.map((row) => row.media_id);
      const { data: mediaRows, error: mediaError } = await supabase
        .from("media")
        .select("id, tmdb_id, title, release_date, poster_path, media_type, genres, original_language")
        .in("id", mediaIds);

      if (mediaError) {
        console.error("Failed to load media records:", mediaError);
        return { watchedIds: [], watchlistIds: [] };
      }

      if (!mediaRows) {
        return { watchedIds: [], watchlistIds: [] };
      }

      const mediaMap = new Map(mediaRows.map((media) => [media.id, media]));
      const watched: MediaItem[] = [];
      const watchlist: MediaItem[] = [];
      const metadata: Record<number, UserMediaMeta> = {};

      userMediaRows.forEach((userMedia) => {
        const media = mediaMap.get(userMedia.media_id);

        if (!media) {
          return;
        }

        const converted = convertStoredMedia({
          tmdb_id: media.tmdb_id,
          title: media.title,
          release_date: media.release_date,
          poster_path: media.poster_path,
          media_type: media.media_type,
          genres: media.genres,
          original_language: media.original_language,
        });

        if (userMedia.status === "watched") {
          watched.push(converted);
          metadata[media.tmdb_id] = {
            watchedAt: userMedia.watched_at ?? null,
            watchCount: userMedia.watch_count ?? 0,
          };
        }

        if (userMedia.status === "watchlist") {
          watchlist.push(converted);
        }
      });

      watched.sort((a, b) => {
        const aDate = metadata[a.id]?.watchedAt ?? "";
        const bDate = metadata[b.id]?.watchedAt ?? "";
        return bDate.localeCompare(aDate);
      });

      setWatchedItems(watched);
      setWatchlistItems(watchlist);
      setWatchedMeta(metadata);

      return {
        watchedIds: watched.map((item) => item.id),
        watchlistIds: watchlist.map((item) => item.id),
      };
    } catch (error) {
      console.error("Unexpected error loading user media:", error);
      return { watchedIds: [], watchlistIds: [] };
    }
  };

  const loadSuggestions = async (replace = true, filters: HomeFilters = homeFilters) => {
    if (replace) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setLoadError(null);

    try {
      const excludedIds = new Set([
        ...watchedItems.map((item) => item.id),
        ...watchlistItems.map((item) => item.id),
        ...skippedItems.map((item) => item.id),
      ]);

      const page = randomInteger(1, 20);
      const movieParams: Record<string, string | number | boolean> = { page };
      const tvParams: Record<string, string | number | boolean> = { page };

      if (filters.yearFrom) {
        movieParams["primary_release_date.gte"] = `${filters.yearFrom}-01-01`;
        tvParams["first_air_date.gte"] = `${filters.yearFrom}-01-01`;
      }
      if (filters.yearTo) {
        movieParams["primary_release_date.lte"] = `${filters.yearTo}-12-31`;
        tvParams["first_air_date.lte"] = `${filters.yearTo}-12-31`;
      }
      if (filters.genre) {
        movieParams.with_genres = filters.genre;
        tvParams.with_genres = filters.genre;
      }
      if (filters.country) {
        movieParams.with_origin_country = filters.country;
        tvParams.with_origin_country = filters.country;
      }
      if (filters.language) {
        movieParams.with_original_language = filters.language;
        tvParams.with_original_language = filters.language;
      }
      if (filters.minRating) {
        movieParams["vote_average.gte"] = Number(filters.minRating);
        tvParams["vote_average.gte"] = Number(filters.minRating);
      }

      const includeMovies = filters.mediaType !== "tv";
      const includeTv = filters.mediaType !== "movie";

      const [movieResult, tvResult] = await Promise.all([
        includeMovies ? fetchTmdbMovies(movieParams) : Promise.resolve(null),
        includeTv ? fetchTmdbTv(tvParams) : Promise.resolve(null),
      ]);

      const movies = movieResult
        ? movieResult.results.filter((movie) => movie.poster_path).map(convertMovie)
        : [];
      const tv = tvResult
        ? tvResult.results
            .filter((item) => typeof item.poster_path === "string" && Boolean(item.poster_path))
            .map(convertTvResult)
            .filter((item): item is MediaItem => Boolean(item))
        : [];

      const fresh = [...movies, ...tv]
        .filter((item) => !excludedIds.has(item.id))
        .filter((item) => !suggestions.some((existing) => existing.id === item.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, replace ? 12 : 8);

      setSuggestions((current) => (replace ? fresh : [...current, ...fresh]));

      if (replace) {
        setActionMessage(
          filters.mediaType === "tv"
            ? fresh.length > 0
              ? "Fresh series ready."
              : "No series surfaced in this batch."
            : filters.mediaType === "movie"
            ? fresh.length > 0
              ? "Fresh movies ready."
              : "No movies surfaced in this batch."
            : "Fresh movies and series ready."
        );
      }
    } catch (error) {
      console.error("Failed to load TMDb suggestions:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load suggestions from TMDb."
      );
    } finally {
      if (replace) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const userId = currentUser?.id;

    if (!userId || hydratedSuggestionUserRef.current !== userId) {
      return;
    }

    try {
      window.localStorage.setItem(
        `movo-home-suggestions:${userId}`,
        JSON.stringify(suggestions)
      );
    } catch (error) {
      console.error("Failed to persist home suggestions:", error);
    }
  }, [suggestions, currentUser?.id]);

  useEffect(() => {
    const userId = currentUser?.id;

    if (!userId) {
      hydratedSkippedUserRef.current = null;
      setSkippedItems([]);
      return;
    }

    try {
      const raw = window.localStorage.getItem(getSkippedStorageKey(userId));
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      setSkippedItems(
        Array.isArray(parsed)
          ? parsed.filter(
              (item): item is MediaItem =>
                Boolean(
                  item &&
                  typeof item === "object" &&
                  typeof (item as Record<string, unknown>).id === "number" &&
                  typeof (item as Record<string, unknown>).title === "string" &&
                  typeof (item as Record<string, unknown>).type === "string"
                )
            )
          : []
      );
    } catch (error) {
      console.error("Failed to restore skipped titles:", error);
      setSkippedItems([]);
    } finally {
      hydratedSkippedUserRef.current = userId;
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const userId = currentUser?.id;

    if (!userId || hydratedSkippedUserRef.current !== userId) {
      return;
    }

    try {
      window.localStorage.setItem(
        getSkippedStorageKey(userId),
        JSON.stringify(skippedItems)
      );
    } catch (error) {
      console.error("Failed to persist skipped titles:", error);
    }
  }, [skippedItems, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const initializeLibrary = async () => {
      const { watchedIds, watchlistIds } = await loadUserMedia();
      const excludedIds = [...watchedIds, ...watchlistIds];
      const excluded = new Set(excludedIds);
      const userId = currentUser?.id;

      if (!userId) {
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        let restoredSuggestions: MediaItem[] = [];

        try {
          const stored = window.localStorage.getItem(
            `movo-home-suggestions:${userId}`
          );

          if (stored) {
            const parsed = JSON.parse(stored) as unknown;

            if (Array.isArray(parsed)) {
              restoredSuggestions = parsed
                .filter((item): item is MediaItem => {
                  if (!item || typeof item !== "object") {
                    return false;
                  }

                  const candidate = item as Partial<MediaItem>;
                  return (
                    typeof candidate.id === "number" &&
                    typeof candidate.title === "string" &&
                    typeof candidate.year === "number" &&
                    typeof candidate.type === "string" &&
                    Array.isArray(candidate.genres) &&
                    typeof candidate.poster === "string" &&
                    (candidate.rating === undefined ||
                      typeof candidate.rating === "number")
                  );
                })
                .filter((item) => !excluded.has(item.id))
                .slice(0, 24);
            }
          }
        } catch (error) {
          console.error("Failed to restore home suggestions:", error);
        }

        if (restoredSuggestions.length > 0) {
          hydratedSuggestionUserRef.current = userId;
          setSuggestions(restoredSuggestions);
          return;
        }

        const [movies, tv] = await Promise.all([
          discoverMovies(),
          fetchTmdbTv({ page: randomInteger(1, 5) }),
        ]);
        const initialMovies = movies
          .filter((movie) => movie.poster_path)
          .map(convertMovie);
        const initialTv = tv.results
          .filter((item) => typeof item.poster_path === "string" && Boolean(item.poster_path))
          .map(convertTvResult)
          .filter((item): item is MediaItem => Boolean(item));
        const initial = [...initialMovies, ...initialTv]
          .filter((movie) => !excluded.has(movie.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 12);

        hydratedSuggestionUserRef.current = userId;
        setSuggestions(initial);
      } catch (error) {
        console.error("Failed to initialize suggestions:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load suggestions from TMDb."
        );
        hydratedSuggestionUserRef.current = userId;
      } finally {
        setIsLoading(false);
      }
    };

    void initializeLibrary();
  }, [isAuthenticated, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated || currentView !== "home") {
      return;
    }

    if (suggestions.length > 4 || isLoading || isLoadingMore) {
      return;
    }

    void loadSuggestions(false);
  }, [currentView, isAuthenticated, suggestions.length, isLoading, isLoadingMore]);

  const ensureMediaRecord = async (item: MediaItem): Promise<number | null> => {
    const { data: existingMedia, error: findError } = await supabase
      .from("media")
      .select("id")
      .eq("tmdb_id", item.id)
      .maybeSingle();

    if (findError) {
      console.error("Failed to find media record:", findError);
      return null;
    }

    if (existingMedia) {
      return existingMedia.id;
    }

    const { data: newMedia, error: insertError } = await supabase
      .from("media")
      .insert({
        tmdb_id: item.id,
        title: item.title,
        original_title: item.title,
        media_type: item.type === "TV" ? "TV" : "Movie",
        release_date: item.year > 0 ? `${item.year}-01-01` : null,
        poster_path: item.poster,
        genres: item.genres,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create media record:", insertError);
      return null;
    }

    return newMedia?.id ?? null;
  };

  const saveUserMedia = async (
    item: MediaItem,
    status: "watched" | "watchlist"
  ): Promise<boolean> => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Unable to get current user:", userError);
      setActionMessage("Your session could not be found. Please sign in again.");
      return false;
    }

    const mediaId = await ensureMediaRecord(item);

    if (!mediaId) {
      setActionMessage(`Couldn't save ${item.title}. Please try again.`);
      return false;
    }

    const { data: existingUserMedia, error: findUserMediaError } = await supabase
      .from("user_media")
      .select("id, status, watch_count")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .maybeSingle();

    if (findUserMediaError) {
      console.error("Failed to find user media:", findUserMediaError);
      setActionMessage(`Couldn't save ${item.title}. Please try again.`);
      return false;
    }

    if (existingUserMedia) {
      const updateData: {
        status: string;
        watched_at?: string | null;
        watch_count?: number;
      } = { status };

      if (status === "watched") {
        updateData.watched_at = new Date().toISOString();
        updateData.watch_count = (existingUserMedia.watch_count ?? 0) + 1;
      }

      if (status === "watchlist") {
        updateData.watched_at = null;
      }

      const { error: updateError } = await supabase
        .from("user_media")
        .update(updateData)
        .eq("id", existingUserMedia.id);

      if (updateError) {
        console.error("Failed to update user media:", updateError);
        setActionMessage(`Couldn't save ${item.title}. Please try again.`);
        return false;
      }

      return true;
    }

    const insertData: {
      user_id: string;
      media_id: number;
      status: string;
      watched_at?: string | null;
      watch_count?: number;
    } = {
      user_id: user.id,
      media_id: mediaId,
      status,
      watch_count: status === "watched" ? 1 : 0,
    };

    if (status === "watched") {
      insertData.watched_at = new Date().toISOString();
    }

    const { error: insertUserMediaError } = await supabase
      .from("user_media")
      .insert(insertData);

    if (insertUserMediaError) {
      console.error("Failed to create user media:", insertUserMediaError);
      setActionMessage(`Couldn't save ${item.title}. Please try again.`);
      return false;
    }

    return true;
  };

  const applyHomeFilters = async () => {
    setHomeFilterOpen(false);
    await loadSuggestions(true, homeFilters);
  };

  const clearHomeFilters = async () => {
    const cleared: HomeFilters = {
      mediaType: "all",
      yearFrom: "",
      yearTo: "",
      genre: "",
      country: "",
      language: "",
      minRating: "",
      certificationCountry: "IN",
      certification: "",
    };
    setHomeFilters(cleared);
    setHomeFilterOpen(false);
    await loadSuggestions(true, cleared);
  };

  const searchFilteredCinema = async (
    queryText: string,
    filters: HomeSearchFilters
  ): Promise<MediaItem[]> => {
    const pages = [1, 2, 3];
    const makeParams = (): Record<string, string | number | boolean> => {
      const params: Record<string, string | number | boolean> = {
        include_adult: false,
        include_video: false,
        sort_by: "popularity.desc",
      };
      if (filters.country) params.with_origin_country = filters.country;
      if (filters.genre) params.with_genres = filters.genre;
      if (filters.language) params.with_original_language = filters.language;
      return params;
    };

    const includeMovies = filters.mediaType !== "tv";
    const includeTv = filters.mediaType !== "movie";
    const [moviePages, tvPages] = await Promise.all([
      includeMovies
        ? Promise.all(pages.map((page) => fetchTmdbMovies({ ...makeParams(), page })))
        : Promise.resolve([]),
      includeTv
        ? Promise.all(pages.map((page) => fetchTmdbTv({ ...makeParams(), page })))
        : Promise.resolve([]),
    ]);

    const q = queryText.trim().toLowerCase();
    const matchesQuery = (value: MediaItem): boolean => {
      if (!q) return true;
      return value.title.toLowerCase().includes(q);
    };

    const movies = (moviePages as TmdbPageResponse[])
      .flatMap((page) => page.results)
      .filter((movie) => movie.poster_path)
      .map(convertMovie)
      .filter(matchesQuery);
    const tv = (tvPages as Array<{ results: Array<Record<string, unknown>> }>)
      .flatMap((page) => page.results)
      .filter((item) => typeof item.poster_path === "string" && Boolean(item.poster_path))
      .map(convertTvResult)
      .filter((item): item is MediaItem => Boolean(item))
      .filter(matchesQuery);

    const seen = new Set<number>();
    return [...movies, ...tv]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 24);
  };

  const searchHomeMovies = async () => {
    const query = homeSearch.trim();
    const hasFilters = Boolean(
      homeSearchFilters.country || homeSearchFilters.genre || homeSearchFilters.language || homeSearchFilters.mediaType !== "all"
    );

    if (!query && !hasFilters) {
      setHomeSearchError("Enter a title or choose a cinema/genre to explore.");
      setHomeSearchResults([]);
      return;
    }

    setHomeSearchLoading(true);
    setHomeSearchError(null);

    try {
      const converted = hasFilters
        ? await searchFilteredCinema(query, homeSearchFilters)
        : await (async () => {
            const [movieResult, tvResult] = await Promise.all([
              searchTmdbMovies(query),
              searchTmdbTv(query),
            ]);

            const movies = movieResult.results
              .filter((movie) => movie.poster_path)
              .map(convertMovie);
            const tv = tvResult.results
              .filter((item) => typeof item.poster_path === "string" && Boolean(item.poster_path))
              .map(convertTvResult)
              .filter((item): item is MediaItem => Boolean(item));

            const seen = new Set<number>();
            return [...movies, ...tv]
              .filter((item) => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
              })
              .slice(0, 24);
          })();

      setHomeSearchResults(converted);
      if (converted.length === 0) {
        setHomeSearchError(
          hasFilters
            ? "No titles matched that combination of title, cinema, genre and language."
            : "No matching movies or series found."
        );
      }
    } catch (error) {
      console.error("Home title search failed:", error);
      setHomeSearchResults([]);
      setHomeSearchError(error instanceof Error ? error.message : "Title search failed.");
    } finally {
      setHomeSearchLoading(false);
    }
  };

  const getSavedStatusForItem = (itemId: number): "watched" | "watchlist" | "skipped" | null => {
    if (watchedItems.some((item) => item.id === itemId)) return "watched";
    if (watchlistItems.some((item) => item.id === itemId)) return "watchlist";
    if (skippedItems.some((item) => item.id === itemId)) return "skipped";
    return null;
  };

  const saveDetailStarRating = (rating: number) => {
    if (!mediaDetails || rating < 1 || rating > 5) return;
    savePersonalStarRating(mediaDetails.id, rating);
    setSelectedRating(rating);
    setActionMessage(`${mediaDetails.title} rated ${rating} out of 5.`);
  };

  const saveDetailCustomRating = (customRatings: CustomRatingKey[]) => {
    if (!mediaDetails || customRatings.length === 0) return;
    saveCustomRating(mediaDetails.id, customRatings);
    setSelectedCustomRating(customRatings);
    const labels = customRatings.map((key) => CUSTOM_RATING_MAP[key].label).join(" · ");
    setActionMessage(`${mediaDetails.title} marked as ${labels}.`);
  };

  const handleDetailWatched = async () => {
    if (!mediaDetails) return;
    await handleWatched(convertDetailsToMediaItem(mediaDetails));
  };

  const handleDetailWatchlist = async () => {
    if (!mediaDetails) return;
    await handleWatchlist(convertDetailsToMediaItem(mediaDetails));
  };

  const handleDetailSkip = async () => {
    if (!mediaDetails) return;
    await handleSkip(convertDetailsToMediaItem(mediaDetails));
  };

  const closeCustomRatingPanel = () => {
    setPendingRatingItem(null);
    setSelectedCustomRating([]);
    setRatingMode("stars");
  };

  const openCustomRatingForItem = (item: MediaItem) => {
    setPendingRatingItem(item);
    setRatingMode("custom");
    setSelectedRating(personalRatings[item.id] ?? null);
    setSelectedCustomRating(personalCustomRatings[item.id] ?? []);
  };

  const openMediaDetails = async (item: MediaItem) => {
    setMediaDetails(null);
    setMediaDetailsError(null);
    setMediaDetailsLoading(true);

    try {
      const details = await fetchMediaDetails(item);
      setMediaDetails(details);
      setSelectedRating(personalRatings[details.id] ?? null);
      setSelectedCustomRating(personalCustomRatings[details.id] ?? []);
      setRatingMode((personalCustomRatings[details.id]?.length ?? 0) > 0 && !personalRatings[details.id] ? "custom" : "stars");
    } catch (error) {
      console.error("Failed to load media details:", error);
      setMediaDetailsError(
        error instanceof Error ? error.message : "Unable to load title details."
      );
    } finally {
      setMediaDetailsLoading(false);
    }
  };

  const closeMediaDetails = () => {
    setMediaDetails(null);
    setMediaDetailsError(null);
    setMediaDetailsLoading(false);
  };

  useEffect(() => {
    if (!mediaDetails && !mediaDetailsLoading && !mediaDetailsError) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMediaDetails();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mediaDetails, mediaDetailsLoading, mediaDetailsError]);


  useEffect(() => {
    if (!currentUser?.id) {
      setStremioAuthKey(null);
      setStremioLibraryIds(new Set());
      setStremioMessage(null);
      return;
    }

    const storedKey = loadStoredStremioAuthKey(currentUser.id);
    setStremioAuthKey(storedKey);
    setStremioLibraryIds(new Set());
    setStremioMessage(storedKey ? "Checking your Stremio Library…" : null);
  }, [currentUser?.id]);

  const findTmdbMediaByImdbId = async (imdbId: string, expectedType: "movie" | "series"): Promise<MediaItem | null> => {
    const query = new URLSearchParams({
      api_key: getTmdbApiKey(),
      external_source: "imdb_id",
    });

    const response = await fetch(
      `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?${query.toString()}`
    );

    if (!response.ok) {
      throw new Error(`TMDb lookup failed for ${imdbId} (${response.status}).`);
    }

    const data = (await response.json()) as {
      movie_results?: Array<Record<string, unknown>>;
      tv_results?: Array<Record<string, unknown>>;
    };

    const result = expectedType === "series" ? data.tv_results?.[0] : data.movie_results?.[0];

    if (!result) return null;

    const id = Number(result.id);
    const title = String(result.title ?? result.name ?? "").trim();
    const releaseDate = String(result.release_date ?? result.first_air_date ?? "").trim();
    const posterPath = String(result.poster_path ?? "").trim();
    const rawGenreIds = Array.isArray(result.genre_ids) ? result.genre_ids : [];
    const genres = rawGenreIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .map((genreId) => genreMap[genreId])
      .filter(Boolean)
      .slice(0, 2);

    if (!Number.isFinite(id) || !title) return null;

    const series = expectedType === "series";
    const resultGenreIds = Array.isArray(result.genre_ids) ? result.genre_ids.map((value) => Number(value)) : [];
    const resultOriginCountries = Array.isArray(result.origin_country) ? result.origin_country.filter((value): value is string => typeof value === "string") : [];
    const isAnime = series && resultGenreIds.includes(16) && (String(result.original_language ?? "").toLowerCase() === "ja" || resultOriginCountries.includes("JP"));

    return {
      id,
      title,
      year: getYear(releaseDate),
      type: series ? "TV" : "Movie",
      genres: genres.length > 0 ? genres : [series ? "TV" : "Movie"],
      poster: posterPath ? getTmdbImageUrl(posterPath, "w500") : "",
      rating: typeof result.vote_average === "number" ? result.vote_average : 0,
      ...(isAnime ? { isAnime: true } : {}),
    } as MediaItem;
  };

  const ensureSyncedMediaRecord = async (item: MediaItem): Promise<number | null> => {
    const { data: existingMedia, error: findError } = await supabase
      .from("media")
      .select("id")
      .eq("tmdb_id", item.id)
      .maybeSingle();

    if (findError) {
      console.error("Failed to find synced media record:", findError);
      return null;
    }

    if (existingMedia?.id) {
      return existingMedia.id;
    }

    const mediaType = item.type === "TV" ? "TV" : "Movie";
    const releaseDate = item.year > 0 ? `${item.year}-01-01` : null;
    const posterPath = item.poster || null;

    const { data: newMedia, error: insertError } = await supabase
      .from("media")
      .insert({
        tmdb_id: item.id,
        title: item.title,
        original_title: item.title,
        media_type: mediaType,
        release_date: releaseDate,
        poster_path: posterPath,
        genres: item.genres,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create synced media record:", insertError);
      return null;
    }

    return newMedia?.id ?? null;
  };

  const syncStremioEntryToMovo = async (entry: StremioLibraryEntry): Promise<"watched" | "watchlist" | "skipped" | null> => {
    const userId = currentUser?.id;

    if (!userId || !entry.imdbId || entry.stremioType === "other") {
      return "skipped";
    }

    const item = await findTmdbMediaByImdbId(entry.imdbId, entry.stremioType);
    if (!item) {
      console.warn(`No TMDb match found for Stremio title ${entry.imdbId} (${entry.name}).`);
      return "skipped";
    }

    const mediaId = await ensureSyncedMediaRecord(item);
    if (!mediaId) {
      return "skipped";
    }

    const { data: existingUserMedia, error: existingError } = await supabase
      .from("user_media")
      .select("id, status, watched_at, watch_count")
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .maybeSingle();

    if (existingError) {
      console.error(`Failed to read Movo state for ${entry.name}:`, existingError);
      return "skipped";
    }

    const status: "watched" | "watchlist" = entry.isWatched ? "watched" : "watchlist";
    const watchedAt = entry.lastWatched ?? existingUserMedia?.watched_at ?? new Date().toISOString();
    const watchCount = Math.max(
      Number(existingUserMedia?.watch_count ?? 0),
      status === "watched" ? Math.max(entry.timesWatched, 1) : 0
    );

    if (existingUserMedia?.id) {
      // Stremio is the import source here, so do not increment Movo's watch count
      // just because a sync ran again.
      const { error: updateError } = await supabase
        .from("user_media")
        .update({
          status,
          watched_at: status === "watched" ? watchedAt : null,
          watch_count: status === "watched" ? watchCount : existingUserMedia.watch_count ?? 0,
        })
        .eq("id", existingUserMedia.id);

      if (updateError) {
        console.error(`Failed to sync ${entry.name} into Movo:`, updateError);
        return "skipped";
      }

      return status;
    }

    const { error: insertError } = await supabase
      .from("user_media")
      .insert({
        user_id: userId,
        media_id: mediaId,
        status,
        watched_at: status === "watched" ? watchedAt : null,
        watch_count: status === "watched" ? watchCount : 0,
      });

    if (insertError) {
      console.error(`Failed to import ${entry.name} into Movo:`, insertError);
      return "skipped";
    }

    return status;
  };

  const syncStremioLibrary = async (options?: { silent?: boolean }): Promise<Set<string> | null> => {
    if (!stremioAuthKey || !currentUser?.id) {
      if (!options?.silent) {
        setStremioMessage("Connect your Stremio account first.");
      }
      return null;
    }

    setStremioSyncing(true);
    if (!options?.silent) {
      setStremioMessage("Checking your Stremio Library…");
    }

    try {
      const entries = await fetchStremioLibrary(stremioAuthKey);
      const ids = new Set(entries.map((entry) => entry.imdbId));
      setStremioLibraryIds(ids);

      let imported = 0;
      let watched = 0;
      let watchlist = 0;
      let skipped = 0;

      // Import one at a time so a large existing Stremio library does not fire a
      // burst of TMDb/Supabase requests. Re-running sync is safe: existing
      // Movo rows are updated rather than creating duplicate history entries.
      for (const entry of entries) {
        try {
          const result = await syncStremioEntryToMovo(entry);
          if (result === "watched") {
            watched += 1;
            imported += 1;
          } else if (result === "watchlist") {
            watchlist += 1;
            imported += 1;
          } else {
            skipped += 1;
          }
        } catch (entryError) {
          skipped += 1;
          console.error(`Failed to import Stremio library item ${entry.imdbId}:`, entryError);
        }
      }

      await loadUserMedia();

      if (!options?.silent) {
        setStremioMessage(
          `Library synced · ${entries.length.toLocaleString()} Stremio title${entries.length === 1 ? "" : "s"} · ${imported.toLocaleString()} imported to Movo · ${watched.toLocaleString()} watched · ${watchlist.toLocaleString()} watchlist${skipped > 0 ? ` · ${skipped.toLocaleString()} skipped` : ""}`
        );
      }

      return ids;
    } catch (error) {
      console.error("Stremio library sync failed:", error);
      const message = error instanceof Error ? error.message : "Stremio library sync failed.";
      if (/reconnect|401|403|auth/i.test(message)) {
        clearStoredStremioAuthKey(currentUser.id);
        setStremioAuthKey(null);
        setStremioLibraryIds(new Set());
      }
      setStremioMessage(message);
      return null;
    } finally {
      setStremioSyncing(false);
    }
  };

  const connectStremio = async () => {
    if (!currentUser?.id || stremioLinking) return;

    setStremioLinking(true);
    setStremioMessage("Opening Stremio account link…");

    try {
      const { code, link } = await createStremioLink();
      const popup = window.open(link, "movo-stremio-link", "width=520,height=720");

      if (!popup) {
        throw new Error("Your browser blocked the Stremio connection window. Allow popups for Movo and try again.");
      }

      const deadline = Date.now() + 5 * 60 * 1000;
      let connectedKey: string | null = null;

      while (Date.now() < deadline && !connectedKey) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        connectedKey = await readStremioLink(code);
      }

      if (!connectedKey) {
        throw new Error("The Stremio account link expired or was not approved.");
      }

      const authKey = await exchangeStremioLinkToken(connectedKey);
      saveStoredStremioAuthKey(currentUser.id, authKey);
      setStremioAuthKey(authKey);
      setStremioMessage("Stremio connected · importing your Library into Movo…");

      const entries = await fetchStremioLibrary(authKey);
      setStremioLibraryIds(new Set(entries.map((entry) => entry.imdbId)));

      let imported = 0;
      let watched = 0;
      let watchlist = 0;
      let skipped = 0;

      for (const entry of entries) {
        try {
          const result = await syncStremioEntryToMovo(entry);
          if (result === "watched") {
            watched += 1;
            imported += 1;
          } else if (result === "watchlist") {
            watchlist += 1;
            imported += 1;
          } else {
            skipped += 1;
          }
        } catch (entryError) {
          skipped += 1;
          console.error(`Failed to import Stremio library item ${entry.imdbId}:`, entryError);
        }
      }

      await loadUserMedia();
      setStremioMessage(
        `Stremio connected · ${imported.toLocaleString()} imported to Movo · ${watched.toLocaleString()} watched · ${watchlist.toLocaleString()} watchlist${skipped > 0 ? ` · ${skipped.toLocaleString()} skipped` : ""}`
      );

      try {
        popup?.close();
      } catch {
        // Ignore popup close failures.
      }
    } catch (error) {
      console.error("Stremio connection failed:", error);
      setStremioMessage(error instanceof Error ? error.message : "Unable to connect Stremio.");
    } finally {
      setStremioLinking(false);
    }
  };

  useEffect(() => {
    if (!stremioAuthKey) return;
    void syncStremioLibrary({ silent: true });
  }, [stremioAuthKey]);

  const disconnectStremio = async () => {
    if (!currentUser?.id || !stremioAuthKey) return;

    try {
      await fetch(`${STREMIO_API_BASE}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authKey: stremioAuthKey, type: "Logout" }),
      });
    } catch (error) {
      console.error("Stremio logout request failed:", error);
    }

    clearStoredStremioAuthKey(currentUser.id);
    setStremioAuthKey(null);
    setStremioLibraryIds(new Set());
    setStremioMessage("Stremio disconnected.");
  };

  const isTitleInStremioLibrary = (details: MediaDetails): boolean => {
    if (!details.imdbId) return false;
    return stremioLibraryIds.has(details.imdbId);
  };

  const handleOpenStremio = async (details: MediaDetails) => {
    if (!details.imdbId) {
      openStremio(details);
      return;
    }

    setStremioPendingTitleId(details.imdbId);
    openStremio(details);

    // Give Stremio a moment to process an Add to Library action. When the
    // user returns to Movo, visibility/focus sync below also performs a check.
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    await syncStremioLibrary({ silent: true });
    setStremioPendingTitleId((current) => (current === details.imdbId ? null : current));
  };

  useEffect(() => {
    if (!stremioAuthKey) return;

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        void syncStremioLibrary({ silent: true });
      }
    };

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [stremioAuthKey]);

  const openStremio = (details: MediaDetails) => {
    if (!details.imdbId) {
      window.open("https://www.stremio.com/", "_blank", "noopener,noreferrer");
      return;
    }

    const type = details.type === "tv" ? "series" : "movie";
    const deepLink = `stremio:///detail/${type}/${encodeURIComponent(details.imdbId)}/${encodeURIComponent(details.imdbId)}`;
    window.location.href = deepLink;
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>, item: MediaItem) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) {
      return;
    }
    void openMediaDetails(item);
  };

  const updateHomeFilter = (key: keyof HomeFilters, value: string) => {
    setHomeFilters((current) => ({ ...current, [key]: value }));
  };

  const removeSuggestion = (item: MediaItem) => {
    setSuggestions((current) => current.filter((suggestion) => suggestion.id !== item.id));
  };

  const replenishSuggestions = () => {
    window.setTimeout(() => {
      void loadSuggestions(false);
    }, 0);
  };

  const removeUserMedia = async (item: MediaItem): Promise<boolean> => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Unable to get current user while removing saved media:", userError);
      return false;
    }

    const { data: mediaRow, error: mediaError } = await supabase
      .from("media")
      .select("id")
      .eq("tmdb_id", item.id)
      .maybeSingle();

    if (mediaError) {
      console.error("Failed to find media while removing saved media:", mediaError);
      return false;
    }

    if (!mediaRow?.id) {
      return true;
    }

    const { error: deleteError } = await supabase
      .from("user_media")
      .delete()
      .eq("user_id", user.id)
      .eq("media_id", mediaRow.id);

    if (deleteError) {
      console.error("Failed to remove saved media:", deleteError);
      return false;
    }

    return true;
  };

  const handleWatched = async (item: MediaItem) => {
    const saved = await saveUserMedia(item, "watched");

    if (!saved) {
      return;
    }

    const watchedAt = new Date().toISOString();

    setWatchedItems((current) => [item, ...current.filter((existing) => existing.id !== item.id)]);
    setWatchedMeta((current) => ({
      ...current,
      [item.id]: {
        watchedAt,
        watchCount: (current[item.id]?.watchCount ?? 0) + 1,
      },
    }));
    setWatchlistItems((current) => current.filter((existing) => existing.id !== item.id));
    setSkippedItems((current) => current.filter((existing) => existing.id !== item.id));

    // Keep the watched title visible until the inline rating is answered.
    setActionMessage(`${item.title} added to your history.`);
    setSelectedRating(personalRatings[item.id] ?? null);
    setPendingRatingItem(item);
  };

  const handleWatchlist = async (item: MediaItem) => {
    const saved = await saveUserMedia(item, "watchlist");

    if (!saved) {
      return;
    }

    setWatchlistItems((current) => [
      ...current.filter((existing) => existing.id !== item.id),
      item,
    ]);
    setWatchedItems((current) => current.filter((existing) => existing.id !== item.id));
    setWatchedMeta((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setSkippedItems((current) => current.filter((existing) => existing.id !== item.id));
    removeSuggestion(item);

    setActionMessage(`${item.title} added to your watchlist.`);
    replenishSuggestions();
  };

  const handleSkip = async (item: MediaItem) => {
    const removed = await removeUserMedia(item);

    if (!removed) {
      setActionMessage(`Couldn't move ${item.title} to Skipped. Please try again.`);
      return;
    }

    setSkippedItems((current) => [item, ...current.filter((existing) => existing.id !== item.id)]);
    setWatchlistItems((current) => current.filter((existing) => existing.id !== item.id));
    setWatchedItems((current) => current.filter((existing) => existing.id !== item.id));
    setWatchedMeta((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    removeSuggestion(item);
    setActionMessage(`${item.title} skipped.`);
    replenishSuggestions();
  };

  const refreshSuggestions = async () => {
    await loadSuggestions(true);
  };

  const buildMemoryLane = () => {
    const cinema = cinemaOptions[randomInteger(0, cinemaOptions.length - 1)];
    const decade = memoryDecades[randomInteger(0, memoryDecades.length - 1)];
    const genreEntries = Object.entries(genreMap);
    const genreEntry = genreEntries[randomInteger(0, genreEntries.length - 1)];

    return {
      cinema,
      decade,
      genre: genreEntry,
    };
  };

  const loadMemorySuggestions = async () => {
    setMemoryRandomLoading(true);
    setMemoryError(null);

    try {
      const excludedIds = new Set([
        ...watchedItems.map((item) => item.id),
        ...watchlistItems.map((item) => item.id),
        ...skippedItems.map((item) => item.id),
      ]);

      const lane = buildMemoryLane();
      const [genreId, genreName] = lane.genre;
      const bounds = decadeBounds(lane.decade);

      const baseParams: Record<string, string | number | boolean> = {
        page: randomInteger(1, 12),
        with_origin_country: lane.cinema.country,
        with_original_language: lane.cinema.language,
        with_genres: genreId,
      };

      if (bounds) {
        baseParams["primary_release_date.gte"] = bounds.start;
        baseParams["primary_release_date.lte"] = bounds.end;
      }

      const responses = await Promise.all([
        fetchTmdbMovies(baseParams),
        fetchTmdbMovies({
          ...baseParams,
          page: randomInteger(1, 12),
          sort_by: "vote_average.desc",
        }),
      ]);

      const merged = responses
        .flatMap((response) => response.results)
        .filter((movie) => movie.poster_path)
        .map(convertMovie)
        .filter((item) => !excludedIds.has(item.id))
        .sort(() => Math.random() - 0.5)
        .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
        .slice(0, 12);

      setMemoryLane({
        cinema: lane.cinema.label,
        decade: lane.decade,
        genre: genreName,
      });
      setMemoryResults(merged);

      if (merged.length === 0) {
        setMemoryError("That memory lane came up empty. Shuffle it and try another one.");
      }
    } catch (error) {
      console.error("Failed to load Memory suggestions:", error);
      setMemoryResults([]);
      setMemoryError(
        error instanceof Error
          ? error.message
          : "Unable to load memory suggestions from TMDb."
      );
    } finally {
      setMemoryRandomLoading(false);
    }
  };

  const searchMemory = async () => {
    const query = memorySearch.trim();

    if (!query) {
      setMemoryError("Write a few clues you remember first.");
      setMemoryResults([]);
      setMemoryInterpretation(null);
      return;
    }

    setMemorySearchLoading(true);
    setMemoryError(null);
    setMemoryInterpretation(null);
    setMemoryLane(null);

    try {
      const aiResult = await findMemoryCandidates(query);
      setMemoryInterpretation(aiResult.interpretation || "Movo interpreted your memory and is checking likely matches.");

      const excludedIds = new Set([
        ...watchedItems.map((item) => item.id),
        ...watchlistItems.map((item) => item.id),
        ...skippedItems.map((item) => item.id),
      ]);

      const searches = await Promise.all(
        aiResult.candidates.slice(0, 6).map(async (candidate) => {
          const terms = Array.from(
            new Set([candidate.title, ...candidate.alternateTitles, ...candidate.searchTerms])
          )
            .map((term) => term.trim())
            .filter(Boolean)
            .slice(0, 4);

          const responses = await Promise.all(
            terms.map(async (term) => {
              try {
                return await searchTmdbMovies(term);
              } catch {
                return null;
              }
            })
          );

          const verifiedMovies = responses
            .filter((response): response is TmdbPageResponse => Boolean(response))
            .flatMap((response) => response.results)
            .filter((movie) => movie.poster_path)
            .filter(
              (movie, index, all) =>
                all.findIndex((candidateMovie) => candidateMovie.id === movie.id) === index
            );

          const normaliseTitle = (value: string) =>
            value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, " ")
              .trim();

          const targetTitle = normaliseTitle(candidate.title);
          const best = [...verifiedMovies].sort((a, b) => {
            const aTitle = normaliseTitle(a.title);
            const bTitle = normaliseTitle(b.title);
            const aExact = aTitle === targetTitle ? 1 : aTitle.includes(targetTitle) || targetTitle.includes(aTitle) ? 0.7 : 0;
            const bExact = bTitle === targetTitle ? 1 : bTitle.includes(targetTitle) || targetTitle.includes(bTitle) ? 0.7 : 0;
            const aYear = candidate.year && getYear(a.release_date) === candidate.year ? 0.25 : 0;
            const bYear = candidate.year && getYear(b.release_date) === candidate.year ? 0.25 : 0;
            const aScore = aExact + aYear + a.vote_average / 1000;
            const bScore = bExact + bYear + b.vote_average / 1000;
            return bScore - aScore;
          })[0];

          return best
            ? {
                item: convertMovie(best),
                candidate,
              }
            : null;
        })
      );

      const seen = new Set<number>();
      const verifiedResults: MediaItem[] = [];

      searches.forEach((result) => {
        if (!result || excludedIds.has(result.item.id) || seen.has(result.item.id)) {
          return;
        }

        seen.add(result.item.id);
        verifiedResults.push(result.item);
      });

      if (verifiedResults.length === 0) {
        const fallback = await searchTmdbMovies(query);
        verifiedResults.push(
          ...fallback.results
            .filter((movie) => movie.poster_path)
            .map(convertMovie)
            .filter((item) => !excludedIds.has(item.id))
            .slice(0, 6)
        );
      }

      setMemoryResults(verifiedResults.slice(0, 12));

      if (verifiedResults.length === 0) {
        setMemoryError(
          "Movo couldn't verify a likely title in TMDb. Try adding one more clue such as an actor, country, approximate year, character, or a distinctive scene."
        );
      }
    } catch (error) {
      console.error("Memory search failed:", error);
      setMemoryResults([]);
      setMemoryInterpretation(null);
      setMemoryError(
        error instanceof Error ? error.message : "Memory search failed."
      );
    } finally {
      setMemorySearchLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || currentView !== "memory") {
      return;
    }

    if (memoryResults.length > 0 || memoryRandomLoading || memorySearchLoading) {
      return;
    }

    void loadMemorySuggestions();
  }, [currentView, isAuthenticated]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(
        `movo-personal-ratings:${currentUser.id}`
      );

      if (!stored) {
        setPersonalRatings({});
        return;
      }

      const parsed = JSON.parse(stored) as Record<string, number>;
      const normalized: Record<number, number> = {};

      Object.entries(parsed).forEach(([key, value]) => {
        const id = Number(key);

        if (
          Number.isFinite(id) &&
          Number.isInteger(value) &&
          value >= 1 &&
          value <= 5
        ) {
          normalized[id] = value;
        }
      });

      setPersonalRatings(normalized);
    } catch (error) {
      console.error("Failed to load personal ratings:", error);
      setPersonalRatings({});
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setPersonalCustomRatings({});
      return;
    }

    try {
      const stored = window.localStorage.getItem(`movo-personal-custom-ratings:${currentUser.id}`);
      if (!stored) {
        setPersonalCustomRatings({});
        return;
      }
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      const normalized: Record<number, CustomRatingKey[]> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const id = Number(key);
        if (!Number.isFinite(id)) return;
        const values = Array.isArray(value) ? value : [value];
        const migrated = values
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry === "absolute-nostalgia" ? "pure-nostalgia" : entry)
          .filter((entry): entry is string => entry in CUSTOM_RATING_MAP) as CustomRatingKey[];
        if (migrated.length > 0) normalized[id] = Array.from(new Set(migrated));
      });
      setPersonalCustomRatings(normalized);
    } catch (error) {
      console.error("Failed to load custom ratings:", error);
      setPersonalCustomRatings({});
    }
  }, [currentUser?.id]);

  const saveCustomRating = (itemId: number, customRatings: CustomRatingKey[]) => {
    const cleaned = Array.from(new Set(customRatings));
    let nextRatings: Record<number, CustomRatingKey[]> = { ...personalCustomRatings };

    // Read the latest persisted value first so rapid multi-select clicks cannot
    // overwrite an earlier selection with a stale React state snapshot.
    if (currentUser?.id) {
      try {
        const stored = window.localStorage.getItem(`movo-personal-custom-ratings:${currentUser.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          nextRatings = {};
          Object.entries(parsed).forEach(([key, value]) => {
            const id = Number(key);
            if (!Number.isFinite(id)) return;
            const values = Array.isArray(value) ? value : [value];
            const migrated = values
              .filter((entry): entry is string => typeof entry === "string")
              .map((entry) => entry === "absolute-nostalgia" ? "pure-nostalgia" : entry)
              .filter((entry): entry is CustomRatingKey => entry in CUSTOM_RATING_MAP);
            if (migrated.length > 0) {
              nextRatings[id] = Array.from(new Set(migrated));
            }
          });
        }
      } catch (error) {
        console.error("Failed to read custom ratings before save:", error);
      }
    }

    if (cleaned.length > 0) {
      nextRatings[itemId] = cleaned;
    } else {
      delete nextRatings[itemId];
    }

    setPersonalCustomRatings(nextRatings);

    if (currentUser?.id) {
      try {
        window.localStorage.setItem(`movo-personal-custom-ratings:${currentUser.id}`, JSON.stringify(nextRatings));
      } catch (error) {
        console.error("Failed to save custom rating:", error);
      }
    }
  };

  const handleCustomRatingSubmit = (customRatings: CustomRatingKey[]) => {
    if (!pendingRatingItem || customRatings.length === 0) return;
    const ratedItem = pendingRatingItem;

    // A single rating session can contain both a star score and one or more
    // personal marks. Persist both before closing the editor so switching
    // Stars -> Custom never discards an unsaved star selection.
    if (selectedRating && selectedRating >= 1 && selectedRating <= 5) {
      savePersonalStarRating(ratedItem.id, selectedRating);
    }
    saveCustomRating(ratedItem.id, customRatings);

    setPendingRatingItem(null);
    setSelectedRating(null);
    setSelectedCustomRating([]);
    setRatingMode("stars");
    removeSuggestion(ratedItem);
    setMemoryResults((current) => current.filter((candidate) => candidate.id !== ratedItem.id));
    replenishSuggestions();
    const labels = customRatings
      .map((key) => CUSTOM_RATING_MAP[key]?.label)
      .filter(Boolean)
      .join(" · ");
    setActionMessage(`${ratedItem.title} marked as ${labels}.`);
  };

  const handleSavedListStarRating = (item: MediaItem, rating: number) => {
    savePersonalStarRating(item.id, rating);
    if (pendingRatingItem?.id === item.id) {
      closeCustomRatingPanel();
    }
    setActionMessage(`${item.title} rated ${rating} out of 5.`);
  };

  const savePersonalStarRating = (itemId: number, rating: number) => {
    const nextRatings = {
      ...personalRatings,
      [itemId]: rating,
    };

    setPersonalRatings(nextRatings);

    if (currentUser?.id) {
      try {
        window.localStorage.setItem(
          `movo-personal-ratings:${currentUser.id}`,
          JSON.stringify(nextRatings)
        );
      } catch (error) {
        console.error("Failed to save personal rating:", error);
      }
    }
  };

  const handleRatingSubmit = (rating: number) => {
    if (!pendingRatingItem || rating < 1 || rating > 5) {
      return;
    }

    const ratedItem = pendingRatingItem;
    savePersonalStarRating(ratedItem.id, rating);

    // Preserve any custom marks selected earlier in the same editor session.
    if (selectedCustomRating.length > 0) {
      saveCustomRating(ratedItem.id, selectedCustomRating);
    }

    setPendingRatingItem(null);
    setSelectedRating(null);
    setSelectedCustomRating([]);
    setRatingMode("stars");
    removeSuggestion(ratedItem);
    setMemoryResults((current) =>
      current.filter((candidate) => candidate.id !== ratedItem.id)
    );
    replenishSuggestions();
    setActionMessage(
      `You rated ${ratedItem.title} ${rating} out of 5.`
    );
  };

  const handleRatingSkip = () => {
    const ratingItem = pendingRatingItem;
    setPendingRatingItem(null);
    setSelectedRating(null);
    setSelectedCustomRating([]);
    setRatingMode("stars");

    if (ratingItem) {
      removeSuggestion(ratingItem);
      setMemoryResults((current) =>
        current.filter((candidate) => candidate.id !== ratingItem.id)
      );
      replenishSuggestions();
    }

    setActionMessage(
      "Rating skipped. You can still rate it later from your history."
    );
  };

  const handleMemoryWatched = async (item: MediaItem) => {
    // Keep the memory card visible while the inline rating is being answered.
    await handleWatched(item);
  };

  const handleMemoryWatchlist = async (item: MediaItem) => {
    await handleWatchlist(item);
    setMemoryResults((current) =>
      current.filter((candidate) => candidate.id !== item.id)
    );
  };

  const handleMemorySkip = async (item: MediaItem) => {
    await handleSkip(item);
    setMemoryResults((current) =>
      current.filter((candidate) => candidate.id !== item.id)
    );
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setActionMessage("Unable to sign out. Please try again.");
      return;
    }

    navigateToView("home");
    setCurrentUser(null);
    setWatchedItems([]);
    setWatchlistItems([]);
    setWatchedMeta({});
    setSkippedItems([]);
    setSuggestions([]);
    hydratedSuggestionUserRef.current = null;
    setMemoryResults([]);
    setMemorySearch("");
    setMemoryLane(null);
    setPendingRatingItem(null);
    setSelectedRating(null);
    setSelectedCustomRating([]);
    setRatingMode("stars");
    setPersonalRatings({});
    setPersonalCustomRatings({});
    setActionMessage(null);
  };

  const getSavedTypeLabel = (type: string) => (type === "TV" ? "TV" : "Movie");

  const filterAndSortSavedItems = (
    items: MediaItem[],
    filters: SavedListFilters,
    meta?: Record<number, UserMediaMeta>,
    ratings?: Record<number, number>,
    customRatings?: Record<number, CustomRatingKey[]>
  ) => {
    const yearFrom = Number(filters.yearFrom);
    const yearTo = Number(filters.yearTo);

    const filtered = items.filter((item) => {
      if (filters.type !== "all" && item.type !== filters.type) return false;
      if (filters.genre && !item.genres.includes(filters.genre)) return false;
      if (filters.yearFrom && (!Number.isFinite(yearFrom) || item.year < yearFrom)) return false;
      if (filters.yearTo && (!Number.isFinite(yearTo) || item.year > yearTo)) return false;
      if (filters.customRating && !(customRatings?.[item.id] ?? []).includes(filters.customRating as CustomRatingKey)) return false;
      return true;
    });

    return filtered.slice().sort((a, b) => {
      switch (filters.sort) {
        case "oldest": {
          const aDate = meta?.[a.id]?.watchedAt ?? "";
          const bDate = meta?.[b.id]?.watchedAt ?? "";
          return aDate.localeCompare(bDate);
        }
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "year-desc":
          return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title);
        case "year-asc":
          return (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title);
        case "rating-desc":
          return (ratings?.[b.id] ?? 0) - (ratings?.[a.id] ?? 0) || a.title.localeCompare(b.title);
        case "rating-asc":
          return (ratings?.[a.id] ?? 0) - (ratings?.[b.id] ?? 0) || a.title.localeCompare(b.title);
        case "custom-desc": {
          const aRank = (customRatings?.[a.id] ?? []).reduce((best, key) => Math.max(best, CUSTOM_RATING_MAP[key]?.rank ?? 0), 0);
          const bRank = (customRatings?.[b.id] ?? []).reduce((best, key) => Math.max(best, CUSTOM_RATING_MAP[key]?.rank ?? 0), 0);
          return bRank - aRank || a.title.localeCompare(b.title);
        }
        case "custom-asc": {
          const aRank = (customRatings?.[a.id] ?? []).reduce((best, key) => Math.max(best, CUSTOM_RATING_MAP[key]?.rank ?? 0), 0);
          const bRank = (customRatings?.[b.id] ?? []).reduce((best, key) => Math.max(best, CUSTOM_RATING_MAP[key]?.rank ?? 0), 0);
          return aRank - bRank || a.title.localeCompare(b.title);
        }
        case "recent":
        default:
          if (meta) {
            const aDate = meta[a.id]?.watchedAt ?? "";
            const bDate = meta[b.id]?.watchedAt ?? "";
            return bDate.localeCompare(aDate);
          }
          return 0;
      }
    });
  };

  const watchlistDisplayItems = useMemo(
    () => filterAndSortSavedItems(watchlistItems, watchlistFilters, undefined, personalRatings, personalCustomRatings),
    [watchlistItems, watchlistFilters, personalRatings, personalCustomRatings]
  );

  const skippedDisplayItems = useMemo(
    () => filterAndSortSavedItems(skippedItems, watchlistFilters, undefined, personalRatings, personalCustomRatings),
    [skippedItems, watchlistFilters, personalRatings, personalCustomRatings]
  );

  const historyItems = useMemo(() => watchedItems, [watchedItems]);
  const historyDisplayItems = useMemo(
    () => filterAndSortSavedItems(historyItems, historyFilters, watchedMeta, personalRatings, personalCustomRatings),
    [historyItems, historyFilters, watchedMeta, personalRatings, personalCustomRatings]
  );

  const displayName = currentUser?.name ?? "Movo user";
  const profileInitial = currentUser?.initial ?? "M";

  const cardGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "30px 18px",
  };

  if (isAuthenticated === null) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-mark">M</div>
        <p>Initializing Movo...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Auth
        onAuthenticated={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const renderHome = () => (
    <div className="home-content">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">YOUR PERSONAL MEDIA SPACE</p>
          <h1>
            What are
            <br />
            you watching?
          </h1>
          <p className="hero-description">
            Keep track of everything you've watched, discover something new,
            and build a library that actually feels like yours.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigateToView("memory")}>
              <span>◌</span>
              Memory
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setHomeSearchOpen((open) => !open);
                setHomeFilterOpen(false);
              }}
            >
              <span>⌕</span>
              Search
            </button>
            <button className="secondary-button" onClick={() => navigateToView("watchlist")}>
              Browse watchlist
              <span>→</span>
            </button>
          </div>
        </div>

        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <span>M</span>
          </div>
          <div className="orbit-dot dot-one" />
          <div className="orbit-dot dot-two" />
          <div className="orbit-dot dot-three" />
        </div>
      </section>

      {homeSearchOpen && (
        <section className="home-tool-panel">
          <div className="home-tool-header">
            <div>
              <p className="eyebrow">SEARCH TITLES</p>
              <h3>Find a movie or series</h3>
            </div>
            <button className="text-button" onClick={() => setHomeSearchOpen(false)}>Close</button>
          </div>
          <div className="home-search-row">
            <input
              className="home-search-input"
              value={homeSearch}
              onChange={(event) => setHomeSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchHomeMovies();
              }}
              placeholder="Search a title, or leave blank to explore a cinema / genre…"
              autoFocus
            />
            <button className="primary-button" onClick={() => void searchHomeMovies()} disabled={homeSearchLoading}>
              {homeSearchLoading ? "Searching…" : "Search"}
            </button>
          </div>
          <div className="home-search-filters">
            <label>
              Type
              <select value={homeSearchFilters.mediaType} onChange={(event) => setHomeSearchFilters((current) => ({ ...current, mediaType: event.target.value as HomeSearchFilters["mediaType"] }))}>
                <option value="all">Movies + series</option>
                <option value="movie">Movies only</option>
                <option value="tv">Series only</option>
              </select>
            </label>
            <label>
              Cinema / region
              <select value={homeSearchFilters.country} onChange={(event) => setHomeSearchFilters((current) => ({ ...current, country: event.target.value }))}>
                <option value="">Everywhere</option>
                {cinemaOptions.map((option) => <option key={option.country} value={option.country}>{option.label}</option>)}
              </select>
            </label>
            <label>
              Genre
              <select value={homeSearchFilters.genre} onChange={(event) => setHomeSearchFilters((current) => ({ ...current, genre: event.target.value }))}>
                <option value="">Every genre</option>
                {Object.entries(genreMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label>
              Original language
              <select value={homeSearchFilters.language} onChange={(event) => setHomeSearchFilters((current) => ({ ...current, language: event.target.value }))}>
                <option value="">Any language</option>
                {Array.from(new Map(cinemaOptions.map((option) => [option.language, option.label]))).map(([code, label]) => <option key={code} value={code}>{label} · {code}</option>)}
              </select>
            </label>
            <button type="button" className="text-button home-search-clear" onClick={() => setHomeSearchFilters({ mediaType: "all", country: "", genre: "", language: "" })}>Clear explore filters</button>
          </div>
          <p className="home-search-hint">Region + genre filters use TMDb discovery, so Movo can reach cinema from India, France, Japan, Korea, Italy, Mexico and more instead of treating search as English-only title lookup.</p>
          {homeSearchError && <p className="home-tool-error">{homeSearchError}</p>}
          {homeSearchResults.length > 0 && (
            <div className="home-search-results">
              {homeSearchResults.map((item) => (
                <div
                  className="home-search-result"
                  key={`${item.type}-${item.id}`}
                  onClick={() => void openMediaDetails(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") void openMediaDetails(item);
                  }}
                >
                  <img src={item.poster} alt={`${item.title} poster`} loading="lazy" />
                  <div className="home-search-result-copy">
                    <strong>{item.title}</strong>
                    <span>{item.type} · {item.year || "Year unknown"}</span>
                  </div>
                  <div className="home-search-result-rating" aria-label={`TMDb rating ${item.rating ? item.rating.toFixed(1) : "unavailable"}`}>
                    <span>TMDb</span>
                    <strong>{item.rating ? item.rating.toFixed(1) : "—"}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="media-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">DISCOVER</p>
            <h2>You might like</h2>
          </div>
          <div className="media-heading-actions">
            <button
              className={`view-all-button ${homeFilterOpen ? "is-active" : ""}`}
              onClick={() => {
                setHomeFilterOpen((open) => !open);
                setHomeSearchOpen(false);
              }}
            >
              <span>≡</span> Filters
            </button>
            <button
              className="view-all-button"
              onClick={refreshSuggestions}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "New list"} {!isLoading && <span>↻</span>}
            </button>
          </div>
        </div>

        {homeFilterOpen && (
          <div className="home-filter-panel">
            <div className="filter-grid">
              <label>Media type<select value={homeFilters.mediaType} onChange={(e) => updateHomeFilter("mediaType", e.target.value)}><option value="all">Movies + series</option><option value="movie">Movies only</option><option value="tv">Series only</option></select></label>
              <label>Year from<input value={homeFilters.yearFrom} onChange={(e) => updateHomeFilter("yearFrom", e.target.value)} inputMode="numeric" placeholder="1950" /></label>
              <label>Year to<input value={homeFilters.yearTo} onChange={(e) => updateHomeFilter("yearTo", e.target.value)} inputMode="numeric" placeholder="2026" /></label>
              <label>Genre<select value={homeFilters.genre} onChange={(e) => updateHomeFilter("genre", e.target.value)}><option value="">Any genre</option>{Object.entries(genreMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
              <label>Country<select value={homeFilters.country} onChange={(e) => updateHomeFilter("country", e.target.value)}><option value="">Any country</option>{cinemaOptions.map((option) => <option key={option.country} value={option.country}>{option.label}</option>)}</select></label>
              <label>Language<select value={homeFilters.language} onChange={(e) => updateHomeFilter("language", e.target.value)}><option value="">Any language</option>{Array.from(new Map(cinemaOptions.map((option) => [option.language, option.label]))).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
              <label>Minimum rating<select value={homeFilters.minRating} onChange={(e) => updateHomeFilter("minRating", e.target.value)}><option value="">Any rating</option>{[5, 6, 7, 8, 9].map((value) => <option key={value} value={value}>{value}.0+</option>)}</select></label>
              <label>Certificate country<select value={homeFilters.certificationCountry} onChange={(e) => { updateHomeFilter("certificationCountry", e.target.value); updateHomeFilter("certification", ""); }}><option value="IN">India</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="AU">Australia</option><option value="CA">Canada</option></select></label>
              <label>Movie certificate<select value={homeFilters.certification} onChange={(e) => updateHomeFilter("certification", e.target.value)}><option value="">Any</option><option value="__unrated__">Unrated / no certificate</option>{homeFilters.certificationCountry === "IN" && <><option value="U">U</option><option value="UA">UA</option><option value="UA 7+">UA 7+</option><option value="UA 13+">UA 13+</option><option value="UA 16+">UA 16+</option><option value="A">A</option><option value="S">S</option></>}{homeFilters.certificationCountry === "US" && <><option value="G">G</option><option value="PG">PG</option><option value="PG-13">PG-13</option><option value="R">R</option><option value="NC-17">NC-17</option></>}{homeFilters.certificationCountry === "GB" && <><option value="U">U</option><option value="PG">PG</option><option value="12">12</option><option value="12A">12A</option><option value="15">15</option><option value="18">18</option></>}{homeFilters.certificationCountry === "AU" && <><option value="G">G</option><option value="PG">PG</option><option value="M">M</option><option value="MA15+">MA15+</option><option value="R18+">R18+</option></>}{homeFilters.certificationCountry === "CA" && <><option value="G">G</option><option value="PG">PG</option><option value="14A">14A</option><option value="18A">18A</option><option value="R">R</option></>}</select></label>
            </div>
            <div className="filter-actions">
              <button className="text-button" onClick={() => void clearHomeFilters()}>Clear</button>
              <button className="primary-button" onClick={() => void applyHomeFilters()} disabled={isLoading}>Apply filters</button>
            </div>
          </div>
        )}

        {actionMessage && !isLoading && (
          <div className="action-message">
            <span>✓</span>
            {actionMessage}
          </div>
        )}

        {loadError && suggestions.length === 0 ? (
          <div className="empty-suggestions">
            <div className="empty-suggestions-icon">!</div>
            <h3>Couldn't load suggestions.</h3>
            <p>{loadError}</p>
            <button className="primary-button" onClick={refreshSuggestions}>
              <span>↻</span>
              Try again
            </button>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="media-grid" style={cardGridStyle}>
            {suggestions.map((item) => (
              <div
                className="suggestion-with-rating clickable-media-card"
                key={item.id}
                onClick={(event) => handleCardClick(event, item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") void openMediaDetails(item);
                }}
              >
                <div className="movo-visible-card-rating" aria-label={`TMDb rating ${item.rating ? item.rating.toFixed(1) : "unavailable"}`}>
                  <span>TMDb</span>
                  <strong>{item.rating ? item.rating.toFixed(1) : "—"}</strong>
                </div>
                <MediaCard
                  item={item}
                  onWatched={handleWatched}
                  onWatchlist={handleWatchlist}
                  onSkip={handleSkip}
                />

                {pendingRatingItem?.id === item.id && (
                  <div className="suggestion-rating-row">
                    <div className="rating-mode-tabs" role="tablist" aria-label="Rating type">
                      <button type="button" className={`rating-mode-tab ${ratingMode === "stars" ? "active" : ""}`} onClick={() => setRatingMode("stars")}>Stars</button>
                      <button type="button" className={`rating-mode-tab ${ratingMode === "custom" ? "active" : ""}`} onClick={() => setRatingMode("custom")}>Custom</button>
                    </div>
                    {ratingMode === "stars" ? (
                      <>
                        <span className="suggestion-rating-prompt">How did you like it?</span>
                        <div className="suggestion-rating-stars" aria-label="Choose a rating from one to five stars">
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const isSelected = Boolean(selectedRating && rating <= selectedRating);
                            return (
                              <button key={rating} type="button" className={`suggestion-rating-star ${isSelected ? "filled" : "empty"}`} onMouseEnter={() => setSelectedRating(rating)} onFocus={() => setSelectedRating(rating)} onClick={() => setSelectedRating(rating)} aria-label={`${rating} star${rating === 1 ? "" : "s"}`}>
                                {isSelected ? "★" : "☆"}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="suggestion-rating-prompt">How did it feel? Choose any that fit for this {getCustomRatingProfile(item)}.</span>
                        <div className="custom-rating-options suggestion-custom-rating-options">
                          {getCustomRatingsForItem(item).map((rating) => {
                            const isSelected = selectedCustomRating.includes(rating.key);
                            return (
                              <button key={rating.key} type="button" className={`custom-rating-option ${isSelected ? "selected" : ""}`} onClick={() => setSelectedCustomRating((current) => isSelected ? current.filter((key) => key !== rating.key) : [...current, rating.key])} title={rating.description} aria-pressed={isSelected} aria-label={`${rating.label}: ${rating.description}`}>
                                <span className="custom-rating-symbol">{rating.symbol}</span>
                                <span className="custom-rating-label">{rating.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                    <div className="suggestion-rating-actions">
                      <button type="button" className="suggestion-rating-save" disabled={ratingMode === "stars" ? !selectedRating : selectedCustomRating.length === 0} onClick={() => {
                        if (ratingMode === "stars" && selectedRating) {
                          handleRatingSubmit(selectedRating);
                        } else if (ratingMode === "custom" && selectedCustomRating.length > 0) {
                          handleCustomRatingSubmit(selectedCustomRating);
                        }
                      }}>Save</button>
                      <button type="button" className="suggestion-rating-later" onClick={handleRatingSkip}>Later</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-suggestions">
            <div className="empty-suggestions-icon">✦</div>
            <h3>We're filling the shelf.</h3>
            <p>Movo is looking for a fresh mix of titles for you.</p>
          </div>
        )}

        <div className="home-bottom-actions">
          <button
            type="button"
            className="home-bottom-new-list"
            onClick={refreshSuggestions}
            disabled={isLoading}
          >
            <span className="home-bottom-new-list-icon">↻</span>
            {isLoading ? "Loading..." : "New list"}
          </button>
          {isLoadingMore && (
            <span className="home-bottom-loading">Finding more for you…</span>
          )}
        </div>

        <div className="tracking-summary">
          <div>
            <span className="summary-number">{watchedItems.length}</span>
            <span className="summary-label">Watched</span>
          </div>
          <div>
            <span className="summary-number">{watchlistItems.length}</span>
            <span className="summary-label">Watchlist</span>
          </div>
          <div>
            <span className="summary-number">{skippedItems.length}</span>
            <span className="summary-label">Skipped</span>
          </div>
        </div>

        <div className="action-message">
          <span>
            {supabaseStatus === "checking" ? "..." : supabaseStatus === "connected" ? "✓" : "!"}
          </span>
          {supabaseStatus === "checking"
            ? "Checking Movo database..."
            : supabaseStatus === "connected"
            ? "Movo database connected."
            : "Movo database connection failed. Check the browser console."}
        </div>
      </section>

      <section className="library-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h2>Library</h2>
          </div>
          <button className="view-all-button" onClick={() => navigateToView("watchlist")}>
            View all <span>→</span>
          </button>
        </div>

        <div className="library-grid">
          {libraryItems.map((item) => (
            <button className="library-card" key={item.title} onClick={() => navigateToView(item.view)}>
              <div className="library-icon">{item.icon}</div>
              <div className="library-card-text">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
              <span className="card-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderMemory = () => (
    <div className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">RECONSTRUCT YOUR PAST</p>
          <h1 className="page-title">Memory</h1>
          <p className="page-description">
            Remember a movie without knowing its name, or let Movo jog your memory with unexpected corners of cinema.
          </p>
        </div>
      </div>

      <section
        className="memory-card"
        style={{
          marginBottom: "26px",
          minHeight: "auto",
          padding: "28px",
        }}
      >
        <div className="memory-content" style={{ maxWidth: "none" }}>
          <div className="memory-symbol">⌕</div>
          <div style={{ width: "100%" }}>
            <p className="eyebrow">CAN'T NAME IT?</p>
            <h3 style={{ marginBottom: "8px" }}>Tell Movo what you remember.</h3>
            <p>
              Use any clues you have — a phrase, character, place, actor, or a few words you remember from the title.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "18px",
                flexWrap: "wrap",
              }}
            >
              <input
                value={memorySearch}
                onChange={(event) => setMemorySearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void searchMemory();
                  }
                }}
                placeholder="e.g. a woman wakes up in the same hotel every day"
                style={{
                  flex: "1 1 360px",
                  minWidth: 0,
                  padding: "13px 14px",
                  border: "1px solid var(--movo-border)",
                  borderRadius: "8px",
                  background: "var(--movo-surface)",
                  color: "var(--movo-ivory)",
                  outline: "none",
                }}
              />
              <button
                className="primary-button"
                onClick={() => void searchMemory()}
                disabled={memorySearchLoading}
              >
                {memorySearchLoading ? "Searching…" : "Find it"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {memoryInterpretation && memoryResults.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "20px",
            padding: "13px 15px",
            border: "1px solid var(--movo-border)",
            borderRadius: "9px",
            background: "rgba(247, 231, 208, 0.72)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              flex: "0 0 28px",
              borderRadius: "7px",
              background: "var(--movo-brown)",
              color: "var(--movo-cream)",
              fontSize: "13px",
            }}
          >
            ✦
          </span>
          <div>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "var(--movo-dim)",
                marginBottom: "4px",
              }}
            >
              MOVO INTERPRETED YOUR MEMORY
            </div>
            <div
              style={{
                fontSize: "12px",
                lineHeight: 1.55,
                color: "var(--movo-ivory)",
              }}
            >
              {memoryInterpretation}
            </div>
            <div
              style={{
                marginTop: "5px",
                fontSize: "9px",
                color: "var(--movo-dim)",
              }}
            >
              Candidates below were matched through AI and then verified against TMDb.
            </div>
          </div>
        </div>
      )}

      <section>
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">MEMORY LANES</p>
            <h2>Jog your memory</h2>
          </div>
          <button
            className="view-all-button"
            onClick={() => void loadMemorySuggestions()}
            disabled={memoryRandomLoading}
          >
            {memoryRandomLoading ? "Shuffling…" : "Shuffle"} {!memoryRandomLoading && <span>↻</span>}
          </button>
        </div>

        {memoryLane && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            {[memoryLane.cinema, memoryLane.decade, memoryLane.genre].map((label) => (
              <span
                key={label}
                style={{
                  padding: "7px 10px",
                  border: "1px solid var(--movo-border)",
                  borderRadius: "6px",
                  color: "var(--movo-muted)",
                  fontSize: "10px",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {memoryError && memoryResults.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-icon">!</div>
            <h2>Nothing surfaced yet.</h2>
            <p>{memoryError}</p>
            <button className="primary-button" onClick={() => void loadMemorySuggestions()}>
              <span>↻</span>
              Give me another lane
            </button>
          </div>
        ) : memoryRandomLoading || memorySearchLoading ? (
          <div className="library-empty">
            <div className="library-empty-icon">◌</div>
            <h2>{memorySearchLoading ? "Looking through your clues." : "Opening a random corner of cinema."}</h2>
            <p>Movo is finding titles you may have forgotten about.</p>
          </div>
        ) : memoryResults.length > 0 ? (
          <div className="media-grid" style={cardGridStyle}>
            {memoryResults.map((item) => (
              <div
                className="suggestion-with-rating clickable-media-card"
                key={item.id}
                onClick={(event) => handleCardClick(event, item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") void openMediaDetails(item);
                }}
              >
                <div className="movo-visible-card-rating" aria-label={`TMDb rating ${item.rating ? item.rating.toFixed(1) : "unavailable"}`}>
                  <span>TMDb</span>
                  <strong>{item.rating ? item.rating.toFixed(1) : "—"}</strong>
                </div>
                <MediaCard
                  item={item}
                  onWatched={handleMemoryWatched}
                  onWatchlist={handleMemoryWatchlist}
                  onSkip={handleMemorySkip}
                />

                {pendingRatingItem?.id === item.id && (
                  <div className="suggestion-rating-row">
                    <div className="rating-mode-tabs" role="tablist" aria-label="Rating type">
                      <button type="button" className={`rating-mode-tab ${ratingMode === "stars" ? "active" : ""}`} onClick={() => setRatingMode("stars")}>Stars</button>
                      <button type="button" className={`rating-mode-tab ${ratingMode === "custom" ? "active" : ""}`} onClick={() => setRatingMode("custom")}>Custom</button>
                    </div>
                    {ratingMode === "stars" ? (
                      <>
                        <span className="suggestion-rating-prompt">How did you like it?</span>
                        <div className="suggestion-rating-stars" aria-label="Choose a rating from one to five stars">
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const isSelected = Boolean(selectedRating && rating <= selectedRating);
                            return (
                              <button key={rating} type="button" className={`suggestion-rating-star ${isSelected ? "filled" : "empty"}`} onMouseEnter={() => setSelectedRating(rating)} onFocus={() => setSelectedRating(rating)} onClick={() => setSelectedRating(rating)} aria-label={`${rating} star${rating === 1 ? "" : "s"}`}>
                                {isSelected ? "★" : "☆"}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="suggestion-rating-prompt">How did it feel? Choose any that fit for this {getCustomRatingProfile(item)}.</span>
                        <div className="custom-rating-options suggestion-custom-rating-options">
                          {getCustomRatingsForItem(item).map((rating) => {
                            const isSelected = selectedCustomRating.includes(rating.key);
                            return (
                              <button key={rating.key} type="button" className={`custom-rating-option ${isSelected ? "selected" : ""}`} onClick={() => setSelectedCustomRating((current) => isSelected ? current.filter((key) => key !== rating.key) : [...current, rating.key])} title={rating.description} aria-pressed={isSelected} aria-label={`${rating.label}: ${rating.description}`}>
                                <span className="custom-rating-symbol">{rating.symbol}</span>
                                <span className="custom-rating-label">{rating.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                    <div className="suggestion-rating-actions">
                      <button type="button" className="suggestion-rating-save" disabled={ratingMode === "stars" ? !selectedRating : selectedCustomRating.length === 0} onClick={() => {
                        if (ratingMode === "stars" && selectedRating) {
                          handleRatingSubmit(selectedRating);
                        } else if (ratingMode === "custom" && selectedCustomRating.length > 0) {
                          handleCustomRatingSubmit(selectedCustomRating);
                        }
                      }}>Save</button>
                      <button type="button" className="suggestion-rating-later" onClick={handleRatingSkip}>Later</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="library-empty">
            <div className="library-empty-icon">◌</div>
            <h2>Let's jog your memory.</h2>
            <p>Shuffle a cinema lane or search using a few clues you remember.</p>
            <button className="primary-button" onClick={() => void loadMemorySuggestions()}>
              <span>◌</span>
              Start memory search
            </button>
          </div>
        )}

        {memorySearch.trim() && memoryResults.length > 0 && !memoryLane && (
          <div style={{ marginTop: "22px", color: "var(--movo-dim)", fontSize: "10px" }}>
            Movo used your clues to propose candidates, then verified the matching titles in TMDb.
          </div>
        )}
      </section>
    </div>
  );

  const renderWatchlist = () => {
    const genreOptions = Array.from(new Set([...watchlistItems, ...skippedItems].flatMap((item) => item.genres))).sort();
    const showingSkipped = watchlistSection === "skipped";
    const activeItems = showingSkipped ? skippedItems : watchlistItems;
    const activeDisplayItems = showingSkipped ? skippedDisplayItems : watchlistDisplayItems;

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1 className="page-title">Watchlist</h1>
            <p className="page-description">Keep titles you want to watch, and keep skipped ones close without making them part of the main list.</p>
          </div>
          <div className="page-header-right">
            <span className="page-count">{activeDisplayItems.length} of {activeItems.length}</span>
            <button
              type="button"
              className={`view-all-button ${watchlistFilterOpen ? "is-active" : ""}`}
              onClick={() => setWatchlistFilterOpen((open) => !open)}
            >
              <span>≡</span> Filters & sort
            </button>
          </div>
        </div>

        <div className="saved-section-switcher" role="tablist" aria-label="Watchlist sections">
          <button
            type="button"
            role="tab"
            aria-selected={!showingSkipped}
            className={`saved-section-switch ${!showingSkipped ? "is-active" : ""}`}
            onClick={() => setWatchlistSection("watchlist")}
          >
            <span>＋</span> Watchlist <strong>{watchlistItems.length}</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={showingSkipped}
            className={`saved-section-switch skipped-switch ${showingSkipped ? "is-active" : ""}`}
            onClick={() => setWatchlistSection("skipped")}
          >
            <span>×</span> Skipped <strong>{skippedItems.length}</strong>
          </button>
        </div>

        {watchlistFilterOpen && (
          <div className="saved-filter-panel">
            <div className="filter-grid saved-filter-grid">
              <label>Type<select value={watchlistFilters.type} onChange={(e) => setWatchlistFilters((current) => ({ ...current, type: e.target.value }))}><option value="all">All types</option><option value="Movie">Movies</option><option value="TV">Series</option></select></label>
              <label>Genre<select value={watchlistFilters.genre} onChange={(e) => setWatchlistFilters((current) => ({ ...current, genre: e.target.value }))}><option value="">All genres</option>{genreOptions.map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select></label>
              <label>Year from<select value={watchlistFilters.yearFrom} onChange={(e) => setWatchlistFilters((current) => ({ ...current, yearFrom: e.target.value }))}><option value="">Any year</option>{SAVED_LIST_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
              <label>Year to<select value={watchlistFilters.yearTo} onChange={(e) => setWatchlistFilters((current) => ({ ...current, yearTo: e.target.value }))}><option value="">Any year</option>{SAVED_LIST_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
              <label>Personal mark<select value={watchlistFilters.customRating} onChange={(e) => setWatchlistFilters((current) => ({ ...current, customRating: e.target.value }))}><option value="">Any personal mark</option>{CUSTOM_RATINGS.map((rating) => <option key={rating.key} value={rating.key}>{rating.symbol} {rating.label}</option>)}</select></label>
              <label>Sort by<select value={watchlistFilters.sort} onChange={(e) => setWatchlistFilters((current) => ({ ...current, sort: e.target.value as SavedListFilters["sort"] }))}><option value="recent">Recently added</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="year-desc">Newest year</option><option value="year-asc">Oldest year</option><option value="rating-desc">Stars high → low</option><option value="rating-asc">Stars low → high</option><option value="custom-desc">Personal marks: strongest first</option><option value="custom-asc">Personal marks: lightest first</option></select></label>
            </div>
            <button type="button" className="text-button" onClick={() => setWatchlistFilters({ type: "all", genre: "", yearFrom: "", yearTo: "", customRating: "", sort: "recent" })}>Clear filters</button>
          </div>
        )}

        {!showingSkipped ? (
          <section className="saved-media-section watchlist-media-section active-saved-section">
            <div className="saved-section-heading">
              <div>
                <p className="eyebrow">TO WATCH</p>
                <h2>Watchlist <span>{watchlistDisplayItems.length} of {watchlistItems.length}</span></h2>
                <p>Titles you want to watch later.</p>
              </div>
            </div>

            {watchlistItems.length === 0 ? (
              <div className="library-empty compact-empty">
                <div className="library-empty-icon">＋</div>
                <h2>Your watchlist is empty.</h2>
                <p>Save something from Home and it will appear here.</p>
                <button className="primary-button" onClick={() => navigateToView("home")}><span>✦</span> Discover something</button>
              </div>
            ) : watchlistDisplayItems.length === 0 ? (
              <div className="library-empty compact-empty">
                <div className="library-empty-icon">⌕</div>
                <h2>No titles match these filters.</h2>
                <p>Try clearing a filter or changing the year/type.</p>
              </div>
            ) : (
              <div className="saved-media-grid">
                {watchlistDisplayItems.map((item) => (
                  <article className="saved-media-card clickable-media-card" key={item.id} onClick={(event) => handleCardClick(event, item)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") void openMediaDetails(item); }}>
                    <div className="saved-media-poster"><img src={item.poster} alt={`${item.title} poster`} loading="lazy" /><span className="saved-media-type">{getSavedTypeLabel(item.type)}</span></div>
                    <div className="saved-media-info">
                      <h2>{item.title}</h2>
                      <p>{item.year || "Year unknown"} <span>•</span> {item.genres.slice(0, 2).join(" · ")}</p>
                      <div className="saved-media-status"><span>＋</span> In your watchlist</div>
                      <div className="saved-media-rating" onClick={(event) => event.stopPropagation()}>
                        <span className="saved-media-rating-label">Your rating</span>
                        <div className="saved-media-rating-stars" aria-label={`Rate ${item.title} from one to five stars`}>
                          {[1,2,3,4,5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className={`saved-media-rating-star ${personalRatings[item.id] && rating <= personalRatings[item.id] ? "is-selected" : ""}`}
                              onClick={() => handleSavedListStarRating(item, rating)}
                              aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="saved-media-rating-score">{personalRatings[item.id] ? `${personalRatings[item.id]}/5` : "Not rated"}</span>
                        </div>
                      </div>
                      {personalCustomRatings[item.id]?.length > 0 && (<div className="saved-media-custom-rating">{personalCustomRatings[item.id].map((key) => (<span key={key} className="saved-media-custom-rating-chip" title={CUSTOM_RATING_MAP[key].description}>{CUSTOM_RATING_MAP[key].symbol} {CUSTOM_RATING_MAP[key].label}</span>))}</div>)}
                      <div className="saved-media-actions" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="saved-media-action-button saved-media-action-primary" onClick={() => void handleWatched(item)}>✓ Watched</button>
                        <button type="button" className="saved-media-action-button saved-media-feel-button" onClick={() => pendingRatingItem?.id === item.id ? closeCustomRatingPanel() : openCustomRatingForItem(item)}>{pendingRatingItem?.id === item.id ? "× Close" : "♡ Feel"}</button>
                        <button type="button" className="saved-media-action-button" onClick={() => void handleSkip(item)}>× Skip</button>
                      </div>
                      {pendingRatingItem?.id === item.id && ratingMode === "custom" && (
                        <div className="saved-inline-custom-rating" onClick={(event) => event.stopPropagation()}>
                          <div className="saved-inline-custom-heading">How did it feel?</div>
                          <div className="custom-rating-options">
                            {getCustomRatingsForItem(item).map((rating) => {
                              const isSelected = selectedCustomRating.includes(rating.key);
                              return (
                                <button key={rating.key} type="button" className={`custom-rating-option ${isSelected ? "selected" : ""}`} onClick={() => {
                                  const next = isSelected ? selectedCustomRating.filter((key) => key !== rating.key) : [...selectedCustomRating, rating.key];
                                  setSelectedCustomRating(next);
                                  saveCustomRating(item.id, next);
                                }} title={rating.description} aria-pressed={isSelected}>
                                  <span className="custom-rating-symbol">{rating.symbol}</span>
                                  <span className="custom-rating-label">{rating.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="saved-inline-custom-footer">
                            <span>{selectedCustomRating.length ? `${selectedCustomRating.length} selected` : "Pick any that fit"}</span>
                            <button type="button" className="saved-inline-custom-close" onClick={closeCustomRatingPanel}>Done</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="saved-media-section skipped-media-section active-saved-section">
            <div className="saved-section-heading">
              <div>
                <p className="eyebrow">NOT FOR NOW</p>
                <h2>Skipped <span>{skippedDisplayItems.length} of {skippedItems.length}</span></h2>
                <p>Titles you skipped and may come back to later.</p>
              </div>
            </div>

            {skippedItems.length === 0 ? (
              <div className="library-empty compact-empty"><div className="library-empty-icon">×</div><h2>Nothing skipped.</h2><p>Titles you skip from Home or your Watchlist will appear here.</p></div>
            ) : skippedDisplayItems.length === 0 ? (
              <div className="library-empty compact-empty"><div className="library-empty-icon">⌕</div><h2>No skipped titles match these filters.</h2><p>Try clearing a filter or changing the year/type.</p></div>
            ) : (
              <div className="saved-media-grid skipped-media-grid">
                {skippedDisplayItems.map((item) => (
                  <article className="saved-media-card clickable-media-card" key={item.id} onClick={(event) => handleCardClick(event, item)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") void openMediaDetails(item); }}>
                    <div className="saved-media-poster"><img src={item.poster} alt={`${item.title} poster`} loading="lazy" /><span className="saved-media-type">{getSavedTypeLabel(item.type)}</span></div>
                    <div className="saved-media-info">
                      <h2>{item.title}</h2><p>{item.year || "Year unknown"} <span>•</span> {item.genres.slice(0, 2).join(" · ")}</p>
                      <div className="saved-media-status skipped-status"><span>×</span> Skipped</div>
                      <div className="saved-media-rating" onClick={(event) => event.stopPropagation()}>
                        <span className="saved-media-rating-label">Your rating</span>
                        <div className="saved-media-rating-stars" aria-label={`Rate ${item.title} from one to five stars`}>
                          {[1,2,3,4,5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className={`saved-media-rating-star ${personalRatings[item.id] && rating <= personalRatings[item.id] ? "is-selected" : ""}`}
                              onClick={() => handleSavedListStarRating(item, rating)}
                              aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="saved-media-rating-score">{personalRatings[item.id] ? `${personalRatings[item.id]}/5` : "Not rated"}</span>
                        </div>
                      </div>
                      {personalCustomRatings[item.id]?.length > 0 && (<div className="saved-media-custom-rating">{personalCustomRatings[item.id].map((key) => (<span key={key} className="saved-media-custom-rating-chip" title={CUSTOM_RATING_MAP[key].description}>{CUSTOM_RATING_MAP[key].symbol} {CUSTOM_RATING_MAP[key].label}</span>))}</div>)}
                      <div className="saved-media-actions" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="saved-media-action-button saved-media-action-primary" onClick={() => void handleWatched(item)}>✓ Watched</button>
                        <button type="button" className="saved-media-action-button saved-media-feel-button" onClick={() => pendingRatingItem?.id === item.id ? closeCustomRatingPanel() : openCustomRatingForItem(item)}>{pendingRatingItem?.id === item.id ? "× Close" : "♡ Feel"}</button>
                        <button type="button" className="saved-media-action-button" onClick={() => void handleWatchlist(item)}>＋ Watchlist</button>
                      </div>
                      {pendingRatingItem?.id === item.id && ratingMode === "custom" && (
                        <div className="saved-inline-custom-rating" onClick={(event) => event.stopPropagation()}>
                          <div className="saved-inline-custom-heading">How did it feel?</div>
                          <div className="custom-rating-options">
                            {getCustomRatingsForItem(item).map((rating) => {
                              const isSelected = selectedCustomRating.includes(rating.key);
                              return (
                                <button key={rating.key} type="button" className={`custom-rating-option ${isSelected ? "selected" : ""}`} onClick={() => {
                                  const next = isSelected ? selectedCustomRating.filter((key) => key !== rating.key) : [...selectedCustomRating, rating.key];
                                  setSelectedCustomRating(next);
                                  saveCustomRating(item.id, next);
                                }} title={rating.description} aria-pressed={isSelected}>
                                  <span className="custom-rating-symbol">{rating.symbol}</span>
                                  <span className="custom-rating-label">{rating.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="saved-inline-custom-footer">
                            <span>{selectedCustomRating.length ? `${selectedCustomRating.length} selected` : "Pick any that fit"}</span>
                            <button type="button" className="saved-inline-custom-close" onClick={closeCustomRatingPanel}>Done</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    const genreOptions = Array.from(new Set(historyItems.flatMap((item) => item.genres))).sort();
    const sortOptions = (
      <>
        <option value="recent">Recently watched</option>
        <option value="oldest">Oldest watched</option>
        <option value="title-asc">Title A–Z</option>
        <option value="title-desc">Title Z–A</option>
        <option value="year-desc">Newest year</option>
        <option value="year-asc">Oldest year</option>
        <option value="rating-desc">TMDb rating high → low</option>
        <option value="rating-asc">TMDb rating low → high</option>
      </>
    );

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <p className="eyebrow">YOUR HISTORY</p>
            <h1 className="page-title">History</h1>
            <p className="page-description">Everything you've watched and recorded in Movo.</p>
          </div>
          <div className="page-header-right">
            <span className="page-count">{historyDisplayItems.length} of {historyItems.length}</span>
            <button
              type="button"
              className={`view-all-button ${historyFilterOpen ? "is-active" : ""}`}
              onClick={() => setHistoryFilterOpen((open) => !open)}
            >
              <span>≡</span> Filters & sort
            </button>
          </div>
        </div>

        {historyFilterOpen && (
          <div className="saved-filter-panel">
            <div className="filter-grid saved-filter-grid">
              <label>Type<select value={historyFilters.type} onChange={(e) => setHistoryFilters((current) => ({ ...current, type: e.target.value }))}><option value="all">All types</option><option value="Movie">Movies</option><option value="TV">Series</option></select></label>
              <label>Genre<select value={historyFilters.genre} onChange={(e) => setHistoryFilters((current) => ({ ...current, genre: e.target.value }))}><option value="">All genres</option>{genreOptions.map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select></label>
              <label>Year from<select value={historyFilters.yearFrom} onChange={(e) => setHistoryFilters((current) => ({ ...current, yearFrom: e.target.value }))}><option value="">Any year</option>{SAVED_LIST_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
              <label>Year to<select value={historyFilters.yearTo} onChange={(e) => setHistoryFilters((current) => ({ ...current, yearTo: e.target.value }))}><option value="">Any year</option>{SAVED_LIST_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
              <label>Personal mark<select value={historyFilters.customRating} onChange={(e) => setHistoryFilters((current) => ({ ...current, customRating: e.target.value }))}><option value="">Any personal mark</option>{CUSTOM_RATINGS.map((rating) => <option key={rating.key} value={rating.key}>{rating.symbol} {rating.label}</option>)}</select></label>
              <label>Sort by<select value={historyFilters.sort} onChange={(e) => setHistoryFilters((current) => ({ ...current, sort: e.target.value as SavedListFilters["sort"] }))}>{sortOptions}<option value="custom-desc">Personal marks: strongest first</option><option value="custom-asc">Personal marks: lightest first</option></select></label>
            </div>
            <button type="button" className="text-button" onClick={() => setHistoryFilters({ type: "all", genre: "", yearFrom: "", yearTo: "", customRating: "", sort: "recent" })}>Clear filters</button>
          </div>
        )}

        {historyItems.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-icon">◷</div>
            <h2>Your history is empty.</h2>
            <p>Mark something as Watched and it will appear here.</p>
            <button className="primary-button" onClick={() => navigateToView("home")}>
              <span>✦</span>
              Discover something
            </button>
          </div>
        ) : historyDisplayItems.length === 0 ? (
          <div className="library-empty compact-empty">
            <div className="library-empty-icon">⌕</div>
            <h2>No titles match these filters.</h2>
            <p>Try clearing a filter or changing the year/type.</p>
          </div>
        ) : (
          <div className="history-list">
            {historyDisplayItems.map((item) => {
              return (
                <article
                  className="history-item clickable-media-card"
                  key={item.id}
                  onClick={(event) => handleCardClick(event, item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") void openMediaDetails(item);
                  }}
                >
                  <div className="history-poster"><img src={item.poster} alt={`${item.title} poster`} loading="lazy" /></div>
                  <div className="history-main">
                    <div>
                      <span className="saved-media-type">{getSavedTypeLabel(item.type)}</span>
                      <h2>{item.title}</h2>
                      <p>{item.year || "Year unknown"} <span>•</span> {item.genres.slice(0, 2).join(" · ")}</p>
                    </div>
                    <div className="history-meta">
                      <div className="history-rating-block">
                        <span className="history-meta-label">Your ratings</span>
                        <div className="history-rating-stars" aria-label={`Rate ${item.title} from one to five stars`}>
                          {[1,2,3,4,5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className={`history-rating-star ${personalRatings[item.id] && rating <= personalRatings[item.id] ? "is-selected" : ""}`}
                              onClick={(event) => { event.stopPropagation(); handleSavedListStarRating(item, rating); }}
                              aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="history-rating-text">{personalRatings[item.id] ? `${personalRatings[item.id]}/5` : "Not rated"}</span>
                        </div>
                        {personalCustomRatings[item.id]?.length > 0 && (
                          <div className="history-custom-rating-badge">
                            {personalCustomRatings[item.id].map((key) => (
                              <span key={key} className="history-custom-rating-chip" title={CUSTOM_RATING_MAP[key].description}>
                                {CUSTOM_RATING_MAP[key].symbol} {CUSTOM_RATING_MAP[key].label}
                              </span>
                            ))}
                          </div>
                        )}
                        <button type="button" className="history-feel-button" onClick={() => pendingRatingItem?.id === item.id ? closeCustomRatingPanel() : openCustomRatingForItem(item)}>{pendingRatingItem?.id === item.id ? "× Close" : "♡ Feel"}</button>
                      </div>

                      {pendingRatingItem?.id === item.id && ratingMode === "custom" && (
                        <div className="inline-rating-row saved-custom-feel-panel" onClick={(event) => event.stopPropagation()}>
                          <span className="inline-rating-label">What did it feel like?</span>
                          <div className="custom-rating-options">
                            {getCustomRatingsForItem(item).map((rating) => {
                              const isSelected = selectedCustomRating.includes(rating.key);
                              return (
                                <button
                                  key={rating.key}
                                  type="button"
                                  className={`custom-rating-option ${isSelected ? "selected" : ""}`}
                                  onClick={() => {
                                    const next = isSelected
                                      ? selectedCustomRating.filter((key) => key !== rating.key)
                                      : [...selectedCustomRating, rating.key];
                                    setSelectedCustomRating(next);
                                    saveCustomRating(item.id, next);
                                  }}
                                  title={rating.description}
                                  aria-pressed={isSelected}
                                  aria-label={`${rating.label}: ${rating.description}`}
                                >
                                  <span className="custom-rating-symbol">{rating.symbol}</span>
                                  <span className="custom-rating-label">{rating.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="inline-rating-actions">
                            <button type="button" className="inline-rating-skip" onClick={closeCustomRatingPanel}>Done</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStremioSettings = () => (
    <div className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Manage your Movo account and external connections.</p>
        </div>
      </div>

      <section className="settings-card stremio-settings-card">
        <div className="settings-card-heading">
          <div>
            <p className="eyebrow">INTEGRATION</p>
            <h2>Stremio</h2>
            <p>Connect Movo to your Stremio account so Movo can verify your real Library status.</p>
          </div>
          <span className={`connection-dot ${stremioAuthKey ? "online" : "offline"}`} aria-label={stremioAuthKey ? "Connected" : "Not connected"} />
        </div>

        <div className="stremio-connection-status">
          <strong>{stremioAuthKey ? "Stremio connected" : "Stremio not connected"}</strong>
          <span>{stremioMessage ?? "Use Stremio Link to connect without giving Movo your Stremio password."}</span>
        </div>

        <div className="settings-card-actions">
          {stremioAuthKey ? (
            <>
              <button className="primary-button" type="button" onClick={() => void syncStremioLibrary()} disabled={stremioSyncing}>
                {stremioSyncing ? "Checking…" : "Sync Library"}
              </button>
              <button className="secondary-button" type="button" onClick={() => void disconnectStremio()}>
                Disconnect Stremio
              </button>
            </>
          ) : (
            <button className="primary-button" type="button" onClick={() => void connectStremio()} disabled={stremioLinking}>
              {stremioLinking ? "Waiting for Stremio…" : "Connect Stremio"}
            </button>
          )}
        </div>

        {stremioAuthKey && (
          <p className="settings-card-note">
            Movo checks Stremio's <code>libraryItem</code> account data. The “Added to Stremio Library” label only appears when the title's IMDb ID is actually present there; opening Stremio by itself does not mark it as added.
          </p>
        )}
      </section>
    </div>
  );

  const renderPlaceholder = (title: string, eyebrow: string, description: string) => (
    <div className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </div>
      <div className="library-empty">
        <div className="library-empty-icon">✦</div>
        <h2>We're building this part.</h2>
        <p>The foundation is in place. This section is coming next.</p>
        <button className="primary-button" onClick={() => navigateToView("home")}>
          <span>←</span>
          Back home
        </button>
      </div>
    </div>
  );

  return (
    <div className="movo-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <span className="brand-name">Movo</span>
        </div>

        <nav className="main-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${currentView === item.view ? "active" : ""}`}
              onClick={() => navigateToView(item.view)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="profile-mini profile-button" onClick={() => navigateToView("settings")}>
            <div className="avatar">{profileInitial}</div>
            <div>
              <span className="profile-name">{displayName}</span>
              <span className="profile-status">Personal library</span>
            </div>
          </button>

          <button className="logout-button" onClick={handleLogout}>
            <span>↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <style>{`
          .history-rating-block {
            min-width: 150px;
          }

          .history-rating-button {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            margin-top: 5px;
            padding: 0;
            border: 0;
            background: transparent;
            cursor: pointer;
            font: inherit;
          }

          .history-rating-stars {
            display: flex;
            gap: 2px;
            font-size: 14px;
            line-height: 1;
          }

          .history-rating-stars .filled {
            color: var(--movo-amber);
          }

          .history-rating-stars .empty {
            color: var(--movo-sand, #d4b28a);
            opacity: 0.65;
          }

          .history-rating-text {
            color: var(--movo-muted);
            font-size: 9px;
            letter-spacing: 0.04em;
          }

          .history-rating-button:hover .history-rating-text {
            color: var(--movo-ivory);
          }

          .history-rating-button:hover .history-rating-stars .empty {
            color: var(--movo-amber);
          }
        `}</style>
        <style>{`
          .inline-rating-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            padding: 8px 10px;
            border: 1px solid var(--movo-border);
            border-radius: 8px;
            background: rgba(201, 111, 67, 0.06);
            width: fit-content;
          }

          .inline-rating-label {
            color: var(--movo-muted);
            font-size: 10px;
            letter-spacing: 0.03em;
          }

          .inline-rating-stars {
            display: flex;
            gap: 1px;
          }

          .inline-rating-star {
            width: 22px;
            height: 22px;
            padding: 0;
            border: 0;
            background: transparent !important;
            font-family: inherit;
            font-size: 16px;
            line-height: 1;
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
          }

          .inline-rating-star:hover {
            transform: translateY(-1px);
          }

          .inline-rating-actions {
            display: flex;
            gap: 6px;
            margin-left: 3px;
          }

          .inline-rating-save,
          .inline-rating-skip {
            padding: 5px 8px;
            border-radius: 5px;
            font-size: 9px;
            cursor: pointer;
          }

          .inline-rating-save {
            border: 1px solid var(--movo-amber);
            background: var(--movo-amber);
            color: #fff7ef;
          }

          .inline-rating-save:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .inline-rating-skip {
            border: 1px solid var(--movo-border);
            background: transparent;
            color: var(--movo-muted);
          }
        `}</style>
        <style>{`
          .suggestion-rating-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
            padding: 9px 11px;
            border: 1px solid var(--movo-border);
            border-radius: 8px;
            background: rgba(201, 111, 67, 0.07);
            width: fit-content;
            max-width: 100%;
          }

          .suggestion-rating-prompt {
            color: var(--movo-muted);
            font-size: 11px;
            letter-spacing: 0.02em;
            white-space: nowrap;
          }

          .suggestion-rating-stars {
            display: inline-flex;
            align-items: center;
            gap: 2px;
          }

          .suggestion-rating-star {
            width: 25px;
            height: 28px;
            padding: 0;
            margin: 0;
            border: 0 !important;
            border-radius: 4px;
            background: transparent !important;
            box-shadow: none !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            font-family: Arial, sans-serif;
            font-size: 21px;
            line-height: 28px;
            text-align: center;
            cursor: pointer;
            transition: transform 120ms ease, color 120ms ease;
          }

          .suggestion-rating-star.filled {
            color: #c96f43 !important;
            opacity: 1;
          }

          .suggestion-rating-star.empty {
            color: #c5a47e !important;
            opacity: 1;
          }

          .suggestion-rating-star:hover,
          .suggestion-rating-star:focus-visible {
            transform: translateY(-1px) scale(1.06);
            outline: none;
          }

          .suggestion-rating-actions {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-left: 1px;
          }

          .suggestion-rating-save,
          .suggestion-rating-later {
            min-height: 28px;
            padding: 5px 10px !important;
            border-radius: 6px !important;
            font-family: inherit;
            font-size: 10px;
            line-height: 1;
            cursor: pointer;
            appearance: none !important;
            -webkit-appearance: none !important;
            box-shadow: none !important;
          }

          .suggestion-rating-save {
            border: 1px solid #c96f43 !important;
            background: #c96f43 !important;
            color: #fff7ef !important;
          }

          .suggestion-rating-save:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .suggestion-rating-later {
            border: 1px solid var(--movo-border) !important;
            background: rgba(247, 231, 208, 0.65) !important;
            color: var(--movo-muted) !important;
          }

          .suggestion-rating-save:not(:disabled):hover,
          .suggestion-rating-later:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 560px) {
            .suggestion-rating-row {
              align-items: flex-start;
            }

            .suggestion-rating-actions {
              width: 100%;
              margin-left: 0;
            }
          }
        `}</style>
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">M</span>
            <span className="brand-name">Movo</span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Memory" onClick={() => navigateToView("memory")}>
              ◌
            </button>
            <button className="top-avatar" aria-label="Profile" onClick={() => navigateToView("settings")}>
              {profileInitial}
            </button>
          </div>
        </header>

        {currentView === "home" && renderHome()}
        {currentView === "memory" && renderMemory()}
        {currentView === "watchlist" && renderWatchlist()}
        {currentView === "history" && renderHistory()}
        {currentView === "statistics" &&
          renderPlaceholder("Statistics", "YOUR DATA", "See what your viewing history says about you.")}
        {currentView === "settings" && renderStremioSettings()}

        {(mediaDetailsLoading || mediaDetailsError || mediaDetails) && (
          <div className="media-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMediaDetails(); }}>
            <section className="media-detail-modal" role="dialog" aria-modal="true" aria-label={mediaDetails?.title ?? "Title details"}>
              <button className="media-detail-close" type="button" onClick={closeMediaDetails} aria-label="Close details">×</button>

              {mediaDetailsLoading && (
                <div className="media-detail-loading">
                  <div className="library-empty-icon">◌</div>
                  <h2>Loading title details…</h2>
                  <p>Fetching cast, ratings and related information.</p>
                </div>
              )}

              {!mediaDetailsLoading && mediaDetailsError && (
                <div className="media-detail-loading">
                  <div className="library-empty-icon">!</div>
                  <h2>Couldn't load details.</h2>
                  <p>{mediaDetailsError}</p>
                </div>
              )}

              {!mediaDetailsLoading && !mediaDetailsError && mediaDetails && (
                <div className="media-detail-content">
                  <div className="media-detail-hero" style={mediaDetails.backdrop ? { backgroundImage: `linear-gradient(90deg, rgba(48,33,25,0.98) 0%, rgba(48,33,25,0.9) 42%, rgba(48,33,25,0.35) 100%), url(${mediaDetails.backdrop})` } : undefined}>
                    <div className="media-detail-hero-inner">
                      <img className="media-detail-poster" src={mediaDetails.poster} alt={`${mediaDetails.title} poster`} />
                      <div className="media-detail-heading">
                        <span className="saved-media-type">{mediaDetails.type === "tv" ? "TV" : "Movie"}</span>
                        <h1>{mediaDetails.title}</h1>
                        {mediaDetails.originalTitle !== mediaDetails.title && <p className="media-detail-original">{mediaDetails.originalTitle}</p>}
                        <p className="media-detail-meta">
                          {mediaDetails.year || "Year unknown"}
                          {mediaDetails.runtime ? ` · ${mediaDetails.runtime} min` : ""}
                          {mediaDetails.certification ? ` · ${mediaDetails.certification}` : ""}
                        </p>
                        <div className="media-detail-genres">{mediaDetails.genres.map((genre) => <span key={genre}>{genre}</span>)}</div>
                        <div className="media-detail-actions">
                          <button className="primary-button" onClick={() => void handleOpenStremio(mediaDetails)}>Open in Stremio ↗</button>
                          {isTitleInStremioLibrary(mediaDetails) && (
                            <span className="stremio-library-confirmed" title="Verified against your Stremio account Library">
                              ✓ Added to Stremio Library
                            </span>
                          )}
                          {stremioPendingTitleId === mediaDetails.imdbId && !isTitleInStremioLibrary(mediaDetails) && (
                            <span className="stremio-library-checking">Checking Library…</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="media-detail-body">
                    <div className="media-detail-library-actions">
                      <div className="media-detail-library-status">
                        <span className="eyebrow">MOVO STATUS</span>
                        <strong>
                          {getSavedStatusForItem(mediaDetails.id) === "watched"
                            ? "In History"
                            : getSavedStatusForItem(mediaDetails.id) === "watchlist"
                            ? "In Watchlist"
                            : getSavedStatusForItem(mediaDetails.id) === "skipped"
                            ? "Skipped"
                            : "Not saved"}
                        </strong>
                      </div>
                      <div className="media-detail-library-buttons">
                        <button
                          type="button"
                          className={`saved-media-action-button saved-media-action-primary ${getSavedStatusForItem(mediaDetails.id) === "watched" ? "is-current" : ""}`}
                          onClick={() => void handleDetailWatched()}
                        >
                          ✓ Watched
                        </button>
                        <button
                          type="button"
                          className={`saved-media-action-button ${getSavedStatusForItem(mediaDetails.id) === "watchlist" ? "is-current" : ""}`}
                          onClick={() => void handleDetailWatchlist()}
                        >
                          ＋ Watchlist
                        </button>
                        <button
                          type="button"
                          className={`saved-media-action-button ${getSavedStatusForItem(mediaDetails.id) === "skipped" ? "is-current" : ""}`}
                          onClick={() => void handleDetailSkip()}
                        >
                          × Skipped
                        </button>
                      </div>
                    </div>

                    <div className="media-detail-personal-rating">
                      <div className="detail-section-heading">
                        <div>
                          <p className="eyebrow">YOUR RATING</p>
                          <h2>How do you feel about it?</h2>
                          <p>Stars are the score. Personal marks are the soul of the rating — choose the language that fits this kind of story.</p>
                        </div>
                        <div className="detail-current-rating-group">
                          {personalRatings[mediaDetails.id] && (
                            <span className="detail-current-rating">★ {personalRatings[mediaDetails.id]}/5</span>
                          )}
                          {personalCustomRatings[mediaDetails.id]?.length > 0 && (
                            <span className="detail-current-custom-ratings">
                              {personalCustomRatings[mediaDetails.id].map((key) => `${CUSTOM_RATING_MAP[key].symbol} ${CUSTOM_RATING_MAP[key].label}`).join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rating-mode-tabs detail-rating-tabs" role="tablist" aria-label="Your rating type">
                        <button type="button" className={`rating-mode-tab ${ratingMode === "stars" ? "active" : ""}`} onClick={() => setRatingMode("stars")}>Stars</button>
                        <button type="button" className={`rating-mode-tab ${ratingMode === "custom" ? "active" : ""}`} onClick={() => setRatingMode("custom")}>Custom</button>
                      </div>
                      {ratingMode === "stars" ? (
                        <div className="detail-rating-editor">
                          <div className="detail-star-picker" aria-label="Choose a rating from one to five stars">
                            {[1,2,3,4,5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                className={`detail-star-button ${selectedRating && rating <= selectedRating ? "is-selected" : ""}`}
                                onClick={() => saveDetailStarRating(rating)}
                                aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <span className="detail-rating-help">{selectedRating ? `${selectedRating}/5 saved` : "Choose your stars"}</span>
                        </div>
                      ) : (
                        <div className="detail-rating-editor detail-custom-rating-editor">
                          <div className="custom-rating-options detail-custom-rating-options">
                            {getCustomRatingsForItem(convertDetailsToMediaItem(mediaDetails)).map((rating) => {
                              const isSelected = selectedCustomRating.includes(rating.key);
                              return (
                                <button
                                  key={rating.key}
                                  type="button"
                                  className={`custom-rating-option ${isSelected ? "selected" : ""}`}
                                  onClick={() => {
                                    const next = isSelected
                                      ? selectedCustomRating.filter((key) => key !== rating.key)
                                      : [...selectedCustomRating, rating.key];
                                    if (next.length > 0) {
                                      saveDetailCustomRating(next);
                                    } else {
                                      setSelectedCustomRating([]);
                                    }
                                  }}
                                  title={rating.description}
                                  aria-pressed={isSelected}
                                  aria-label={`${rating.label}: ${rating.description}`}
                                >
                                  <span className="custom-rating-symbol">{rating.symbol}</span>
                                  <span className="custom-rating-label">{rating.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <span className="detail-rating-help">{selectedCustomRating.length ? `${selectedCustomRating.length} personal mark${selectedCustomRating.length === 1 ? "" : "s"} saved` : "Choose one or more personal marks"}</span>
                          {selectedCustomRating.length > 0 && (
                            <button type="button" className="detail-clear-custom-button" onClick={() => {
                              if (!mediaDetails) return;
                              const nextRatings = { ...personalCustomRatings };
                              delete nextRatings[mediaDetails.id];
                              setPersonalCustomRatings(nextRatings);
                              try {
                                if (currentUser?.id) {
                                  window.localStorage.setItem(`movo-personal-custom-ratings:${currentUser.id}`, JSON.stringify(nextRatings));
                                }
                              } catch (error) {
                                console.error("Failed to clear custom ratings:", error);
                              }
                              setSelectedCustomRating([]);
                              setActionMessage(`Personal marks cleared for ${mediaDetails.title}.`);
                            }}>Clear marks</button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="media-detail-overview">{mediaDetails.overview || "No synopsis is available for this title."}</p>

                    <div className="media-detail-ratings">
                      <a className="rating-source-card" href={mediaDetails.imdbId ? `https://www.imdb.com/title/${mediaDetails.imdbId}/` : `https://www.imdb.com/find/?q=${encodeURIComponent(mediaDetails.title)}`} target="_blank" rel="noreferrer">
                        <span>IMDb</span><strong>{mediaDetails.imdbRating ? mediaDetails.imdbRating.toFixed(1) : "—"}</strong><small>{mediaDetails.imdbRating ? "IMDb rating" : "Open IMDb"}</small>
                      </a>
                      <a className="rating-source-card" href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(mediaDetails.title)}`} target="_blank" rel="noreferrer">
                        <span>Rotten Tomatoes</span><strong>{mediaDetails.rottenTomatoesScore !== null ? `${mediaDetails.rottenTomatoesScore}%` : "—"}</strong><small>{mediaDetails.rottenTomatoesAudienceScore !== null ? `Audience ${mediaDetails.rottenTomatoesAudienceScore}% · Open` : mediaDetails.rottenTomatoesScore !== null ? "Tomatometer · Open" : "Unavailable · Open"}</small>
                      </a>
                      <a className="rating-source-card" href={`https://www.metacritic.com/search/${encodeURIComponent(mediaDetails.title)}/`} target="_blank" rel="noreferrer">
                        <span>Metacritic</span><strong>{mediaDetails.metacriticScore !== null ? `${mediaDetails.metacriticScore}/100` : "—"}</strong><small>{mediaDetails.metacriticScore !== null ? "Metascore · Open" : "Unavailable · Open"}</small>
                      </a>
                      <div className="rating-source-card"><span>TMDb</span><strong>{mediaDetails.tmdbRating ? mediaDetails.tmdbRating.toFixed(1) : "—"}</strong><small>{mediaDetails.tmdbVotes ? `${mediaDetails.tmdbVotes.toLocaleString()} votes` : "TMDb rating"}</small></div>
                    </div>
                    <p className="media-detail-rating-note">IMDb is shown from Stremio's Cinemeta metadata when available. Rotten Tomatoes and Metacritic scores are loaded through OMDb when an OMDb API key is configured; Movo does not scrape either site.</p>

                    <div className="media-detail-info-grid">
                      <div><span>Country</span><strong>{mediaDetails.countries.length ? mediaDetails.countries.join(" · ") : "—"}</strong></div>
                      <div><span>Language</span><strong>{mediaDetails.languages.length ? mediaDetails.languages.join(" · ") : "—"}</strong></div>
                      <div><span>Certificate</span><strong>{mediaDetails.certification ?? "Unrated / unavailable"}</strong></div>
                      <div><span>Release</span><strong>{mediaDetails.releaseDate || "—"}</strong></div>
                    </div>

                    <div className="media-detail-section">
                      <div className="detail-section-heading"><p className="eyebrow">CAST</p><h2>Cast</h2></div>
                      <div className="detail-people-grid">
                        {mediaDetails.cast.map((person) => (
                          <div className="detail-person" key={`${person.id}-${person.character ?? "cast"}`}>
                            {person.profilePath ? <img src={getTmdbImageUrl(person.profilePath, "w185")} alt={person.name} loading="lazy" /> : <div className="detail-person-placeholder">{person.name.charAt(0)}</div>}
                            <div><strong>{person.name}</strong><span>{person.character || "Cast"}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(mediaDetails.directors.length > 0 || mediaDetails.writers.length > 0) && (
                      <div className="media-detail-crew">
                        {mediaDetails.directors.length > 0 && <div><p className="eyebrow">DIRECTORS</p><strong>{mediaDetails.directors.map((person) => person.name).join(" · ")}</strong></div>}
                        {mediaDetails.writers.length > 0 && <div><p className="eyebrow">WRITERS</p><strong>{mediaDetails.writers.map((person) => person.name).join(" · ")}</strong></div>}
                      </div>
                    )}

                    {mediaDetails.similar.length > 0 && (
                      <div className="media-detail-section">
                        <div className="detail-section-heading"><p className="eyebrow">MORE TO EXPLORE</p><h2>Similar</h2></div>
                        <div className="similar-media-grid">
                          {mediaDetails.similar.map((item) => (
                            <button className="similar-media-card" key={item.id} onClick={() => void openMediaDetails(item)}>
                              <img src={item.poster} alt={`${item.title} poster`} loading="lazy" />
                              <span>{item.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
