// supabase/functions/send-whatsapp/index.ts
// Supabase Edge Function — Secure proxy for WhatsApp Business Cloud API
//
// This function holds the WhatsApp access token server-side and forwards
// message requests to Meta's Graph API. The token never reaches the browser.
//
// Required Supabase Secrets:
//   WHATSAPP_ACCESS_TOKEN   — Meta System User access token
//   WHATSAPP_PHONE_NUMBER_ID — Your WhatsApp Business phone number ID

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GRAPH_API_VERSION = "v21.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TextMessageRequest {
  to: string; // Phone number in international format (e.g., "919876543210")
  message: string; // Message body text
  type: "text";
}

interface TemplateMessageRequest {
  to: string;
  templateName: string; // Pre-approved template name
  languageCode?: string; // e.g., "en_US"
  components?: Array<{
    type: string;
    parameters: Array<{ type: string; text?: string }>;
  }>;
  type: "template";
}

type MessageRequest = TextMessageRequest | TemplateMessageRequest;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get secrets from environment
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!accessToken || !phoneNumberId) {
      console.error("Missing WhatsApp API configuration");
      return new Response(
        JSON.stringify({
          success: false,
          error: "WhatsApp API is not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse incoming request
    const body: MessageRequest = await req.json();

    // Validate required fields
    if (!body.to) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'to' phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the phone number — remove +, spaces, dashes
    const cleanPhone = body.to.replace(/[\s\-+]/g, "");

    // Build the Meta Graph API payload
    let graphPayload: Record<string, unknown>;

    if (body.type === "template") {
      // Template message (required for first-contact outreach)
      const templateReq = body as TemplateMessageRequest;
      graphPayload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateReq.templateName,
          language: {
            code: templateReq.languageCode || "en_US",
          },
          ...(templateReq.components && { components: templateReq.components }),
        },
      };
    } else {
      // Free-form text message (works within 24-hour window or test numbers)
      const textReq = body as TextMessageRequest;
      if (!textReq.message) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing 'message' text" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      graphPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: textReq.message,
        },
      };
    }

    // Call Meta's WhatsApp Cloud API
    const graphUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    console.log(`📱 Sending WhatsApp message to ${cleanPhone}...`);

    const graphResponse = await fetch(graphUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphPayload),
    });

    const graphData = await graphResponse.json();

    if (!graphResponse.ok) {
      console.error("WhatsApp API error:", JSON.stringify(graphData));

      // Extract a user-friendly error message
      const errorMessage =
        graphData?.error?.message ||
        graphData?.error?.error_user_msg ||
        "Failed to send WhatsApp message";
      const errorCode = graphData?.error?.code || graphResponse.status;

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          errorCode,
          details: graphData?.error,
        }),
        { status: graphResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success — extract message ID
    const messageId = graphData?.messages?.[0]?.id || null;
    const contactWaId = graphData?.contacts?.[0]?.wa_id || null;

    console.log(`✅ WhatsApp message sent successfully. ID: ${messageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        contactWaId,
        status: "sent",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
