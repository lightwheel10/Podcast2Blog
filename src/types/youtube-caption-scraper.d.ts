declare module 'youtube-caption-scraper' {
  interface Caption {
    text: string;
    duration: number;
    start: number;
    end: number;
  }

  interface SubtitleOptions {
    videoID: string;
    lang?: string;
  }

  export function getSubtitles(options: SubtitleOptions): Promise<Caption[]>;
}
