export async function onRequest(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (context.request.method !== "PUT" && context.request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
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
        const body = await context.request.text();
        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        if (Array.isArray(parsed)) {
            parsed = { novels: parsed, users: [], messages: [], community: [] };
        } else if (typeof parsed === "object" && parsed !== null) {
            if (!Array.isArray(parsed.novels)) parsed.novels = [];
            if (!Array.isArray(parsed.users)) parsed.users = [];
            if (!Array.isArray(parsed.messages)) parsed.messages = [];
            if (!Array.isArray(parsed.community)) parsed.community = [];
        } else {
            parsed = { novels: [], users: [], messages: [], community: [] };
        }

        const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": key
            },
            body: JSON.stringify(parsed)
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
