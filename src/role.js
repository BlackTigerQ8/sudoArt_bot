const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

async function sendRoleMessage(member) {
  try {
    const roles = [
      { id: "1080242882604191764", name: "3D Designer" },
      { id: "1080242975843561533", name: "Digital Artist" },
      { id: "1080243019065852016", name: "Programmer" },
      { id: "1104062368218103980", name: "ُEngineer" },
      { id: "1104066025340797050", name: "Hacker" },
    ];

    const row = new ActionRowBuilder();

    roles.forEach((role, index) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`role_select_${index}`)
          .setLabel(role.name)
          .setStyle(ButtonStyle.Primary)
      );
    });

    const dmChannel = await member.createDM();
    await dmChannel.send({
      content: "Please select your role:",
      components: [row],
    });
  } catch (error) {
    console.error("Error sending role message:", error);
  }
}

async function handleRoleSelection(interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("role_select_")) return;

  const index = parseInt(interaction.customId.split("_")[2], 10);
  const roles = [
    { id: "1080242882604191764", name: "3D Designer" },
    { id: "1080242975843561533", name: "Digital Artist" },
    { id: "1080243019065852016", name: "Programmer" },
    { id: "1104062368218103980", name: "ُEngineer" },
    { id: "1104066025340797050", name: "Hacker" },
  ];

  const role = roles[index];
  if (!role) {
    await interaction.reply({
      content: "Invalid role selected. Please try again.",
      ephemeral: true,
    });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  await member.roles.add(role.id);

  await interaction.reply({
    content: `You have been assigned the role: ${role.name}`,
    ephemeral: true,
  });
}

module.exports = { sendRoleMessage, handleRoleSelection };
