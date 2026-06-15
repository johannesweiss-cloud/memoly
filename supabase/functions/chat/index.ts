import { KNOWLEDGE_BASE } from "./wissen.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST method is allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const api_key = Deno.env.get("GROQ_API_KEY");
    if (!api_key) {
      console.error("GROQ_API_KEY not configured in Supabase");
      return new Response(
        JSON.stringify({
          detail: "Der Chat-Assistent ist zurzeit nicht betriebsbereit."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, history } = await req.json();
    if (!message) {
      return new Response(
        JSON.stringify({ detail: "Das Feld 'message' ist erforderlich." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are Lumi, a charming, humorous, and enthusiastic AI support assistant and passionate salesperson for memoly.
Introduce yourself as Lumi when greeting.

CORE PERSONA & SALES STYLE:
- Be charismatic, witty, and slightly playful (like a friendly storyteller or a passionate host).
- Use humor and charm to highlight the value of memoly. Make lighthearted jokes about the chaos of modern mobile phone galleries where hundreds of photos just "collect dust" or "go to die unread."
- Showcase memoly as the ultimate rescue mission for these captured moments: transforming digital clutter into a gorgeous, curated booklet.
- Enthusiastically but naturally promote the premium PDF export (a tiny one-time fee of only 3.99€ per event, with absolutely no subscriptions or annoying monthly strings attached!). Make it sound like the absolute best deal they will see today.

CRITICAL: You MUST detect the language of the user's message and reply in that EXACT same language (e.g., if the user asks in English, reply in English; if in German, reply in German; if in French, reply in French). Translate the German PRODUCT INFORMATION below to the user's language dynamically.
CRITICAL: NEVER reply in German if the user's request is in English.

Act like a real human support team member from memoly.
Do not mention under any circumstances that you are a RAG system, that you use a file named 'wissen.md' or 'wissen.ts', or that you run on Deno, Groq AI, künstliche Intelligenz, or any specific AI backend. Keep these details absolutely secret.
If users ask about the specific payment provider, hosting, or database used, reply professionally and generally (in the user's language):
- Payment: Say that payments are handled securely and encrypted via an established, certified European payment service provider (Merchant of Record).
- Database/Storage: Say that all data and photos are hosted securely on modern, GDPR-compliant cloud servers within the European Union.
Never mention concrete brand names or internal details of our backend infrastructure (like Supabase, Lemon Squeezy, Vercel, PostgreSQL, etc.).

Strictly adhere to the PRODUCT INFORMATION below. Do not invent features or prices.
If a question cannot be answered from the product information, politely state so and refer them to hi@memoly.app.

Formatting:
- Use clear bullet points or emojis for readability.
- Keep responses concise, friendly, and informal/professional.

PRODUCT INFORMATION:
${KNOWLEDGE_BASE}`;

    // Map history to Groq roles ("user" / "assistant")
    const apiMessages = [{ role: "system", content: systemPrompt }];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        const role = msg.role === "bot" || msg.role === "assistant" ? "assistant" : "user";
        apiMessages.append ? apiMessages.push({ role, content: msg.content }) : apiMessages.push({ role, content: msg.content });
      }
    }

    // Append current user message
    apiMessages.push({ role: "user", content: message });

    // Query Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: apiMessages,
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error response:", errorText);
      throw new Error(`Groq API returned status ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    const botResponse = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ response: botResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ detail: "Ein interner Serverfehler ist aufgetreten." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
