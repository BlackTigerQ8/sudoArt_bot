const { EmbedBuilder } = require("discord.js");

function createEmbed(user) {
  return new EmbedBuilder()
    .setTitle(`WELCOME **${user.username}** TO OUR COMMUNITY.`)
    .setDescription("__The community of the creatives in Kuwait.__")
    .setColor("Random")
    .setAuthor({
      name: "Eng. Abdullah Alsultani",
      url: "https://www.aaalenezi.com",
      iconURL:
        "https://cdn.discordapp.com/attachments/1168549225118847027/1175875562569465908/server_avatar.png?ex=656cd274&is=655a5d74&hm=b220ada2bed3282ce708b76a5c9b3d6e2708564f9232b05729a3dbf19359d4d6&",
    })
    .setTimestamp()
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: "Abdullah Alsultani",
      iconURL:
        "https://cdn.discordapp.com/attachments/1168549225118847027/1175875562569465908/server_avatar.png?ex=656cd274&is=655a5d74&hm=b220ada2bed3282ce708b76a5c9b3d6e2708564f9232b05729a3dbf19359d4d6&",
    });
}

module.exports = { createEmbed };
