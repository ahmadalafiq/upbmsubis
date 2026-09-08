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
- PENTING — jawapan anda dipaparkan sebagai teks biasa (plain text), BUKAN markdown.
  JANGAN sekali-kali guna simbol pemformatan seperti **tebal**, *condong*, # tajuk,
  - senarai bullet, atau \`kod\`. Tulis dalam ayat biasa. Untuk senarai, guna nombor
  biasa (1. 2. 3.) atau ayat berterusan, bukan simbol bullet/asterisk.
- ANDA ADA AKSES DATA SEBENAR sistem melalui fungsi (tools) yang disediakan — guna fungsi
  berkenaan untuk jawab soalan seperti "sekolah tertinggi penyertaan", "sekolah banyak
  pencapaian", "guru terbaik", "murid terbaik", "program paling popular", atau statistik
  keseluruhan sistem. JANGAN reka/anggar angka — SENTIASA panggil fungsi yang berkaitan
  dahulu sebelum jawab soalan berbentuk statistik/data. Jawapan akhir bina berdasarkan
  data sebenar yang dipulangkan oleh fungsi tersebut sahaja.
`.trim();

// == RPC analitik yang boleh dipanggil Gemini (function-calling) ===
// Fungsi ni SUDAH wujud di Supabase (dicipta terus, bukan melalui fail ni) —
// senarai declaration di bawah mesti sepadan tepat dengan tandatangan sebenar.
const SUPABASE_URL = "https://pztuvriqjgfwczkuguky.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dHV2cmlxamdmd2N6a3VndWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDY4NjksImV4cCI6MjA5OTcyMjg2OX0.k6Y84-6C4pD7xXSD7gaVGBiVimhKi6eNjQ3H-DrVQqY";

const ANALITIK_TOOLS = [
  {
    name: "analitik_ringkasan",
    description: "Ringkasan keseluruhan sistem: jumlah program, program aktif, penyertaan, pencapaian, sekolah aktif, akaun pengguna.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "analitik_sekolah_penyertaan",
    description: "Senarai sekolah dengan bilangan PENYERTAAN (peserta didaftarkan) tertinggi, susun menurun.",
    parameters: {
      type: "OBJECT",
      properties: { p_limit: { type: "INTEGER", description: "Bilangan sekolah nak dipaparkan, lalai 10" } },
    },
  },
  {
    name: "analitik_sekolah_pencapaian",
    description: "Senarai sekolah dengan bilangan & jumlah markah PENCAPAIAN (kemenangan/anugerah) tertinggi, susun menurun.",
    parameters: {
      type: "OBJECT",
      properties: { p_limit: { type: "INTEGER", description: "Bilangan sekolah nak dipaparkan, lalai 10" } },
    },
  },
  {
    name: "analitik_guru_terbaik",
    description: "Senarai guru pengiring dengan jumlah pencapaian/markah peserta bimbingan mereka tertinggi (\"guru terbaik\").",
    parameters: {
      type: "OBJECT",
      properties: { p_limit: { type: "INTEGER", description: "Bilangan guru nak dipaparkan, lalai 10" } },
    },
  },
  {
    name: "analitik_murid_terbaik",
    description: "Senarai peserta/murid dengan jumlah pencapaian/markah tertinggi (\"murid/peserta terbaik\").",
    parameters: {
      type: "OBJECT",
      properties: { p_limit: { type: "INTEGER", description: "Bilangan murid nak dipaparkan, lalai 10" } },
    },
  },
  {
    name: "analitik_program_popular",
    description: "Senarai program dengan bilangan penyertaan (peserta) tertinggi — program paling popular/ramai disertai.",
    parameters: {
      type: "OBJECT",
      properties: { p_limit: { type: "INTEGER", description: "Bilangan program nak dipaparkan, lalai 10" } },
    },
  },
  {
    name: "analitik_carian_sekolah",
    description: "Cari statistik satu sekolah tertentu (jumlah penyertaan, pencapaian, markah) ikut nama sekolah.",
    parameters: {
      type: "OBJECT",
      properties: { p_nama: { type: "STRING", description: "Nama sekolah atau sebahagian nama untuk dicari" } },
      required: ["p_nama"],
    },
  },
];

async function panggilRpcAnalitik(name: string, args: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(args || {}),
  });
  if (!r.ok) {
    const errText = await r.text();
    console.error(`RPC ${name} gagal:`, errText);
    throw new Error(`RPC ${name} gagal: ${r.status}`);
  }
  return await r.json();
}

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
    const contents: Array<{ role: string; parts: any[] }> = [];

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
        tools: [{ function_declarations: ANALITIK_TOOLS }],
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

    let data = await geminiRes.json();
    let candidate = data?.candidates?.[0];
    let loopCount = 0;

    // Layan sehingga 3 pusingan function-calling (elak gelung tak berkesudahan)
    while (loopCount < 3) {
      const parts = candidate?.content?.parts || [];
      const fnCallPart = parts.find((p: any) => p.functionCall);
      if (!fnCallPart) break; // Gemini dah bagi jawapan teks akhir, keluar loop

      const fnName = fnCallPart.functionCall.name;
      const fnArgs = fnCallPart.functionCall.args || {};
      let fnResult: unknown;
      try {
        fnResult = await panggilRpcAnalitik(fnName, fnArgs);
      } catch (e) {
        fnResult = { error: String(e) };
      }

      // Tambah giliran model (functionCall) + giliran functionResponse ke perbualan.
      // PENTING: hantar SEMULA fnCallPart asal sepenuhnya (bukan bina objek baharu) —
      // model 3.x Gemini sertakan medan 'thoughtSignature' bersama functionCall yang
      // WAJIB dikembalikan verbatim, kalau tidak Gemini tolak (400 INVALID_ARGUMENT).
      contents.push({ role: "model", parts: [fnCallPart] } as any);
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: fnName, response: { result: fnResult } } }],
      } as any);

      const followUp = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          tools: [{ function_declarations: ANALITIK_TOOLS }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
      });
      if (!followUp.ok) {
        const errText = await followUp.text();
        console.error("Gemini API error (follow-up):", errText);
        break;
      }
      data = await followUp.json();
      candidate = data?.candidates?.[0];
      loopCount++;
    }

    const reply =
      candidate?.content?.parts?.find((p: any) => p.text)?.text?.trim() ||
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
