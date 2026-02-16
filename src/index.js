/**
 * =====================================================
 * DISCORD COMMUNITY BOT - Main Entry Point
 * =====================================================
 * A self-driving community bot for Engineers, Programmers,
 * Hackers, and Designers.
 *
 * Modules:
 * - Welcome: Public embed messages for new members
 * - Engagement: Daily challenges (coding, security, engineering)
 * - Janitor: Auto-moderation (spam, code formatting)
 * - Instructor: Workshop schedule command
 */

require("dotenv").config();
const {
  Client,
  IntentsBitField,
  Partials,
  EmbedBuilder,
} = require("discord.js");

// Import modules
const { createEmbed } = require("./embed.js");
const { initEngagement } = require("./modules/engagement.js");
const { initJanitor } = require("./modules/janitor.js");
const { initInstructor } = require("./modules/instructor.js");

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================
const TOKEN = process.env.TOKEN?.trim();
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

// Channels to ignore for auto-moderation (comma-separated in .env)
const IGNORED_CHANNELS =
  process.env.IGNORED_CHANNELS?.split(",").map((id) => id.trim()) || [];

// =====================================================
// VALIDATION
// =====================================================
if (!TOKEN) {
  console.error("❌ Error: TOKEN is not defined in the environment variables.");
  process.exit(1);
}

if (!GUILD_ID) {
  console.warn(
    "⚠️ Warning: GUILD_ID not set. Some features may not work correctly.",
  );
}

if (!CLIENT_ID) {
  console.warn(
    "⚠️ Warning: CLIENT_ID not set. Slash commands will not be registered.",
  );
}

if (!process.env.OPENROUTER_API_KEY) {
  console.warn(
    "⚠️ Warning: OPENROUTER_API_KEY not set. AI challenges will use fallback questions.",
  );
}

// =====================================================
// CLIENT SETUP
// =====================================================
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
  partials: [Partials.Channel], // Required to receive DMs
});

// Admin User ID for contact
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// =====================================================
// WELCOME MODULE - Public Embed on Member Join
// =====================================================
client.on("guildMemberAdd", async (member) => {
  try {
    console.log(`[Welcome] New member joined: ${member.user.tag}`);

    // Create the welcome embed (pass guild for member count)
    const welcomeEmbed = createEmbed(member.user, member.guild);

    // Find the welcome channel (by ID or by name)
    let channel;
    if (WELCOME_CHANNEL_ID) {
      channel = await member.guild.channels
        .fetch(WELCOME_CHANNEL_ID)
        .catch(() => null);
    }

    // Fallback to channel name if ID not found
    if (!channel) {
      channel = member.guild.channels.cache.find((ch) => ch.name === "welcome");
    }

    if (channel) {
      await channel.send({ embeds: [welcomeEmbed] });
      console.log(
        `[Welcome] Sent welcome embed for ${member.user.tag} (Member #${member.guild.memberCount})`,
      );
    } else {
      console.warn("[Welcome] Could not find welcome channel!");
    }
  } catch (error) {
    console.error("[Welcome] Error sending welcome message:", error);
  }
});

// =====================================================
// DM HANDLER - Auto-reply to Direct Messages
// =====================================================
client.on("messageCreate", async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Only handle DMs (no guild means it's a DM)
  if (message.guild) return;

  try {
    console.log(
      `[DM] Received message from ${message.author.tag}: ${message.content}`,
    );

    const dmReply = new EmbedBuilder()
      .setTitle("🤖 Hello! | أهلاً!")
      .setDescription(
        `Thanks for reaching out! I'm the official bot for **Eng. Abdullah Alsultani's** community server.\n` +
          `I can only assist within the server and don't respond to DMs.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `شكراً لتواصلك! أنا البوت الرسمي لسيرفر مجتمع **م. عبدالله السلطاني**.\n` +
          `أقدر أساعدك فقط داخل السيرفر ولا أرد على الرسائل الخاصة.`,
      )
      .addFields(
        {
          name: "💬 Need to talk to the Admin? | تبي تتواصل مع الأدمن؟",
          value: `Contact | تواصل مع: <@${ADMIN_USER_ID}>`,
          inline: false,
        },
        {
          name: "🌐 Website | الموقع",
          value: "[aaalenezi.com](https://www.aaalenezi.com)",
          inline: true,
        },
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Abdullah Alsultani Community" })
      .setTimestamp();

    await message.reply({ embeds: [dmReply] });
    console.log(`[DM] Sent auto-reply to ${message.author.tag}`);
  } catch (error) {
    console.error("[DM] Error sending reply:", error);
  }
});

// =====================================================
// BOT READY EVENT
// =====================================================
client.once("ready", async () => {
  console.log("═══════════════════════════════════════════");
  console.log(`🤖 Bot is online: ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
  console.log("═══════════════════════════════════════════");

  // Initialize Engagement Module (Daily Challenges)
  // initEngagement(client);

  // Initialize Janitor Module (Auto-Moderation)
  initJanitor(client, IGNORED_CHANNELS);

  // Initialize Instructor Module (Schedule Command)
  // Pass GUILD_ID for instant command updates (guild-specific commands)
  if (CLIENT_ID) {
    initInstructor(client, TOKEN, CLIENT_ID, GUILD_ID);
  }

  console.log("═══════════════════════════════════════════");
  console.log("✅ All modules initialized successfully!");
  console.log("═══════════════════════════════════════════");
});

// =====================================================
// ERROR HANDLING
// =====================================================
client.on("error", (error) => {
  console.error("[Bot] Client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("[Bot] Unhandled promise rejection:", error);
});

// =====================================================
// LOGIN
// =====================================================
client.login(TOKEN);
