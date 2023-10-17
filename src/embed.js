const { EmbedBuilder } = require("discord.js");

function createEmbed(user) {
  return new EmbedBuilder()
    .setTitle(`Welcome **${user.username}** to __**sudoArt**__ server.`)
    .setDescription("__The community of the creatives in Kuwait.__")
    .setColor("Random")
    .setAuthor({
      name: "Eng. Abdullah Alenezi",
      url: "https://www.aaalenezi.com",
      iconURL: null,
    })
    .setTimestamp()
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields({
      name: "Role",
      value: "New Member",
      inline: true,
    })
    .setFooter({
      text: "sudoArt",
      iconURL:
        "https://dalil-alkuwait.com/admin/include/itemImages/item_136253_1.jpeg",
    });
}

module.exports = { createEmbed };
