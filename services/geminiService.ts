
import { GoogleGenAI, Type, Part } from "@google/genai";
import { LoreItem, WorldGenOptions, GeneratedWorldData, SupportingCharacter } from "../types";


type ApiConfig = {
    provider: 'gemini' | 'openrouter' | 'koboldcpp';
    model: string; // For OpenRouter
    apiKey: string; // For OpenRouter
    url: string; // For OpenRouter & KoboldCpp
};

type ImageGenApiConfig = {
    useHuggingFace: boolean;
    hfApiKey: string;
    hfUrl: string;
};

export type OpenRouterModelInfo = {
  id: string;
  contextLength: number;
};

// --- Model Fetcher ---
export const fetchOpenRouterModels = async (apiUrl: string): Promise<OpenRouterModelInfo[]> => {
    try {
        const response = await fetch(`${apiUrl}/models`);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("OpenRouter API Error (fetching models):", errorBody);
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
            // Extract model IDs and context length, then sort alphabetically
            return data.data
              .map((model: any) => ({
                id: model.id,
                contextLength: model.context_length || 0,
              }))
              .sort((a: OpenRouterModelInfo, b: OpenRouterModelInfo) => a.id.localeCompare(b.id));
        }
        return [];
    } catch (error) {
        console.error("Error fetching OpenRouter models:", error);
        if (error instanceof Error) throw error;
        throw new Error("An unknown error occurred while fetching models.");
    }
};

// --- Google Gemini SDK setup ---
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}
const geminiModel = 'gemini-2.5-flash';


// --- OpenAI-Compatible API Fetcher ---
const callOpenAICompatible = async (prompt: any[], config: ApiConfig, jsonMode: boolean = false) => {
    if (config.provider === 'openrouter' && !config.apiKey) {
        throw new Error("OpenRouter API Key is missing. Please add it in the API Configuration section.");
    }
    if (!config.url) {
        throw new Error("API URL is missing. Please add it in the API Configuration section.");
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (config.provider === 'openrouter') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['HTTP-Referer'] = window.location.hostname; // Recommended by OpenRouter
        headers['X-Title'] = 'AI Story Generator'; // Recommended by OpenRouter
    }
    
    const body: any = {
        messages: prompt,
    };

    if (config.provider === 'openrouter') {
        body.model = config.model;
    }

    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${config.url}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error:", errorBody);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
};

export const getFullPromptForTokenEstimation = (
  story: string,
  context: string,
  flavor: string,
  length: number
): string => {
  const systemPrompt = story
    ? `You are a creative storyteller. Your task is to continue the story provided below in a ${flavor} tone. The continuation should be approximately ${length} characters long. Do not repeat or summarize the story I provide. Only write the next part of the story.`
    : `You are a creative storyteller. Your task is to start a new story in a ${flavor} tone. The story opening should be approximately ${length} characters long.`;

  const storySection = story
    ? `STORY SO FAR:\n---\n${story}\n---\n\nCONTINUATION:`
    : `STORY OPENING:`;

  const userPrompt = `
        ADDITIONAL CONTEXT TO CONSIDER:
        ---
        ${context || "No additional context provided."}
        ---

        ${storySection}
    `;

  return `${systemPrompt}\n${userPrompt}`;
};

export const generateContinuation = async (
  story: string,
  context: string,
  flavor: string,
  length: number,
  apiConfig: ApiConfig,
): Promise<string> => {
    
    const systemPrompt = story
        ? `You are a creative storyteller. Your task is to continue the story provided below in a ${flavor} tone, taking inspiration from any provided text context. The continuation should be approximately ${length} characters long. Do not repeat or summarize the story I provide. Only write the next part of the story.`
        : `You are a creative storyteller. Your task is to start a new story in a ${flavor} tone, taking inspiration from any provided text context. The story opening should be approximately ${length} characters long.`;

    const storySection = story 
        ? `STORY SO FAR:\n---\n${story}\n---\n\nCONTINUATION:` 
        : `STORY OPENING:`;

    const userPrompt = `
        ADDITIONAL CONTEXT TO CONSIDER:
        ---
        ${context || 'No additional context provided.'}
        ---

        ${storySection}
    `;

    if (apiConfig.provider === 'openrouter' || apiConfig.provider === 'koboldcpp') {
        // --- OpenAI-Compatible Logic ---
        const userMessageContent: any[] = [{ type: 'text', text: userPrompt }];
        
        const prompt = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageContent }
        ];

        try {
            const data = await callOpenAICompatible(prompt, apiConfig);
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error(`Error generating continuation with ${apiConfig.provider}:`, error);
            if (error instanceof Error) throw error;
            throw new Error(`Failed to communicate with the ${apiConfig.provider} model.`);
        }

    } else {
        // --- Google Gemini Logic ---
        if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");
        
        const fullPrompt = `${systemPrompt}\n${userPrompt}`;
        const contentParts: Part[] = [{ text: fullPrompt }];
        
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: { parts: contentParts },
            });
            return response.text.trim();
        } catch (error) {
            console.error("Error generating continuation with Gemini:", error);
            throw new Error("Failed to communicate with the AI model.");
        }
    }
};


export const generateIdeas = async (
  story: string,
  context: string,
  flavor: string,
  apiConfig: ApiConfig,
): Promise<string[]> => {
    
    const systemPrompt = story
        ? `You are a creative writing assistant. Based on the story and context below, generate exactly two different and compelling ideas for what could happen next. The tone of the ideas should be ${flavor}. Format your response as a JSON object with a single key "ideas" which is an array of two strings. Example: {"ideas": ["First idea...", "Second idea..."]}`
        : `You are a creative writing assistant. Generate exactly two different and compelling ideas for starting a new story, inspired by the context. The tone of the ideas should be ${flavor}. Format your response as a JSON object with a single key "ideas" which is an array of two strings. Example: {"ideas": ["First story starter idea...", "Second story starter idea..."]}`;
    
    const storySection = story ? `STORY SO FAR:\n---\n${story}\n---` : '';

    const userPrompt = `
        ADDITIONAL CONTEXT TO CONSIDER:
        ---
        ${context || 'No additional context provided.'}
        ---

        ${storySection}
    `;

    try {
        let jsonString: string;
        if (apiConfig.provider === 'openrouter' || apiConfig.provider === 'koboldcpp') {
            // --- OpenAI-Compatible Logic ---
            const userMessageContent: any[] = [{ type: 'text', text: userPrompt }];

            const prompt = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessageContent }
            ];

            const data = await callOpenAICompatible(prompt, apiConfig, true); // true for JSON mode
            jsonString = data.choices[0].message.content.trim();
            
        } else {
            // --- Google Gemini Logic ---
            if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");
            
            const fullPrompt = `${systemPrompt}\n${userPrompt}`;
            const contentParts: Part[] = [{ text: fullPrompt }];

            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: { parts: contentParts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            ideas: {
                                type: Type.ARRAY,
                                description: "An array containing two distinct story continuation ideas.",
                                items: {
                                    type: Type.STRING
                                }
                            }
                        },
                        required: ["ideas"]
                    }
                }
            });
            jsonString = response.text.trim();
        }

        const result = JSON.parse(jsonString);
        if (result && Array.isArray(result.ideas) && result.ideas.length > 0) {
            return result.ideas;
        }
        
        // Fallback if parsing fails or array is empty
        return ["The AI couldn't generate ideas in the expected format. Please try again."];

    } catch (error) {
        console.error("Error generating ideas:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to parse AI response or communicate with the model.");
    }
};

const formatLoreForPrompt = (loreItems: LoreItem[]): string => {
    if (loreItems.length === 0) return "No existing lore provided.";

    return loreItems
        .map(item => {
            const typeHeader = item.type === 'Custom' ? (item.customTypeName || 'Custom').toUpperCase() : item.type.toUpperCase();
            
            let content = `Name: ${item.name.trim()}`;
            if(item.description.trim()){
                content += `\nDescription: ${item.description.trim()}`;
            }

            return `${typeHeader}:\n${content}`;
        })
        .join('\n\n---\n\n');
}

const formatWorldContext = (worldName: string, worldDescription: string, loreItems: LoreItem[]): string => {
    let context = '';
    if (worldName.trim()) context += `WORLD NAME: ${worldName.trim()}\n`;
    if (worldDescription.trim()) context += `WORLD DESCRIPTION: ${worldDescription.trim()}\n\n`;
    
    if (loreItems.length > 0) {
        context += "LORE ITEMS:\n---\n" + formatLoreForPrompt(loreItems);
    }
    
    return context.trim() || 'No existing world context provided.';
}

const generateSimpleText = async (prompt: string): Promise<string> => {
    if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");
    try {
        const response = await ai.models.generateContent({
            model: geminiModel,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating text with Gemini:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
}

export const generateWorldName = async (story: string, loreItems: LoreItem[]): Promise<string> => {
    const systemPrompt = `You are a creative assistant. When asked for a name, you must respond with ONLY the generated name in plain text. Do not include any prefixes, labels (like "Name:"), markdown, or quotation marks.`;
    
    const context = formatLoreForPrompt(loreItems);
    const hasContext = story.trim() !== '' || context !== "No existing lore provided.";

    const userPrompt = hasContext 
        ? `Based on the story and lore provided, generate a single, creative, and fitting name for this world.

STORY SO FAR:
---
${story || 'No story written yet.'}
---

EXISTING LORE:
---
${context}
---`
        : `Generate a single, creative, and random name for a fantasy or sci-fi world.`;
    
    return generateSimpleText(`${systemPrompt}\n\n${userPrompt}`);
};

export const generateWorldDescription = async (worldName: string, story: string, loreItems: LoreItem[]): Promise<string> => {
    const systemPrompt = `You are a creative assistant. When asked for a description, you must respond with ONLY the generated content in plain text. Do not include any prefixes, labels (like "Description:"), markdown, or quotation marks.`;
    
    const context = formatLoreForPrompt(loreItems);
    const hasContext = story.trim() !== '' || context !== "No existing lore provided.";
    
    const userPrompt = hasContext
        ? `For a world named "${worldName || 'this world'}", write a brief, evocative description (2-3 sentences) based on the story and lore context.
            
STORY SO FAR:
---
${story || 'No story written yet.'}
---

EXISTING LORE:
---
${context}
---
`
        : `Write a brief, creative, and random description (2-3 sentences) for a world named "${worldName || 'this world'}".`;
    
    return generateSimpleText(`${systemPrompt}\n\n${userPrompt}`);
};


export const generateLoreDetail = async (
    story: string,
    worldName: string,
    worldDescription: string,
    existingLore: LoreItem[],
    currentItem: LoreItem,
    fieldToGenerate: 'name' | 'description'
): Promise<string> => {

    const systemPrompt = `You are a creative assistant helping a writer build a world for their story. When asked for a name or description, you must respond with ONLY the generated content in plain text. Do not include any prefixes, labels (like "Name:"), markdown, or quotation marks.`;
    
    const worldContext = formatWorldContext(worldName, worldDescription, existingLore);
    const itemType = currentItem.type === 'Custom' ? currentItem.customTypeName || 'lore item' : currentItem.type;
    let userPromptText = '';

    if (fieldToGenerate === 'name') {
        userPromptText = `Based on the story and overall world context (and the provided image, if any), generate a single, creative, and fitting name for this ${itemType}.
If the item already has a description, use that as a strong hint.

STORY SO FAR:
---
${story || 'No story written yet.'}
---

FULL WORLD CONTEXT:
---
${worldContext}
---

CURRENT ITEM DESCRIPTION:
---
${currentItem.description || 'No description yet.'}
---
`;
    } else { // fieldToGenerate === 'description'
        userPromptText = `Based on the story, world context, and the provided image (if any), write a brief, compelling description (1-2 sentences) for the ${itemType} named "${currentItem.name || 'this item'}".
            
STORY SO FAR:
---
${story || 'No story written yet.'}
---

FULL WORLD CONTEXT:
---
${worldContext}
---
`;
    }

    if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");

    try {
        const textPart: Part = { text: `${systemPrompt}\n\n${userPromptText}` };
        const contentParts: Part[] = [textPart];
        
        if (currentItem.image) {
            const imagePart: Part = {
                inlineData: {
                    mimeType: currentItem.image.mimeType,
                    data: currentItem.image.base64,
                },
            };
            // Put image first for multimodal models
            contentParts.unshift(imagePart);
        }

        const response = await ai.models.generateContent({
            model: geminiModel,
            contents: { parts: contentParts },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating lore detail with Gemini:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

export const importCharacterFromImage = async (
    imageBase64: string,
    mimeType: string
): Promise<{ name: string; description: string }> => {
    if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");

    const imagePart: Part = {
        inlineData: {
            mimeType: mimeType,
            data: imageBase64,
        },
    };

    const textPart: Part = {
        text: `You are an expert OCR and data extraction AI. Your task is to analyze the provided image of a character sheet (from a TTRPG, video game, or other source) and extract key information.

From the image, extract the character's name and create a detailed description. The description should synthesize all available information—such as appearance, personality, backstory, skills, abilities, and inventory—into a cohesive paragraph.

If the character name is not explicitly found, creatively infer one based on the context. If the image does not appear to be a character sheet or is too blurry to read, the 'name' should be 'Import Failed' and the 'description' should explain the issue (e.g., 'Image is unreadable or does not contain character data.'). Your response must strictly adhere to the JSON schema.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: geminiModel,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "The name of the character. Should be 'Import Failed' if the image is unusable.",
                        },
                        description: {
                            type: Type.STRING,
                            description: "A comprehensive description of the character, or an explanation of why the import failed.",
                        },
                    },
                    required: ['name', 'description'],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result && typeof result.name === 'string' && typeof result.description === 'string') {
            return result;
        } else {
            throw new Error("AI failed to extract character data in the expected format.");
        }
    } catch (error) {
        console.error("Error importing character from image:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to parse AI response or communicate with the model.");
    }
};

const callHuggingFaceImageGen = async (prompt: string, config: ImageGenApiConfig): Promise<{ base64: string; mimeType: string }> => {
    if (!config.hfApiKey) {
        throw new Error("Hugging Face API Key is missing. Please add it in the API Configuration section.");
    }

    const maxRetries = 3;
    const initialDelay = 15000; // 15 seconds

    for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(config.hfUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.hfApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (response.ok) {
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                 const errorText = await blob.text();
                 throw new Error(`Hugging Face API returned non-image data: ${errorText}`);
            }
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const base64 = base64data.split(',')[1];
                    resolve({ base64, mimeType: blob.type });
                };
                reader.onerror = () => reject(new Error('Failed to read image blob as base64.'));
                reader.readAsDataURL(blob);
            });
        }

        if (response.status === 503) { // Model is loading
            const errorBody = await response.json().catch(() => ({}));
            const waitTime = errorBody.estimated_time || (initialDelay / 1000);
            console.warn(`Hugging Face model is loading. Retrying in ${waitTime} seconds... (Attempt ${i + 1}/${maxRetries})`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                continue;
            } else {
                 throw new Error(`Hugging Face model is still loading after ${maxRetries} attempts. Please try again later.`);
            }
        }

        const errorBody = await response.text();
        throw new Error(`Hugging Face API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    
    throw new Error('Image generation failed after all retries.');
};

export const generateLoreImage = async (
    currentItem: LoreItem,
    worldName: string,
    worldDescription: string,
    apiConfig: ImageGenApiConfig
): Promise<{ base64: string; mimeType: string }> => {

    const itemType = currentItem.type === 'Custom' ? currentItem.customTypeName || 'concept' : currentItem.type;

    const prompt = `epic fantasy digital painting of a ${itemType} named "${currentItem.name || 'unnamed'}". ${currentItem.description || ''} The scene is set in a world called "${worldName || 'unnamed world'}", which is described as: "${worldDescription || 'No description provided.'}" The image should be a focused, visually compelling representation of the ${itemType}.`;

    if (apiConfig.useHuggingFace) {
        return callHuggingFaceImageGen(prompt, apiConfig);
    }

    // --- Google Gemini Logic ---
    if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return {
                base64: base64ImageBytes,
                mimeType: 'image/png'
            };
        } else {
            throw new Error("The AI did not generate any images.");
        }
    } catch (error) {
        console.error("Error generating lore image with Gemini:", error);
        throw new Error("Failed to generate image with the AI model.");
    }
};

const magicScaleMap = {
    0: "Null: no magic, only myth/superstition.",
    1: "Faint Echoes: omens, rare miracles, spirits.",
    2: "Folk Magic: charms, curses, hedge witches, herbal rites.",
    3: "Ritual Magic: priests, shamans, ceremonies with repeatable results.",
    4: "Apprentice Age: structured spellcraft exists, limited and elite.",
    5: "Mage Orders: guilds, academies, codified disciplines.",
    6: "Arcane Society: magic entrenched in culture, economy, warfare.",
    7: "Grand Sorcery: large-scale enchantments, cities shielded, weather shaped.",
    8: "Mythic Age: gods, avatars, magical creatures openly present.",
    9: "World-Shaping: reality altered by magic; natural laws pliable.",
    10: "Transcendent: civilizations operate beyond natural law; existence is magical essence."
};
const techScaleMap = {
    0: "Stone Age: hunter-gatherers, stone/wood tools, fire.",
    1: "Bronze Age: early cities, bronze weapons, first writing.",
    2: "Iron Age: empires, iron/steel, roads, aqueducts.",
    3: "Medieval: feudal systems, castles, sails, early medicine.",
    4: "Renaissance: printing, navigation, early science, gunpowder.",
    5: "Enlightenment / Early Industrial: steam power, factories, long-range navies.",
    6: "Late Industrial / Victorian: railroads, telegraph, mass production.",
    7: "Early Modern: cars, planes, electricity, radio.",
    8: "Modern: computers, nuclear power, space race.",
    9: "Near Future: AI, biotech, green energy, space colonies.",
    10: "Far Future: interstellar, post-scarcity, transhuman."
};

const buildFastPrompt = (options: WorldGenOptions): string => {
    const { presets, tone, vibes, magicScale, techScale, conflict, setting, factionCount, raceCount, mcRole, antagonistShape, generateNames } = options;
    const vibeText = vibes.includes('None') ? 'a grounded, realistic feel' : vibes.join(', ');

    const params = [
        presets && presets.length > 0 && `- **Preset Flavors**: ${presets.join(', ')}.`,
        tone && `- **Overall Tone**: ${tone}.`,
        vibes.length > 0 && `- **Vibe Pack**: ${vibeText}.`,
        magicScale !== null && `- **Magic Scale**: ${magicScaleMap[magicScale]}`,
        techScale !== null && `- **Technology Scale**: ${techScaleMap[techScale]}`,
        conflict && `- **Core Conflict**: ${conflict}.`,
        setting && `- **Setting Scaffold**: ${setting}.`,
        factionCount !== null && `- **Number of Factions**: ${factionCount}.`,
        raceCount !== null && `- **Number of Races/Species**: ${raceCount}.`,
        mcRole && `- **Main Character (MC) Role**: ${mcRole}.`,
        antagonistShape && `- **Antagonist Shape**: ${antagonistShape}.`,
        `- **Names**: ${generateNames ? "Generate creative, fitting names." : "Use descriptive placeholders."}`
    ].filter(Boolean).join('\n');
    
    return `You are a master world-builder. Based on the following user-defined parameters, generate a cohesive and inspiring world concept.
Your response MUST be a JSON object that strictly follows the provided schema. Do not add any extra commentary or text outside the JSON structure.
The "Preset Flavors" are optional tags that add inspiration; they never restrict or overwrite other inputs, and all combinations are valid.

Parameters:
${params}

Generate the world. Be creative and ensure all elements connect logically.`;
};

const getSliderText = (category: SupportingCharacter['category'], value: number): string => {
    const scale = [
        { cat: 'Friend', labels: ['Extremely Loyal', 'Loyal', 'Unpredictable', 'High Betrayal Risk', 'Almost Certain to Betray'] },
        { cat: 'Rival', labels: ['Petty Nuisance', 'Annoying Obstacle', 'Serious Threat', 'Dangerous Foe', 'Deadly Nemesis'] },
        { cat: 'Enemy', labels: ['Minor Nuisance', 'Persistent Threat', 'Dangerous Foe', 'Lethal Adversary', 'Existential Threat'] },
        { cat: 'Neutral', labels: ['Very Helpful', 'Generally Helpful', 'Purely Transactional', 'Potentially Dangerous', 'Extremely Dangerous'] },
        { cat: 'LoveInterest', labels: ['Unbreakable Bond', 'Strong Bond', 'Complicated Feelings', 'Significant Obstacles', 'Seemingly Impossible'] },
        { cat: 'Family', labels: ['Deeply Supportive', 'Supportive', 'Neutral / Strained', 'Tense / Difficult', 'Broken / Hostile'] },
        { cat: 'Recurring', labels: ['Flavor/Background', 'Minor Importance', 'Situationally Important', 'Frequently Important', 'Critical to the Plot'] },
    ];
    const item = scale.find(s => s.cat === category);
    if (!item) return `Value: ${value}/100`;

    if (value <= 10) return item.labels[0];
    if (value <= 30) return item.labels[1];
    if (value <= 70) return item.labels[2];
    if (value <= 90) return item.labels[3];
    return item.labels[4];
};

const buildDeepPrompt = (options: WorldGenOptions): string => {
    const params = [];

    const subgenreMap = {
        'Low': 'Low: Small-scale struggles, grounded and local.',
        'Epic': 'Epic: World-shaping conflicts, legendary scope.',
        'Grimdark': 'Grimdark: Bleak, cynical worlds of brutality.',
        'Noblebright': 'Noblebright: Hopeful, heroic struggles with moral clarity.',
        'Weird': 'Weird: Uncanny, surreal, or alien atmosphere.',
        'Slice of Life': 'Slice of Life: Everyday rhythms, community, and small joys.'
    };

    if (options.presets && options.presets.length > 0) {
        params.push(`- **Preset Flavors**: ${options.presets.join(', ')}.`);
    }

    const macroParts = [];
    if(options.tone) macroParts.push(`Tone: ${options.tone}`);
    if(options.subgenre && subgenreMap[options.subgenre]) {
        macroParts.push(`Subgenre: ${subgenreMap[options.subgenre]}`);
    } else if (options.subgenre) {
        macroParts.push(`Subgenre: ${options.subgenre}`); // Fallback
    }
    if(macroParts.length) params.push(`- ${macroParts.join(', ')}`);
    
    if(options.magicScale !== null) params.push(`- Magic Scale: ${magicScaleMap[options.magicScale]}`);
    if(options.techScale !== null) params.push(`- Technology Scale: ${techScaleMap[options.techScale]}`);
    
    const geoParts = [];
    if(options.primaryBiome) geoParts.push(`Biome (${options.primaryBiome})`);
    if(options.travelConstraint) geoParts.push(`Travel Constraint (${options.travelConstraint})`);
    if(geoParts.length) params.push(`- Geography: ${geoParts.join(', ')}`);

    const econParts = [];
    if(options.scarceResource) econParts.push(`Scarce Resource (${options.scarceResource})`);
    if(options.resourceController) econParts.push(`Controlled by (${options.resourceController})`);
    if(econParts.length) params.push(`- Economy: ${econParts.join(', ')}`);
    
    const lawParts = [];
    if(options.polity) lawParts.push(`Polity (${options.polity})`);
    if(options.justiceStyle) lawParts.push(`Justice (${options.justiceStyle})`);
    if(lawParts.length) params.push(`- Law: ${lawParts.join(', ')}`);

    const cultureParts = [];
    if(options.taboos) cultureParts.push(`Taboos (${options.taboos})`);
    if(options.virtues) cultureParts.push(`Virtues (${options.virtues})`);
    if(options.lingua) cultureParts.push(`Lingua (${options.lingua})`);
    if(cultureParts.length) params.push(`- Culture: ${cultureParts.join(', ')}`);

    if(options.factionCount !== null) params.push(`- Factions to generate: ${options.factionCount}`);
    if(options.raceCount !== null) params.push(`- Races to generate: ${options.raceCount}`);

    const religionParts = [];
    if(options.religionPresence) religionParts.push(`Presence (${options.religionPresence})`);
    if(options.miracleTest) religionParts.push(`Miracles (${options.miracleTest})`);
    if(religionParts.length) params.push(`- Religion: ${religionParts.join(', ')}`);
    
    const medicineParts = [];
    if(options.medicineType) medicineParts.push(`Type (${options.medicineType})`);
    if(options.medicineConstraint) medicineParts.push(`Constraint (${options.medicineConstraint})`);
    if(medicineParts.length) params.push(`- Medicine: ${medicineParts.join(', ')}`);
    
    if(options.tensions && options.tensions.length > 0) params.push(`- Conflict Web: Tensions are ${options.tensions.join(' and ')}`);
    
    const mcParts = [];
    if(options.mcRole) mcParts.push(`Role (${options.mcRole === 'Custom' ? 'Custom' : options.mcRole})`);
    if(options.mcScar) mcParts.push(`Scar (${options.mcScar})`);
    if(options.mcNeed) mcParts.push(`Need (${options.mcNeed})`);
    if(options.mcSecret) mcParts.push(`Secret (${options.mcSecret})`);
    if(options.mcLine) mcParts.push(`Line (${options.mcLine})`);
    if(mcParts.length) params.push(`- MC: ${mcParts.join(', ')}`);

    if (options.supportingCharacters && options.supportingCharacters.length > 0) {
        const characterDescriptions = options.supportingCharacters.map(char => {
            const sliderText = getSliderText(char.category, char.sliderValue);
            const typeText = char.type ? `Type: ${char.type}` : '';
            const descText = char.description ? `Description: ${char.description}` : '';
            const fullText = [typeText, descText, `Dynamic: ${sliderText}`].filter(Boolean).join('; ');
            return `  - A ${char.category} character. ${fullText}`;
        }).join('\n');
        params.push(`- Supporting Characters:\n${characterDescriptions}`);
    }


    const antagParts = [];
    if(options.antagonistShape) antagParts.push(`Shape (${options.antagonistShape})`);
    if(options.antagonistFuture) antagParts.push(`Desired Future (${options.antagonistFuture})`);
    if(options.antagonistLine) antagParts.push(`Line they won't cross (${options.antagonistLine})`);
    if(options.antagonistDoomClock) antagParts.push(`Doom Clock (${options.antagonistDoomClock})`);
    if(antagParts.length) params.push(`- Antagonist: ${antagParts.join(', ')}`);
    
    const logisticsParts = [];
    if(options.travelRange) logisticsParts.push(`Travel Range (${options.travelRange})`);
    if(options.supplyPain) logisticsParts.push(`Supply Pain (${options.supplyPain})`);
    if(options.messageSpeed) logisticsParts.push(`Message Speed (${options.messageSpeed})`);
    if(logisticsParts.length) params.push(`- Logistics: ${logisticsParts.join(', ')}`);
    
    const combatParts = [];
    if(options.combatFeel) combatParts.push(`Feel (${options.combatFeel})`);
    if(options.importantInjuries) combatParts.push(`Important Injuries (${options.importantInjuries})`);
    if(combatParts.length) params.push(`- Combat: ${combatParts.join(', ')}`);

    if(options.visualAnchors) params.push(`- Aesthetic: Visual Anchors (${options.visualAnchors})`);
    
    params.push(`- Names: ${options.generateNames ? "Generate creative names." : "Use descriptive placeholders."}`);
    
    const finalParams = params.join('\n');
    
    return `You are a master world-builder creating a "world bible". Your response MUST be a JSON object that strictly follows the provided schema. Each 'detailedSections' value must be a single string with distinct points separated by newlines. Do not add extra commentary outside the JSON.
The "Preset Flavors" are optional tags that add inspiration; they never restrict or overwrite other inputs, and all combinations are valid.

Parameters:
${finalParams}

Now, generate the detailed world bible.`;
};


export const generateFullWorld = async (options: WorldGenOptions, mode: 'fast' | 'deep'): Promise<GeneratedWorldData> => {
    if (!ai) throw new Error("Google GenAI SDK not initialized. Is the default API_KEY available?");

    const prompt = mode === 'fast' ? buildFastPrompt(options) : buildDeepPrompt(options);

    const baseFactionSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            goal: { type: Type.STRING, description: "The primary objective of the faction." },
            method: { type: Type.STRING, description: "How they achieve their goal." },
            resource: { type: Type.STRING, description: "A key resource they control." },
            flaw: { type: Type.STRING, description: "A critical weakness or internal conflict." }
        },
        required: ["name", "goal", "method", "resource", "flaw"]
    };

    const baseRaceSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            hallmark: { type: Type.STRING, description: "Their most defining physical or magical trait." },
            limitation: { type: Type.STRING, description: "A key weakness or societal constraint." },
            quirk: { type: Type.STRING, description: "A unique cultural habit or belief." }
        },
        required: ["name", "hallmark", "limitation", "quirk"]
    };

    const baseMCSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            desire: { type: Type.STRING, description: "What the character wants most." },
            fear: { type: Type.STRING, description: "What the character fears most." },
            edge: { type: Type.STRING, description: "A unique skill or advantage they possess." },
            problem: { type: Type.STRING, description: "An immediate, tangible problem they face." }
        },
        required: ["name", "desire", "fear", "edge", "problem"]
    };

    const baseAntagonistSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            motive: { type: Type.STRING, description: "Why they are the antagonist." },
            leverage: { type: Type.STRING, description: "What power or influence they hold." },
            weakness: { type: Type.STRING, description: "A vulnerability that can be exploited." }
        },
        required: ["name", "motive", "leverage", "weakness"]
    };

    // --- Define Schemas ---
    const fastSchema = {
        type: Type.OBJECT,
        properties: {
            worldName: { type: Type.STRING, description: "A creative name for the world." },
            premise: { type: Type.STRING, description: "A 1-2 sentence premise." },
            factions: { type: Type.ARRAY, items: baseFactionSchema },
            races: { type: Type.ARRAY, items: baseRaceSchema },
            mainCharacter: baseMCSchema,
            antagonist: baseAntagonistSchema,
            starterHooks: { type: Type.ARRAY, description: "Three distinct scene seeds.", items: { type: Type.STRING } }
        },
        required: ["worldName", "premise", "factions", "races", "mainCharacter", "antagonist", "starterHooks"]
    };

    const deepSchema = {
        type: Type.OBJECT,
        properties: {
            ...fastSchema.properties,
            factions: {
                type: Type.ARRAY,
                items: {
                    ...baseFactionSchema,
                    properties: { ...baseFactionSchema.properties, leaderArchetype: { type: Type.STRING }, leverage: { type: Type.STRING }, fractureRisk: { type: Type.STRING } }
                }
            },
            races: {
                type: Type.ARRAY,
                items: {
                    ...baseRaceSchema,
                    properties: { ...baseRaceSchema.properties, physiologyQuirk: { type: Type.STRING }, socialRole: { type: Type.STRING }, prejudice: { type: Type.STRING }, gift: { type: Type.STRING } }
                }
            },
            mainCharacter: {
                ...baseMCSchema,
                properties: { ...baseMCSchema.properties, scar: { type: Type.STRING }, need: { type: Type.STRING }, secret: { type: Type.STRING }, lineInSand: { type: Type.STRING } }
            },
            antagonist: {
                ...baseAntagonistSchema,
                properties: { ...baseAntagonistSchema.properties, desiredFuture: { type: Type.STRING }, lineTheyWontCross: { type: Type.STRING }, doomClock: { type: Type.STRING } }
            },
            allies: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, edge: { type: Type.STRING } }, required: ["name", "role", "edge"]
                }
            },
            rival: {
                type: Type.OBJECT, properties: { name: { type: Type.STRING }, obsession: { type: Type.STRING }, blindSpot: { type: Type.STRING } }, required: ["name", "obsession", "blindSpot"]
            },
            detailedSections: {
                type: Type.OBJECT,
                properties: {
                    macro: { type: Type.STRING }, magicTech: { type: Type.STRING }, geography: { type: Type.STRING }, economy: { type: Type.STRING }, lawAndOrder: { type: Type.STRING }, culture: { type: Type.STRING }, religion: { type: Type.STRING }, medicine: { type: Type.STRING }, conflictWeb: { type: Type.STRING }, logistics: { type: Type.STRING }, combat: { type: Type.STRING }, aesthetic: { type: Type.STRING },
                }
            }
        },
        required: [...fastSchema.required, 'allies', 'rival', 'detailedSections']
    };

    const schema = mode === 'fast' ? fastSchema : deepSchema;

    try {
        const response = await ai.models.generateContent({
            model: geminiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result as GeneratedWorldData;

    } catch (error) {
        console.error(`Error generating ${mode} world with Gemini:`, error);
        throw new Error(`Failed to generate world data from the AI model. The model may have failed to produce valid JSON according to the schema. Try adjusting your inputs.`);
    }
};
