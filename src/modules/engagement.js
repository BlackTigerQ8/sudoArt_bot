/**
 * =====================================================
 * ENGAGEMENT MODULE - AI-Powered Daily Challenge
 * =====================================================
 * 1. Generates infinite questions using OpenRouter AI.
 * 2. Routes questions to specific category channels.
 */

const { EmbedBuilder } = require("discord.js");
const cron = require("node-cron");

// --- CONFIGURATION ---
// Get your API key: https://openrouter.ai/keys
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Models to try (in order) - includes free models!
// See all models: https://openrouter.ai/models
const OPENROUTER_MODELS = [
  "google/gemini-flash-1.5-8b", // Fast Gemini
  "meta-llama/llama-3.2-3b-instruct:free", // Free Llama
  "qwen/qwen-2-7b-instruct:free", // Free Qwen
  "mistralai/mistral-7b-instruct:free", // Free Mistral
];

// Map categories to your specific Channel IDs
const CHANNEL_MAP = {
  coding: process.env.CHANNEL_ID_PROGRAMMING,
  cybersecurity: process.env.CHANNEL_ID_CYBER,
  engineering: process.env.CHANNEL_ID_ENGINEERING,
  design: process.env.CHANNEL_ID_DESIGN,
};

// The Prompt to send to the AI
const SYSTEM_PROMPT = `You are a fun trivia generator for a Discord community of Engineers.
Generate 1 simple, fun, and engaging question in English.
Return ONLY raw JSON (no markdown) with this structure:
{
  "title": "Short Title with Emoji (e.g. 🔐 Security Challenge)",
  "question": "The question text",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "answer": "A",
  "explanation": "Short educational explanation (2-3 sentences)."
}
IMPORTANT: options MUST start with "A) ", "B) ", "C) ", "D) " respectively.`;

/**
 * Fetch a fresh question from OpenRouter AI
 * @param {string} topic - The topic (e.g., "Civil Engineering", "ReactJS")
 */
async function fetchAIQuestion(topic) {
  if (!OPENROUTER_API_KEY) {
    console.error("[Engagement] ❌ OPENROUTER_API_KEY not set in .env!");
    return getFallbackQuestion();
  }

  // Try each model until one works
  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[Engagement] Trying model: ${model}`);

      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://discord-bot.local", // Required by OpenRouter
          "X-Title": "Discord Community Bot",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Topic: ${topic}` },
          ],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from AI");
      }

      // Clean up potential markdown formatting
      const cleanJson = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      // Validate and normalize the response
      const validated = {
        title: parsed.title || "🧩 سؤال اليوم",
        question: parsed.question || "No question generated",
        options: Array.isArray(parsed.options) ? parsed.options : [],
        answer: parsed.answer || "N/A",
        explanation: parsed.explanation || "No explanation provided",
      };

      console.log(`[Engagement] ✅ Success with model: ${model}`);
      return validated;
    } catch (error) {
      console.log(`[Engagement] ❌ Model ${model} failed: ${error.message}`);

      // If rate limited, stop trying
      if (error.message.includes("429") || error.message.includes("rate")) {
        console.error("[Engagement] ⚠️ Rate limited - stopping");
        break;
      }
    }
  }

  // All models failed
  console.error("[Engagement] All AI models failed, using fallback");
  return getFallbackQuestion();
}

/**
 * Fallback question when AI fails
 */
function getFallbackQuestion() {
  const fallbacks = [
    {
      title: "🧩 Community Discussion",
      question:
        "What's the most interesting project you're working on right now?",
      options: [],
      answer: "N/A",
      explanation: "Share your projects and learn from each other!",
    },
    {
      title: "💡 Quick Poll",
      question: "Which skill do you want to improve most this month?",
      options: [
        "A) Frontend Development",
        "B) Backend/APIs",
        "C) DevOps/Security",
        "D) Design/UI-UX",
      ],
      answer: "All are great choices!",
      explanation: "Pick one and focus on it for the best results.",
    },
    {
      title: "🔥 Hot Take",
      question: "Tabs or Spaces? Defend your answer!",
      options: [
        "A) Tabs forever",
        "B) Spaces only",
        "C) Whatever the linter says",
        "D) I use both chaotically",
      ],
      answer: "C",
      explanation:
        "Consistency within a project matters more than the choice itself!",
    },
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Main function to post the challenge
 */
/**
 * Helper to build the embed
 */
function createChallengeEmbed(data, topic) {
  const optionsText =
    Array.isArray(data.options) && data.options.length > 0
      ? data.options.join("\n")
      : "💬 Share your thoughts in the comments!";

  const embed = new EmbedBuilder()
    .setTitle(data.title || "🧩 Daily Challenge")
    .setDescription(
      `**Topic:** ${topic}\n\n${data.question || "Share your answers!"}`,
    )
    .addFields({
      name: "Options",
      value: optionsText,
    })
    .setColor(0x00d26a)
    .setFooter({ text: "Check the thread for the answer! 👇" })
    .setTimestamp();

  return embed;
}

/**
 * Shared logic to add content to a message (reactions + thread)
 */
async function finalizeChallengeMessage(message, data) {
  // Add Reactions (Poll)
  if (Array.isArray(data.options) && data.options.length > 0) {
    try {
      await message.react("🇦");
      if (data.options.length > 1) await message.react("🇧");
      if (data.options.length > 2) await message.react("🇨");
      if (data.options.length > 3) await message.react("🇩");
    } catch (err) {
      console.error("[Engagement] Failed to react:", err);
    }
  }

  // Thread for discussion
  try {
    if (message.channel.type !== 1) {
      // 1 = DM
      const thread = await message.startThread({
        name: `تحدي - ${data.title}`,
        autoArchiveDuration: 1440,
      });

      // Send the answer inside the thread (spoiler hidden)
      await thread.send(
        `||**الاجابة:** ${data.answer}\n\n**الشرح:** ${data.explanation}||`,
      );
    }
  } catch (err) {
    console.warn("[Engagement] Could not create thread:", err.message);
  }
}

/**
 * Main function to post the challenge (Scheduled)
 */
async function postDailyChallenge(client) {
  // 1. Pick a category based on the day of the week
  const day = new Date().getDay();
  const schedule = [
    { type: "coding", topic: "Advanced JavaScript or Python" }, // Sun
    { type: "engineering", topic: "Engineering" }, // Mon
    { type: "cybersecurity", topic: "Network Security or Pentesting" }, // Tue
    { type: "design", topic: "UI/UX or Blender 3D" }, // Wed
    { type: "coding", topic: "Data Structures & Algorithms" }, // Thu
    { type: "engineering", topic: "Modern Architecture or Physics" }, // Fri
    { type: "cybersecurity", topic: "Ethical Hacking Scenarios" }, // Sat
  ];

  const todayConfig = schedule[day];
  const targetChannelId = CHANNEL_MAP[todayConfig.type];

  if (!targetChannelId) {
    return console.log(`[Engagement] No channel set for ${todayConfig.type}`);
  }

  // 2. Fetch Content from AI
  console.log(`[Engagement] Generating challenge for: ${todayConfig.topic}`);
  const data = await fetchAIQuestion(todayConfig.topic);

  // 3. Build Embed
  const embed = createChallengeEmbed(data, todayConfig.topic);

  // 4. Send to the SPECIFIC channel
  const channel = await client.channels.fetch(targetChannelId);
  const message = await channel.send({ embeds: [embed] });

  // 5. Finalize
  await finalizeChallengeMessage(message, data);

  console.log(
    `[Engagement] ✅ Challenge posted to ${todayConfig.type} channel`,
  );
}

/**
 * Handle Slash Command Challenge
 * @param {Interaction} interaction
 * @param {string} topic
 */
async function postManualChallenge(interaction, topic) {
  // If no topic provided, pick a random fun one
  if (!topic) {
    const funTopics = [
      "Tech History",
      "SpaceX",
      "Gaming Facts",
      "Retro Computers",
      "AI Future",
    ];
    topic = funTopics[Math.floor(Math.random() * funTopics.length)];
  }

  // Defer reply since AI can take time
  await interaction.deferReply();

  try {
    const data = await fetchAIQuestion(topic);
    const embed = createChallengeEmbed(data, topic);

    // Send as reply
    const message = await interaction.editReply({
      embeds: [embed],
      fetchReply: true,
    });

    // Add reactions & thread
    await finalizeChallengeMessage(message, data);
  } catch (err) {
    console.error("[Engagement] Manual challenge error:", err);
    await interaction.editReply(
      "❌ Failed to generate challenge. Try again later.",
    );
  }
}

function initEngagement(client) {
  // Schedule: Every day at 9:00 AM Kuwait Time
  cron.schedule("0 9 * * *", () => postDailyChallenge(client), {
    timezone: "Asia/Kuwait",
  });
  console.log("[Engagement] AI Scheduler Initialized (OpenRouter)");

  // Store client reference for manual testing
  initEngagement._client = client;
}

/**
 * Manual trigger for testing
 */
async function testChallenge() {
  if (!initEngagement._client) {
    console.error("[Engagement] Bot not initialized yet!");
    return;
  }
  console.log("[Engagement] 🧪 Manual test triggered...");
  await postDailyChallenge(initEngagement._client);
}

module.exports = {
  initEngagement,
  postDailyChallenge,
  postManualChallenge,
  testChallenge,
};
