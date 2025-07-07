const { Client, GatewayIntentBits, Partials, ActionRowBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Function to build role options with member counts (dynamic - all roles)
function buildRoleOptions(guild, userMember) {
  const options = [];
  
  // Get all roles except @everyone and bot roles
  const roles = guild.roles.cache.filter(role => 
    !role.managed && // exclude bot roles
    role.id !== guild.id && // exclude @everyone
    role.name !== '@everyone'
  );
  
  // Sort roles by member count (descending) and take only first 23 (save room for clear option)
  const sortedRoles = roles.sort((a, b) => b.members.size - a.members.size).first(23);
  
  sortedRoles.forEach(role => {
    const memberCount = role.members.size;
    options.push({
      label: `${role.name} 👤 ${memberCount}`,
      value: role.id
    });
  });
  
  // Always add clear selection option
  options.push({
    label: '❌ Clear Selection',
    value: 'clear_selection',
    description: 'Clear the current selection'
  });
  
  return options;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!test1') {
    const member = await message.guild.members.fetch(message.author.id);
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Make a selection')
        .addOptions(buildRoleOptions(message.guild, member))
    );
    await message.channel.send({ content: 'Choose a role to toggle:', components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId === 'role_select') {
    const selectedValue = interaction.values[0];
    
    // Handle clear selection
    if (selectedValue === 'clear_selection') {
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('role_select')
          .setPlaceholder('Make a selection')
          .addOptions(buildRoleOptions(interaction.guild, null))
      );
      await interaction.update({
        content: 'Choose a role to toggle:',
        components: [row],
      });
      return;
    }
    
    // Handle role selection
    const roleId = selectedValue;
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
    
    // Show the selected role in the placeholder
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder(`Selected: ${role.name}`)
        .addOptions(buildRoleOptions(interaction.guild, member))
    );
    
    await interaction.update({
      content: `Role ${action}: ${role.name}\nChoose a role to toggle:`,
      components: [row],
    });
  }
});

client.login(process.env.BOT_TOKEN);

