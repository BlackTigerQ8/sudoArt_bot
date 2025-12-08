/**
 * =====================================================
 * JANITOR MODULE - Auto-Moderation System
 * =====================================================
 * Handles automatic moderation tasks:
 * 1. Anti-spam: Deletes links from new accounts (< 24 hours)
 * 2. Code formatting: Reminds users to use code blocks
 */

const { EmbedBuilder } = require("discord.js");

// Regex pattern to detect URLs (no 'g' flag to avoid stateful .test() issues)
const URL_REGEX =
  /https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|org|net|io|gg|xyz|co|me|dev)[^\s]*/i;

// Regex to detect code block usage
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

// Minimum lines to trigger code block reminder
const MIN_CODE_LINES = 10;

/**
 * Check if a member's account is younger than specified hours
 * @param {GuildMember} member - Discord guild member
 * @param {number} hours - Age threshold in hours
 * @returns {boolean} True if account is younger than threshold
 */
function isNewAccount(member, hours = 24) {
  const accountAge = Date.now() - member.user.createdTimestamp;
  const hoursInMs = hours * 60 * 60 * 1000;
  return accountAge < hoursInMs;
}

/**
 * Check if a member joined the server recently
 * @param {GuildMember} member - Discord guild member
 * @param {number} hours - Join threshold in hours
 * @returns {boolean} True if joined recently
 */
function isNewMember(member, hours = 24) {
  if (!member.joinedTimestamp) return false;
  const joinAge = Date.now() - member.joinedTimestamp;
  const hoursInMs = hours * 60 * 60 * 1000;
  return joinAge < hoursInMs;
}

/**
 * Check if message contains URLs
 * @param {string} content - Message content
 * @returns {boolean} True if contains URLs
 */
function containsLinks(content) {
  return URL_REGEX.test(content);
}

/**
 * Count non-empty lines in a message (excluding code blocks)
 * @param {string} content - Message content
 * @returns {number} Number of lines
 */
function countCodeLines(content) {
  // Remove existing code blocks from consideration
  const contentWithoutBlocks = content.replace(CODE_BLOCK_REGEX, "");

  // Count lines that look like code (contain common code patterns)
  const lines = contentWithoutBlocks.split("\n");
  const codePatterns = [
    /[{}\[\]();]/, // Brackets and semicolons
    /^[\s]*(const|let|var|function|class|if|for|while|return|import|export|def|public|private)/i,
    /[=><]+/, // Operators
    /\.\w+\(/, // Method calls
    /^\s{2,}/, // Indented lines
  ];

  let codeLineCount = 0;
  for (const line of lines) {
    if (line.trim() && codePatterns.some((pattern) => pattern.test(line))) {
      codeLineCount++;
    }
  }

  return codeLineCount;
}

/**
 * Check if message has code blocks
 * @param {string} content - Message content
 * @returns {boolean} True if contains code blocks
 */
function hasCodeBlocks(content) {
  return CODE_BLOCK_REGEX.test(content);
}

/**
 * Create anti-spam warning embed
 * @param {User} user - Discord user
 * @returns {EmbedBuilder} Warning embed
 */
function createSpamWarningEmbed(user) {
  return new EmbedBuilder()
    .setTitle("⚠️ Message Removed - Anti-Spam Protection")
    .setDescription(
      `Hey ${user}, your message was removed because it contained a link.\n\n` +
        `**Why?** New members (< 24 hours) cannot post links to protect our community from spam.\n\n` +
        `Once you've been here for a bit longer, you'll be able to share links freely!`
    )
    .setColor(0xffa500)
    .setFooter({ text: "If this was a mistake, please contact a moderator." })
    .setTimestamp();
}

/**
 * Create code block reminder embed
 * @param {User} user - Discord user
 * @returns {EmbedBuilder} Reminder embed
 */
function createCodeBlockReminderEmbed(user) {
  return new EmbedBuilder()
    .setTitle("💡 Pro Tip: Use Code Blocks!")
    .setDescription(
      `Hey ${user}, it looks like you posted some code!\n\n` +
        `For better readability, please wrap your code in triple backticks:\n\n` +
        "\\`\\`\\`javascript\n" +
        "// Your code here\n" +
        "console.log('Hello World!');\n" +
        "\\`\\`\\`\n\n" +
        "You can also specify the language after the first backticks for syntax highlighting!"
    )
    .setColor(0x5865f2)
    .setFooter({ text: "This helps everyone read your code more easily 📖" })
    .setTimestamp();
}

/**
 * Handle message moderation
 * @param {Message} message - Discord message
 * @param {Array<string>} ignoredChannels - Channel IDs to ignore
 */
async function moderateMessage(message, ignoredChannels = []) {
  // Ignore bots, DMs, and specified channels
  if (message.author.bot) return;
  if (!message.guild) return;
  if (ignoredChannels.includes(message.channel.id)) return;

  try {
    const member = message.member;
    if (!member) return;

    // --- ANTI-SPAM: Check for links from new accounts ---
    if (containsLinks(message.content)) {
      const isNew = isNewAccount(member, 24) || isNewMember(member, 24);

      if (isNew) {
        // Delete the message
        await message.delete();

        // Send warning (auto-delete after 30 seconds)
        const warningEmbed = createSpamWarningEmbed(message.author);
        const warningMsg = await message.channel.send({
          embeds: [warningEmbed],
        });

        setTimeout(() => {
          warningMsg.delete().catch(() => {});
        }, 30000);

        console.log(
          `[Janitor] Deleted link from new user: ${message.author.tag}`
        );
        return; // Stop processing after deletion
      }
    }

    // --- CODE FORMATTING: Remind about code blocks ---
    const codeLines = countCodeLines(message.content);

    if (codeLines >= MIN_CODE_LINES && !hasCodeBlocks(message.content)) {
      const reminderEmbed = createCodeBlockReminderEmbed(message.author);
      const reminderMsg = await message.reply({ embeds: [reminderEmbed] });

      // Auto-delete reminder after 60 seconds
      setTimeout(() => {
        reminderMsg.delete().catch(() => {});
      }, 60000);

      console.log(
        `[Janitor] Sent code block reminder to: ${message.author.tag}`
      );
    }
  } catch (error) {
    console.error("[Janitor] Error moderating message:", error);
  }
}

/**
 * Initialize the janitor module
 * @param {Client} client - Discord client
 * @param {Array<string>} ignoredChannels - Channel IDs to ignore moderation
 */
function initJanitor(client, ignoredChannels = []) {
  client.on("messageCreate", (message) => {
    moderateMessage(message, ignoredChannels);
  });

  console.log("[Janitor] Auto-moderation initialized");
}

module.exports = { initJanitor, moderateMessage };
