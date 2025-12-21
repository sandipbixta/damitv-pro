import { supabase } from "@/integrations/supabase/client";

export interface ExtractedStream {
  url: string;
  type: 'hls' | 'mp4' | 'unknown';
  quality?: string;
  source?: string;
}

export interface HlsExtractionResult {
  success: boolean;
  streams: ExtractedStream[];
  iframes: string[];
  pageLength: number;
  message: string;
  error?: string;
}

export async function extractHlsFromUrl(url: string): Promise<HlsExtractionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('extract-hls', {
      body: { url },
    });

    if (error) {
      return {
        success: false,
        streams: [],
        iframes: [],
        pageLength: 0,
        message: 'Failed to extract streams',
        error: error.message,
      };
    }

    return data as HlsExtractionResult;
  } catch (err) {
    return {
      success: false,
      streams: [],
      iframes: [],
      pageLength: 0,
      message: 'Failed to extract streams',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
