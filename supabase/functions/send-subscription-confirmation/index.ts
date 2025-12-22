import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  selectedTeams: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, selectedTeams }: SubscriptionEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const teamsText = selectedTeams.length > 0 
      ? `<p>You've subscribed to match alerts for: <strong>${selectedTeams.join(", ")}</strong></p>`
      : `<p>You'll receive alerts for all major matches.</p>`;

    const emailResponse = await resend.emails.send({
      from: "Sports Stream <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Match Alerts! 🏆",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
              .icon { font-size: 48px; margin-bottom: 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">🏆</div>
                <h1>Welcome to Match Alerts!</h1>
              </div>
              <div class="content">
                <h2>You're all set! 🎉</h2>
                <p>Thank you for subscribing to our match alert service. You'll never miss an important game again!</p>
                ${teamsText}
                <p>We'll send you notifications about:</p>
                <ul>
                  <li>📅 Upcoming matches</li>
                  <li>🔴 Live match streams</li>
                  <li>⚽ Match results and highlights</li>
                </ul>
                <p>Stay tuned for exciting updates!</p>
              </div>
              <div class="footer">
                <p>You're receiving this email because you subscribed to match alerts.</p>
                <p>If you didn't subscribe, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-confirmation function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
