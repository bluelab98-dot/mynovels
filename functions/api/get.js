export async function onRequest(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const binId = context.env.BIN_ID;
    const key = context.env.MASTER_KEY;

    if (!binId || !key) {
        return new Response(JSON.stringify({ error: "Missing env vars" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }

    try {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { "X-Master-Key": key },
            cache: "no-store"
        });
        const data = await r.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
}
