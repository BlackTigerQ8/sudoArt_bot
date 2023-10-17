require("dotenv").config();

const { Client, Intents, IntentsBitField, ChannelType } = require("discord.js");
const client = new Client({ intents: [IntentsBitField.Flags.Guilds] });

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [
  {
    name: "custominvite",
    description: "Create a custom invite link with a specific role",
    options: [
      {
        name: "role",
        type: 8, // Role type
        description: "Select a role for the user to be assigned",
        required: true,
      },
      {
        name: "channel",
        type: 7, // Channel type
        description: "Select the channel to invite the user to",
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { options } = interaction;
  if (interaction.commandName === "custominvite") {
    await interaction.deferReply({ ephemeral: false });

    const role = options.getRole("role");
    const channel = options.getChannel("channel"); // Get the selected channel from options

    if (channel && ChannelType.GuildText) {
      const invite = await channel.createInvite({
        maxAge: 0,
        maxUses: 1,
        unique: true,
        permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
      });

      const inviteLink = `https://discord.gg/${invite.code}`;
      await interaction.followUp(
        `Here's your invite link to "${channel.name}" with the role "${role.name}": ${inviteLink}`
      );
    } else {
      console.error("Channel not found or not a text channel");
    }
  }
});

client.login(token);
