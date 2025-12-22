import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  message: string;
  matchTitle?: string;
  streamUrl?: string;
  platforms?: ('instagram' | 'twitter')[];
  imageUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Social webhook triggered');
    
    const payload: WebhookPayload = await req.json();
    
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.message) {
      console.error('❌ Missing message in payload');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the received data for Make.com to process
    const responseData = {
      success: true,
      received: {
        message: payload.message,
        matchTitle: payload.matchTitle || null,
        streamUrl: payload.streamUrl || null,
        platforms: payload.platforms || ['instagram', 'twitter'],
        imageUrl: payload.imageUrl || null,
        timestamp: new Date().toISOString(),
      }
    };

    console.log('✅ Webhook processed successfully:', responseData);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
