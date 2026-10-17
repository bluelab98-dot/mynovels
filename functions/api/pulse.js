export async function onRequest(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (context.request.method !== "POST") {
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
        const body = await context.request.json();
        const authorId = body?.authorId;

        if (!authorId || typeof authorId !== "string") {
            return new Response(JSON.stringify({ error: "Missing authorId" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { "X-Master-Key": key }
        });

        if (!getResponse.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await getResponse.json();
        let record = data.record;

        if (Array.isArray(record)) {
            record = { novels: record, users: [], community: [], messages: [] };
        } else if (!record || typeof record !== "object") {
            record = { novels: [], users: [], community: [], messages: [] };
        } else {
            if (!Array.isArray(record.users)) record.users = [];
            if (!Array.isArray(record.novels)) record.novels = [];
            if (!Array.isArray(record.community)) record.community = [];
            if (!Array.isArray(record.messages)) record.messages = [];
        }

        const userIndex = record.users.findIndex(u => u.authorId === authorId);
        if (userIndex === -1) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const timestamp = Date.now();
        record.users[userIndex].lastSeen = timestamp;

        const putResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": key
            },
            body: JSON.stringify(record)
        });

        if (!putResponse.ok) {
            return new Response(JSON.stringify({ error: "Failed to save" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({ ok: true, lastSeen: timestamp }), {
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
