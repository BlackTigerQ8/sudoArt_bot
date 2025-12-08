const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/**
 * =====================================================
 * WELCOME EMBED - Modern & Fancy Design
 * =====================================================
 */

// Customize these to match your server
const SERVER_CONFIG = {
  name: "Kuwait Creatives",
  tagline: "Engineers • Programmers • Hackers • Designers",
  website: "https://www.aaalenezi.com",

  // Your server banner/welcome image (use a wide image ~1200x400)
  // You can use imgur, discord cdn, or any image host
  bannerURL: "./src/assets/server_banner.png",

  // Server icon/logo
  iconURL: "./src/assets/server_avatar.png",

  // Accent color (hex) - Use a bold, modern color
  accentColor: 0x5865f2, // Discord Blurple
  // Other nice options:
  // 0x00D26A - Emerald Green
  // 0xFF6B6B - Coral Red
  // 0x7C3AED - Purple
  // 0x0EA5E9 - Sky Blue
  // 0xF59E0B - Amber
};

// Channel IDs for quick links (set these in .env or hardcode)
const CHANNELS = {
  rules: process.env.CHANNEL_ID_RULES,
  general: process.env.CHANNEL_ID_GENERAL,
};

/**
 * Get a random welcome greeting
 */
function getRandomGreeting(username) {
  const greetings = [
    `Hey **${username}**, welcome aboard! 🚀`,
    `**${username}** just landed! Welcome! ✨`,
    `Look who's here! Welcome **${username}**! 🎉`,
    `**${username}** joined the community! 🔥`,
    `Welcome to the community, **${username}**! 💫`,
    `**${username}** has entered the community! 👋`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Get member milestone message
 */
function getMilestoneMessage(memberCount) {
  if (memberCount % 100 === 0)
    return `🎊 **MILESTONE!** You're member #${memberCount}!`;
  if (memberCount % 50 === 0) return `🌟 Nice! You're member #${memberCount}!`;
  return `You're member **#${memberCount}**`;
}

/**
 * Create the main welcome embed
 * @param {User} user - Discord user
 * @param {Guild} guild - Discord guild (optional, for member count)
 */
function createEmbed(user, guild = null) {
  const memberCount = guild?.memberCount || "???";

  const embed = new EmbedBuilder()
    // Header with greeting
    .setAuthor({
      name: `Welcome to ${SERVER_CONFIG.name}`,
      iconURL: SERVER_CONFIG.iconURL,
      url: SERVER_CONFIG.website,
    })

    // Main title - Random greeting
    .setTitle(getRandomGreeting(user.username))

    // Rich description with formatting
    .setDescription(
      `${SERVER_CONFIG.tagline}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `> 🌟 *We're a community of creative minds from Kuwait,*\n` +
        `> *building, learning, and growing together.*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`
    )

    // User avatar as thumbnail
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))

    // Banner image
    .setImage(SERVER_CONFIG.bannerURL)

    // Info fields
    .addFields(
      {
        name: "🚀 Quick Start",
        value:
          `${
            CHANNELS.rules ? `📜 <#${CHANNELS.rules}> — Read the rules\n` : ""
          }` +
          `${
            CHANNELS.general ? `💬 <#${CHANNELS.general}> — Start chatting` : ""
          }` +
          `${
            !CHANNELS.rules && !CHANNELS.introductions && !CHANNELS.general
              ? "Explore the channels and say hi!"
              : ""
          }`,
        inline: true,
      },
      {
        name: "📊 Community",
        value: getMilestoneMessage(memberCount),
        inline: true,
      }
    )

    // Accent color
    .setColor(SERVER_CONFIG.accentColor)

    // Footer with timestamp
    .setFooter({
      text: `${SERVER_CONFIG.name} • ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      iconURL: SERVER_CONFIG.iconURL,
    })
    .setTimestamp();

  return embed;
}

/**
 * Create welcome buttons (optional - for extra flair)
 * @returns {ActionRowBuilder} Button row
 */
function createWelcomeButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🌐 Website")
      .setStyle(ButtonStyle.Link)
      .setURL(SERVER_CONFIG.website),
    new ButtonBuilder()
      .setLabel("📜 Rules")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discord.com/channels/${process.env.GUILD_ID}/${CHANNELS.rules}`
      )
      .setDisabled(!CHANNELS.rules) // Disable if no rules channel
  );
}

/**
 * Create a complete welcome message with embed + buttons
 * @param {User} user - Discord user
 * @param {Guild} guild - Discord guild
 * @returns {Object} Message payload with embeds and components
 */
function createWelcomeMessage(user, guild = null) {
  return {
    embeds: [createEmbed(user, guild)],
    // Uncomment to add buttons:
    // components: [createWelcomeButtons()],
  };
}

module.exports = { createEmbed, createWelcomeMessage, createWelcomeButtons };
