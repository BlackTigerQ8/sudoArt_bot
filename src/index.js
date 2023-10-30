require("dotenv").config();

const { Client, Intents, IntentsBitField } = require("discord.js");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.MessageContent,
  ],
});

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const defaultRoleId = "1080243019065852016";

const { commands, executeCustomInvite, inviteRoles } = require("./commands");
const { createEmbed } = require("./embed.js");
const { sendRoleMessage, handleRoleSelection } = require("./role.js");

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

commands.push({
  name: "getrole",
  description: "Initiate the role assignment process",
  type: 1,
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  try {
    if (interaction.isCommand()) {
      switch (interaction.commandName) {
        case "getrole":
          if (!interaction.guild) {
            await interaction.reply({
              content: "Please use this command in the server.",
              ephemeral: true,
            });
            return;
          }

          const member = await interaction.guild.members.fetch(
            interaction.user.id
          );
          await sendRoleMessage(member);
          await interaction.reply({
            content: "Please check your DMs for role selection.",
            ephemeral: true,
          });
          break;
        // ... (other cases)
      }
    } else if (interaction.isButton()) {
      await handleRoleSelection(interaction);
    }
  } catch (error) {
    console.error(`Error with interaction: ${error}`);
    interaction.reply("An error occurred while processing your request.");
  }
});

client.on("guildMemberAdd", async (member) => {
  console.log(`A user joined: ${member.user.tag}`);
  const welcomeEmbed = createEmbed(member.user);
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === "welcome"
  );
  if (channel) channel.send({ embeds: [welcomeEmbed] });

  const newInvites = await member.guild.invites.fetch();
  const oldInvites = client.guildInvites.get(member.guild.id) || new Map();

  const usedInvite = newInvites.find(
    (inv) => oldInvites.get(inv.code)?.uses < inv.uses
  );

  console.log("Used Invite:", usedInvite ? usedInvite.code : "Not found");

  if (usedInvite && inviteRoles[usedInvite.code]) {
    const roleId = inviteRoles[usedInvite.code].role;
    const roleToAssign = member.guild.roles.cache.get(roleId);

    if (roleToAssign) {
      member.roles.add(roleToAssign).catch(console.error);
      console.log(`Assigned role: ${roleToAssign.name} to ${member.user.tag}`);

      // Notify the inviter
      const inviterId = inviteRoles[usedInvite.code].inviter;
      const inviter = await member.guild.members.fetch(inviterId);
      inviter.send(
        `Thanks for inviting ${member.user.tag} to the server! They have been assigned the ${roleToAssign.name} role.`
      );
    } else {
      console.error(`Failed to find role with ID: ${roleId}`);
    }
  }

  client.guildInvites.set(member.guild.id, newInvites);

  try {
    const defaultRole = member.guild.roles.cache.get(defaultRoleId);

    if (defaultRole) {
      await member.roles.add(defaultRole);
    } else {
      console.warn(`Default role not found: ${defaultRoleId}`);
    }
  } catch (error) {
    console.error(
      `Failed to assign default role to ${member.user.tag}: ${error}`
    );
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    switch (interaction.commandName) {
      case "custominvite":
        await executeCustomInvite(interaction);
        break;
      // Add more commands if needed in the future.
    }
  } catch (error) {
    console.error(`Error with interaction: ${error}`);
    interaction.reply("An error occurred while processing your request.");
  }
});

client.guildInvites = new Map();

client.once("ready", async () => {
  console.log("Bot is ready!");

  // Cache the invites for all guilds the bot is a member of
  for (const [guildId, guild] of client.guilds.cache) {
    client.guildInvites.set(guildId, await guild.invites.fetch());
  }
});

client.login(token);
