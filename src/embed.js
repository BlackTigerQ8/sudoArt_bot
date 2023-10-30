const { EmbedBuilder } = require("discord.js");

function createEmbed(user) {
  return new EmbedBuilder()
    .setTitle(`Welcome **${user.username}** to our server.`)
    .setDescription("__The community of the creatives in Kuwait.__")
    .setColor("Random")
    .setAuthor({
      name: "Eng. Abdullah Alsultani",
      url: "https://www.aaalenezi.com",
      iconURL: null,
    })
    .setTimestamp()
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields({
      name: "Role",
      value: "Programmer",
      inline: true,
    })
    .setFooter({
      text: "Abdullah Alsultani",
    });
}

module.exports = { createEmbed };
