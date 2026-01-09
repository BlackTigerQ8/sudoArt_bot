/**
 * =====================================================
 * INSTRUCTOR MODULE - Dynamic Schedule System
 * =====================================================
 * Allows Admins to update the schedule via command.
 * Stores data in a local JSON file.
 */

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// File to store the schedule so it survives bot restarts
const DB_PATH = path.join(__dirname, "schedule_db.json");

// Load existing schedule or create default
let scheduleData = fs.existsSync(DB_PATH)
  ? JSON.parse(fs.readFileSync(DB_PATH))
  : { title: "TBA", date: "TBA", description: "No workshop scheduled yet." };

// Import engagement for test command
const { testChallenge, postManualChallenge } = require("./engagement.js");

/**
 * 1. Define Commands
 */
const commands = [
  new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("View the next upcoming workshop"),

  new SlashCommandBuilder()
    .setName("update_schedule")
    .setDescription("ADMIN ONLY: Set the next workshop details")
    .setDefaultMemberPermissions(0x0000000000000008), // Administrator only

  new SlashCommandBuilder()
    .setName("test_challenge")
    .setDescription("ADMIN ONLY: Test AI daily challenge (posts to channel)")
    .setDefaultMemberPermissions(0x0000000000000008), // Administrator only

  new SlashCommandBuilder()
    .setName("challenge")
    .setDescription("Request a fun trivia question now!")
    .addStringOption((option) =>
      option
        .setName("topic")
        .setDescription("Specific topic (e.g. Python, Space, History)")
        .setRequired(false)
    ),
];

/**
 * 2. Handle Interactions
 */
async function handleInteractions(interaction) {
  try {
    // A. Handle /schedule (Public)
    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "schedule"
    ) {
      console.log(`[Instructor] /schedule used by ${interaction.user.tag}`);
      const embed = new EmbedBuilder()
        .setTitle(`📅 Upcoming: ${scheduleData.title}`)
        .setDescription(scheduleData.description)
        .addFields(
          { name: "Time", value: scheduleData.date, inline: true },
          { name: "Instructor", value: "Eng. Abdullah", inline: true }
        )
        .setColor(0x5865f2);

      await interaction.reply({ embeds: [embed] });
    }

    // B. Handle /update_schedule (Admin Pop-up Form)
    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "update_schedule"
    ) {
      console.log(
        `[Instructor] /update_schedule used by ${interaction.user.tag}`
      );

      const modal = new ModalBuilder()
        .setCustomId("scheduleModal")
        .setTitle("Update Workshop Schedule");

      const titleInput = new TextInputBuilder()
        .setCustomId("titleInput")
        .setLabel("Workshop Title")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const dateInput = new TextInputBuilder()
        .setCustomId("dateInput")
        .setLabel("Date & Time (e.g. Friday 7PM KWT)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId("descInput")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(descInput)
      );

      await interaction.showModal(modal);
      console.log("[Instructor] Modal shown successfully");
    }

    // C. Handle the Form Submission
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "scheduleModal"
    ) {
      console.log(`[Instructor] Modal submitted by ${interaction.user.tag}`);

      // Save new data
      scheduleData = {
        title: interaction.fields.getTextInputValue("titleInput"),
        date: interaction.fields.getTextInputValue("dateInput"),
        description: interaction.fields.getTextInputValue("descInput"),
      };

      // Write to file
      fs.writeFileSync(DB_PATH, JSON.stringify(scheduleData, null, 2));

      await interaction.reply({
        content:
          "✅ Schedule updated successfully! Users can now check /schedule.",
        ephemeral: true,
      });

      console.log("[Instructor] Schedule updated:", scheduleData.title);
    }

    // D. Handle /test_challenge (Admin - Test AI)
    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "test_challenge"
    ) {
      console.log(
        `[Instructor] /test_challenge used by ${interaction.user.tag}`
      );

      await interaction.deferReply({ ephemeral: true });

      try {
        await testChallenge();
        await interaction.editReply({
          content: "✅ Test challenge posted! Check the category channels.",
        });
      } catch (err) {
        console.error("[Instructor] Test challenge error:", err);
        await interaction.editReply({
          content: `❌ Error: ${err.message}`,
        });
      }
    }

    // E. Handle /challenge (Public - Manual Trigger)
    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "challenge"
    ) {
      console.log(`[Instructor] /challenge used by ${interaction.user.tag}`);
      const topic = interaction.options.getString("topic");
      await postManualChallenge(interaction, topic);
    }
  } catch (error) {
    console.error("[Instructor] Error handling interaction:", error);

    // Try to respond with error if we haven't already
    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({
          content: "❌ Something went wrong. Please try again.",
          ephemeral: true,
        })
        .catch(() => {});
    }
  }
}

/**
 * 3. Initialize & Register
 * @param {Client} client - Discord client
 * @param {string} token - Bot token
 * @param {string} clientId - Application ID
 * @param {string} guildId - Guild ID (optional, but recommended for instant updates)
 */
async function initInstructor(client, token, clientId, guildId = null) {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("[Instructor] Refreshing commands...");

    if (guildId) {
      // Guild commands = INSTANT update (recommended for development)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log("[Instructor] Guild commands registered instantly!");
    } else {
      // Global commands = up to 1 hour to propagate
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(
        "[Instructor] Global commands registered (may take up to 1 hour)."
      );
    }
  } catch (error) {
    console.error("[Instructor] Error registering commands:", error);
  }

  client.on("interactionCreate", handleInteractions);
}

module.exports = { initInstructor };
