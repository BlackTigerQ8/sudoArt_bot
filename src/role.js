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
    const buttons = [];

    roles.forEach((role, index) => {
      const button = new ButtonBuilder()
        .setCustomId(`role_select_${index}`)
        .setLabel(role.name)
        .setStyle(ButtonStyle.Primary); // Button colors

      buttons.push(button);
    });

    row.addComponents(buttons);

    const dmChannel = await member.createDM();
    const message = await dmChannel.send({
      content: "Please select your role:",
      components: [row],
    });

    const filter = (interaction) =>
      interaction.customId.startsWith("role_select_");
    const collector = dmChannel.createMessageComponentCollector({
      filter,
      time: 15000,
    }); // Adjust time as needed

    collector.on("collect", async (interaction) => {
      buttons.forEach((button) => {
        button.setDisabled(true);
      });

      await message.edit({ components: [row] });
      collector.stop();
    });

    collector.on("end", () => {
      if (!row.components.some((button) => !button.disabled)) {
        // All buttons are disabled
        console.log("All buttons disabled.");
      }
    });
  } catch (error) {
    console.error("Error sending role message:", error);
  }
}

module.exports = { sendRoleMessage };
