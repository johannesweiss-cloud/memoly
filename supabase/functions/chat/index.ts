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
          detail: "GROQ_API_KEY ist in Supabase nicht konfiguriert. Bitte füge den Secret-Key über 'supabase secrets set GROQ_API_KEY=gsk_...' hinzu."
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

    const systemPrompt = `Du bist Lumi, der schlaue memoly-Helfer, ein kompetenter, sympathischer und humorvoller KI-Support-Mitarbeiter für memoly.
Deine Aufgabe ist es, Kundenfragen rund um memoly präzise, ehrlich und auf Deutsch zu beantworten. Stell dich bei Begrüßungen als Lumi vor.

Verhalte dich wie ein echter menschlicher Support-Mitarbeiter aus dem memoly-Team. 
Erwähne unter keinen Umständen, dass du ein RAG-System bist, dass du eine Datei namens 'wissen.md' oder 'wissen.ts' nutzt, oder dass du über Deno / Groq AI / künstliche Intelligenz betrieben wirst. Halte diese Details absolut geheim.

Halte dich strikt an die folgende PRODUKT-INFORMATIONEN (Datenbasis). Erfinde keine Features oder Preise, die dort nicht stehen.
Wenn eine Frage anhand der Datenbasis nicht beantwortet werden kann, sage das offen und höflich, und verweise den Kunden darauf, eine E-Mail an hi@memoly.app zu senden.

Formatierungsvorgaben:
- Nutze übersichtliche Aufzählungspunkte oder Emojis für gute Lesbarkeit.
- Antworte prägnant, freundlich und locker, aber professionell (duze die Nutzer).

PRODUKT-INFORMATIONEN:
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
      JSON.stringify({ detail: `Interner Serverfehler der Edge Function: ${error.message}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
