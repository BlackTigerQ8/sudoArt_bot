const commands = [
  {
    name: "custominvite",
    description: "Create a custom invite link with a specific role",
    options: [
      {
        name: "role",
        type: 8,
        description: "Select a role for the user to be assigned",
        required: true,
      },
      {
        name: "channel",
        type: 7,
        description: "Select the channel to invite the user to",
        required: true,
      },
    ],
  },
];

async function executeCustomInvite(interaction) {
  const { options } = interaction;

  await interaction.deferReply({ ephemeral: false });

  const role = options.getRole("role");
  const channel = options.getChannel("channel");

  if (!channel) {
    console.error("Channel not found");
    await interaction.followUp("Error: Channel not found.");
    return;
  }

  const unsupportedTypes = [
    "GUILD_VOICE",
    "GUILD_CATEGORY",
    "GUILD_NEWS_THREAD",
    "GUILD_PUBLIC_THREAD",
    "GUILD_PRIVATE_THREAD",
  ];
  if (unsupportedTypes.includes(channel.type)) {
    console.error("Unsupported channel type for invite creation");
    await interaction.followUp(
      "Error: Selected channel type does not support invite creation."
    );
    return;
  }

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
}

module.exports = { commands, executeCustomInvite };
