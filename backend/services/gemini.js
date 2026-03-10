const { GoogleGenerativeAI } = require('@google/generative-ai');

const detectLanguage = (text) => {
    const hindiRange = /[\u0900-\u097F]/;
    const gujaratiRange = /[\u0A80-\u0AFF]/;
    if (gujaratiRange.test(text)) return 'Gujarati';
    if (hindiRange.test(text)) return 'Hindi';
    return 'English';
};

const isGreeting = (text) => {
    const greetings = ['hi', 'hello', 'hey', 'namaste', 'kem cho', 'ram ram', 'namaskar'];
    return greetings.includes(text.toLowerCase().trim());
};

const FARMER_SYSTEM = `You are AgriAssist, an expert agricultural AI assistant for Indian farmers.
Always respond in the language specified by the user.
When asked about soil, crops, or farm issues — provide a STRUCTURED REPORT in this exact JSON format wrapped in a code block:

\`\`\`json
{
  "type": "report",
  "diagnosis": "...",
  "severity": "Low|Medium|High",
  "recommendation": "...",
  "dosage": "...",
  "purchaseLocations": ["...", "..."],
  "alternatives": ["...", "..."],
  "warning": "..."
}
\`\`\`

For general questions, answer conversationally using markdown (bold, bullet points, emojis).
Always consider: soil health, fertilizer (chemical & organic), pest control, tool suggestions, safety warnings.
Keep language simple and farmer-friendly.`;

const SHOPKEEPER_SYSTEM = `You are AgriAssist B2B assistant for Indian agriculture shopkeepers.
Always respond in the language specified by the user.
Help with: inventory management, chemical/organic product classification, stock advisory, seasonal demand trends.
Keep responses professional, concise, and actionable. Use markdown for structured responses.`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const extractRetryDelay = (errMsg = '') => {
    const match = errMsg.match(/retry in (\d+)/i);
    return match ? parseInt(match[1]) * 1000 : null;
};

const generateReply = async ({ role = 'farmer', message, historyText = '', weatherInfo = '', language = 'English', imageBase64 = null, imageMimeType = 'image/jpeg' }) => {
    const systemPrompt = role === 'shopkeeper' ? SHOPKEEPER_SYSTEM : FARMER_SYSTEM;

    const fullPrompt = `${systemPrompt}

Context:
- User Role: ${role}
- Respond in: ${language}
- Current Weather: ${weatherInfo || 'Not provided'}

${historyText ? `Recent Conversation:\n${historyText}\n` : ''}
Current User Message: ${message}

Please respond helpfully in ${language}.`;

    // gemini-1.5-flash has the most generous free-tier quota
    const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const modelName of MODELS) {
        let retries = 2;
        while (retries >= 0) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: modelName });

                let parts;
                if (imageBase64) {
                    parts = [
                        { text: fullPrompt },
                        { inlineData: { mimeType: imageMimeType, data: imageBase64 } }
                    ];
                } else {
                    parts = [{ text: fullPrompt }];
                }

                const result = await model.generateContent(parts);
                const text = result.response.text();
                console.log(`✅ Gemini reply (${modelName}) ${imageBase64 ? '[vision]' : '[text]'}`);
                return text;
            } catch (err) {
                const msg = err.message || '';
                console.error(`Gemini error (${modelName}):`, msg.substring(0, 150));

                // Rate-limited — wait if retry delay is short enough, else break to next model
                if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('retry')) {
                    const delayMs = extractRetryDelay(msg);
                    if (delayMs && delayMs <= 10000 && retries > 0) {
                        console.log(`⏳ Rate limited on ${modelName}. Waiting ${delayMs}ms before retry...`);
                        await sleep(delayMs + 1000);
                        retries--;
                        continue;
                    }
                    // Too long to wait — move to next model immediately
                    console.log(`⏭️ Rate limit too long on ${modelName}. Trying next model...`);
                    break;
                }

                // Non-rate-limit error — no point retrying same model
                break;
            }
        }
    }

    return null;
};

module.exports = { generateReply, detectLanguage, isGreeting, FARMER_SYSTEM, SHOPKEEPER_SYSTEM };

