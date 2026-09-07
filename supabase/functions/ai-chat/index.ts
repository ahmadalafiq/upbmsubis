// supabase/functions/ai-chat/index.ts
//
// Proksi selamat antara webapp UPBM Subis dengan Gemini API.
// Kunci API Gemini disimpan sebagai SECRET di Supabase — TIDAK PERNAH
// terdedah kepada browser/client.
//
// CARA DEPLOY:
// 1. Pasang Supabase CLI (jika belum): npm install -g supabase
// 2. Dalam folder projek: supabase functions new ai-chat
//    (ganti kandungan index.ts yang dijana dengan fail ini)
// 3. Set kunci rahsia:
//    supabase secrets set GEMINI_API_KEY=xxxxxxxxxxxxxxxx
// 4. Deploy:
//    supabase functions deploy ai-chat
//
// Client (index.html) panggil guna: sb.functions.invoke('ai-chat', {body:{...}})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// System prompt — kekalkan Gemini fokus pada konteks UPBM Subis sahaja.
const SYSTEM_PROMPT = `
Anda ialah pembantu AI untuk sistem UPBM Subis — sistem pengurusan program
pertandingan kokurikulum untuk PPD Subis, Sarawak.

Peranan anda:
- Bantu pengguna (guru/pengelola/admin) memahami cara guna sistem ini
  (contoh: cara daftar program, cara isi borang penyertaan, maksud status
  DRAFT/AKTIF/TUTUP, cara guna carian & penapis).
- Jawab dalam Bahasa Malaysia, ringkas dan jelas.
- Jika soalan di luar skop sistem UPBM Subis, beritahu dengan sopan bahawa
  anda hanya boleh bantu berkaitan sistem ini.
- JANGAN sekali-kali cadangkan langkah yang melangkau kebenaran akses
  (contoh: jangan kata "anda boleh terus edit walaupun bukan admin").
- Anda TIDAK mempunyai akses terus untuk mengubah data — anda hanya
  membantu dengan maklumat dan panduan buat masa ini.
`.trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY belum ditetapkan sebagai secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { message, history, context } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Medan 'message' diperlukan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Bina senarai "contents" ikut format Gemini — riwayat + mesej semasa
    const contents: Array<{ role: string; parts: { text: string }[] }> = [];

    if (Array.isArray(history)) {
      for (const h of history) {
        if (!h || !h.text) continue;
        contents.push({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: String(h.text) }],
        });
      }
    }

    const contextLine = context
      ? `\n\n[Konteks halaman semasa: ${JSON.stringify(context)}]`
      : "";

    contents.push({
      role: "user",
      parts: [{ text: message + contextLine }],
    });

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "Gemini API gagal memberi respons." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Maaf, saya tidak dapat menjana jawapan buat masa ini.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat function error:", e);
    return new Response(
      JSON.stringify({ error: "Ralat dalaman pelayan." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
