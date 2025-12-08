const { EmbedBuilder } = require("discord.js");

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

  // Server icon/logo
  iconURL:
    "https://cdn.discordapp.com/attachments/1168549225118847027/1175875562569465908/server_avatar.png?ex=6937cb34&is=693679b4&hm=fd7ca3c6f46e927399d36b14130ec52a1b6e8a086fcac5c23e8b40f1b96bf944&",

  // Accent color (hex)
  accentColor: 0x5865f2, // Discord Blurple
  // Other nice options:
  // 0x00D26A - Emerald Green
  // 0xFF6B6B - Coral Red
  // 0x7C3AED - Purple
  // 0x0EA5E9 - Sky Blue
  // 0xF59E0B - Amber
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
      name: `Eng. Abdullah Alsultani`,
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

    // Member count field
    .addFields({
      name: "📊 Community",
      value: getMilestoneMessage(memberCount),
      inline: false,
    })

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

module.exports = { createEmbed };
