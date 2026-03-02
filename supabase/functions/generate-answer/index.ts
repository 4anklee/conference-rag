import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Verify authenticated user
    const authResult = await requireAuth(req);
    if ("error" in authResult) return authResult.error;

    try {
        const { question, context_talks, stream } = await req.json();

        if (!question || typeof question !== "string") {
            return new Response(
                JSON.stringify({ error: "Missing or invalid 'question' field" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        if (!Array.isArray(context_talks) || context_talks.length === 0) {
            return new Response(
                JSON.stringify({ error: "Missing or empty 'context_talks' array" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
            return new Response(
                JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Format context from talks
        const context = context_talks
            .map(
                (talk: { title: string; speaker: string; text: string }) =>
                    `--- "${talk.title}" by ${talk.speaker} ---\n${talk.text}`,
            )
            .join("\n\n");

        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful assistant that answers questions about General Conference talks. " +
                    "Answer ONLY based on the provided talk excerpts. " +
                    "Cite which talk(s) you draw from by mentioning the title and speaker. " +
                    "If the excerpts don't contain enough information to answer, say so.",
            },
            {
                role: "user",
                content: `Question: ${question}\n\nRelevant talk excerpts:\n\n${context}`,
            },
        ];

        // --- Streaming mode ---
        if (stream) {
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${openaiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        stream: true,
                        messages,
                        temperature: 0.3,
                        max_tokens: 1024,
                    }),
                },
            );

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                return new Response(
                    JSON.stringify({
                        error: err.error?.message || "OpenAI API error",
                    }),
                    {
                        status: response.status,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    },
                );
            }

            // Relay the SSE stream, extracting just the content deltas
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            const readable = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                            controller.close();
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith("data: ")) continue;
                            const data = trimmed.slice(6);
                            if (data === "[DONE]") {
                                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                                controller.close();
                                return;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(
                                        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                                    );
                                }
                            } catch {
                                // Skip malformed chunks
                            }
                        }
                    }
                },
            });

            return new Response(readable, {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                },
            });
        }

        // --- Non-streaming mode (original behavior) ---
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${openaiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages,
                    temperature: 0.3,
                    max_tokens: 1024,
                }),
            },
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return new Response(
                JSON.stringify({
                    error: err.error?.message || "OpenAI API error",
                }),
                {
                    status: response.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        return new Response(JSON.stringify({ answer }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
