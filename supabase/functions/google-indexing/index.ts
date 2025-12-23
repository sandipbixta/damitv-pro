import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate JWT for Google API authentication
async function generateGoogleJWT(): Promise<string> {
  const privateKey = Deno.env.get('GOOGLE_INDEXING_PRIVATE_KEY');
  const clientEmail = Deno.env.get('GOOGLE_INDEXING_CLIENT_EMAIL');

  if (!privateKey || !clientEmail) {
    throw new Error('Missing Google Indexing credentials');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  };

  // Base64URL encode
  const base64UrlEncode = (data: object | string): string => {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key and sign - handle various newline formats
  let cleanedKey = privateKey;
  
  // First, convert all escaped \n to actual newlines for consistent processing
  cleanedKey = cleanedKey.replace(/\\n/g, '\n');
  
  // Remove the PEM headers/footers
  cleanedKey = cleanedKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '');
  
  // Remove all newlines, carriage returns, and whitespace - keep only valid base64 characters
  cleanedKey = cleanedKey
    .split('')
    .filter(c => /[A-Za-z0-9+/=]/.test(c))
    .join('');
  
  // Fix for corrupted storage: if key starts with 'nMII' instead of 'MII', remove the leading 'n'
  // This happens when \n was stored as literal character
  if (cleanedKey.startsWith('nMII')) {
    cleanedKey = cleanedKey.substring(1);
  }

  console.log('Private key length after cleaning:', cleanedKey.length);
  console.log('First 50 chars:', cleanedKey.substring(0, 50));
  console.log('Last 50 chars:', cleanedKey.substring(cleanedKey.length - 50));
  
  // Standard base64 characters check
  const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanedKey);
  console.log('Is valid base64:', isValidBase64);
  
  if (!isValidBase64) {
    // Find invalid characters
    const invalidChars = cleanedKey.split('').filter(c => !/[A-Za-z0-9+/=]/.test(c));
    console.error('Invalid characters found:', JSON.stringify(invalidChars));
    throw new Error(`Invalid base64 characters: ${invalidChars.join(', ')}`);
  }
  
  let binaryKey: Uint8Array;
  try {
    binaryKey = Uint8Array.from(atob(cleanedKey), (c) => c.charCodeAt(0));
  } catch (e) {
    console.error('Failed to decode base64:', e);
    throw new Error('Failed to decode base64');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signatureInput}.${signatureEncoded}`;
}

// Get access token from Google OAuth
async function getAccessToken(): Promise<string> {
  const jwt = await generateGoogleJWT();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get access token:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Submit URL to Google Indexing API
async function submitUrlForIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<{ success: boolean; message: string }> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: url,
        type: type,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Google Indexing API error:', result);
      return {
        success: false,
        message: result.error?.message || 'Failed to submit URL for indexing',
      };
    }

    console.log('URL submitted for indexing:', url, result);
    return {
      success: true,
      message: `URL ${type === 'URL_UPDATED' ? 'submitted for indexing' : 'removed from index'}: ${url}`,
    };
  } catch (error) {
    console.error('Error submitting URL for indexing:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Batch submit multiple URLs
async function batchSubmitUrls(urls: string[], type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<{ results: Array<{ url: string; success: boolean; message: string }> }> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const result = await submitUrlForIndexing(url, type);
      return { url, ...result };
    })
  );

  return { results };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, url, urls, type = 'URL_UPDATED' } = await req.json();

    console.log('Google Indexing request:', { action, url, urls, type });

    // Single URL submission
    if (action === 'submit' && url) {
      const result = await submitUrlForIndexing(url, type);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400,
      });
    }

    // Batch URL submission
    if (action === 'batch' && urls && Array.isArray(urls)) {
      const result = await batchSubmitUrls(urls, type);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Submit match URL (convenience method)
    if (action === 'submit-match' && url) {
      const baseUrl = 'https://damitv.com.np';
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const result = await submitUrlForIndexing(fullUrl, type);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400,
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "submit", "batch", or "submit-match"' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    console.error('Google Indexing function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
