const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OLLAMA_URL = 'http://localhost:11434/api/chat';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AIParams {
    messages: ChatMessage[];
    systemPrompt?: string;
    source?: 'cloud' | 'local';
    hasImages?: boolean;
    onToken?: (token: string) => void;
    signal?: AbortSignal;
}

export const getAIResponse = async ({
    messages,
    systemPrompt,
    source = 'cloud',
    hasImages = false,
    onToken,
    signal
}: AIParams) => {
    if (source === 'local') {
        return getLocalLlamaResponse(messages, systemPrompt, onToken, signal);
    }

    const model = hasImages ? 'google/gemini-2.0-flash-001' : 'google/gemini-2.0-flash-001';

    const allMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            signal,
            headers: {
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'NEXORA',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: allMessages,
                temperature: 0.7,
                stream: !!onToken,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || `API Error: ${response.status}`);
        }

        if (onToken && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            const token = data.choices[0]?.delta?.content || '';
                            if (token) {
                                fullText += token;
                                onToken(fullText);
                            }
                        } catch (e) {
                            // Part of a chunk or meta information
                        }
                    }
                }
            }
            return fullText;
        } else {
            const data = await response.json();
            return data.choices[0].message.content;
        }
    } catch (error: any) {
        console.error('Cloud AI Error:', error);
        throw new Error(error.message || 'Intelligence network unreachable.');
    }
};

const getLocalLlamaResponse = async (
    messages: ChatMessage[],
    systemPrompt?: string,
    onToken?: (token: string) => void,
    signal?: AbortSignal
) => {
    const allMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: allMessages,
                stream: !!onToken,
            }),
        });

        if (!response.ok) {
            throw new Error('Local Llama (Ollama) not responding. Ensure it is running on port 11434.');
        }

        if (onToken && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        const token = data.message?.content || '';
                        if (token) {
                            fullText += token;
                            onToken(fullText);
                        }
                    } catch (e) {
                        // Incomplete JSON or other error
                    }
                }
            }
            return fullText;
        } else {
            const data = await response.json();
            return data.message.content;
        }
    } catch (error: any) {
        console.error('Local AI Error:', error);
        throw new Error('Local intelligence unreachable. Please check your Llama installation.');
    }
};

export const getSuggestions = async (userMessage: string, aiResponse: string): Promise<string[]> => {
    const prompt = `Based on this interaction, suggest 3 concise, highly relevant follow-up questions the user might ask next.
    
    User: ${userMessage}
    Assistant: ${aiResponse}
    
    Return ONLY a JSON array of 3 strings. Example: ["How does this work?", "Can you show an example?", "What are the alternatives?"]`;

    try {
        const response = await getAIResponse({
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: "You are a helpful assistant that generates relevant follow-up questions. Output only a valid JSON array of strings. No explanation.",
        });

        const suggestionsArr = JSON.parse(response.trim().match(/\[[\s\S]*\]/)?.[0] || '[]');
        return Array.isArray(suggestionsArr) ? suggestionsArr.slice(0, 3) : [];
    } catch (error) {
        console.error('Failed to get suggestions:', error);
        return [];
    }
};
