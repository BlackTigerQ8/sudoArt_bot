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

const { commands, executeCustomInvite, inviteRoles } = require("./commands");
const { createEmbed } = require("./embed.js");

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

client.on("guildMemberAdd", async (member) => {
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
