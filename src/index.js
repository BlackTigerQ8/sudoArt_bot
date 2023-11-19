require("dotenv").config();

const { Client, Intents, IntentsBitField } = require("discord.js");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
  ],
});

const token = process.env.TOKEN;
const guildID = process.env.GUILD_ID;
const { createEmbed } = require("./embed.js");
const { sendRoleMessage } = require("./role.js");

// Send Embed and private message to the user to select a role
client.on("guildMemberAdd", async (member) => {
  console.log(`A user joined: ${member.user.tag}`);
  const welcomeEmbed = createEmbed(member.user);
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === "welcome"
  );
  if (channel) channel.send({ embeds: [welcomeEmbed] });

  // Send a private message for role selection
  await sendRoleMessage(member);
});

///////////////////////////
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    const roles = [
      { id: "1175761559637721098", name: "Designer" },
      // { id: "1080242975843561533", name: "Digital Artist" },
      { id: "1175761481204244520", name: "Programmer" },
      { id: "1175761745667690526", name: "Engineer" },
      { id: "1175761792648089609", name: "Hacker" },
    ];

    const roleId = interaction.customId.replace("role_select_", "");
    const selectedRole = roles[parseInt(roleId)];

    if (selectedRole) {
      const guildId = guildID;
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
        console.error("Guild not found!");
        return await interaction.reply("Guild not found.");
      }

      const member = await guild.members.fetch(interaction.user.id);

      if (!member) {
        console.error("Member not found!");
        return await interaction.reply("Member not found.");
      }

      const role = guild.roles.cache.get(selectedRole.id);

      if (!role) {
        console.error("Role not found!");
        return await interaction.reply("Role not found.");
      }

      await member.roles.add(role);
      await interaction.reply(
        `You've been assigned the role: **${role.name}**.\n-------\nIf you have other skills that fits in other categories, we can **assign multiple roles** to expand your view in the community. Feel free to **contact the Admin** for another roles.`
      );
    }
  } catch (error) {
    console.error("Error assigning role:", error);
    await interaction.reply("Failed to assign the role.");
  }
});

client.once("ready", async () => {
  console.log("Bot is ready!");
});

client.login(token);
