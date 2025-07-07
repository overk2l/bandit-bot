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
  
  // Sort roles by member count (descending) and take only first 24 (save 1 spot for clear option)
  const sortedRoles = roles.sort((a, b) => b.members.size - a.members.size).first(24);
  
  sortedRoles.forEach(role => {
    const memberCount = role.members.size;
    const hasRole = userMember.roles.cache.has(role.id);
    
    options.push({
      label: hasRole ? `${role.name} ❌` : `${role.name} 👤 ${memberCount}`,
      value: role.id,
      description: hasRole ? 'Click to remove this role' : undefined
    });
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
    
    // Try deferring the update to see if that changes the behavior
    await interaction.deferUpdate();
    
    // Send a follow-up message instead of updating
    await interaction.followUp({
      content: `Role ${action}: ${role.name}`,
      flags: 64 // ephemeral
    });
  }
});

client.login(process.env.BOT_TOKEN);

