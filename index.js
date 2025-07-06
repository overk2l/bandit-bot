const { Client, GatewayIntentBits, Partials, ActionRowBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const ROLE_OPTIONS = [
  { label: 'Role 1', value: '1370533441724092537' },
  { label: 'Role 2', value: '1370533436317761546' },
  { label: 'Role 3', value: '1370533450704224447' }
];

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!test1') {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Select a role to toggle')
        .addOptions(ROLE_OPTIONS)
    );
    await message.channel.send({ content: 'Choose a role to toggle:', components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId === 'role_select') {
    const roleId = interaction.values[0];
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      await interaction.reply({ content: 'Role not found.', flags: 64 }); // ephemeral
      return;
    }
    let action;
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      action = 'removed';
    } else {
      await member.roles.add(roleId);
      action = 'added';
    }
    await interaction.reply({ content: `Role ${action}: ${role.name}`, flags: 64 }); // ephemeral
    // No message edit, so no (edited) mark, and dropdown resets for user
  }
});

client.login(process.env.BOT_TOKEN);

