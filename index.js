const { Client, GatewayIntentBits, Partials, ActionRowBuilder, Events } = require('discord.js');
const { SelectMenuBuilder } = require('@discordjs/builders');
require('dotenv').config();

console.log("discord.js version:", require('discord.js').version);
console.log("@discordjs/builders version:", require('@discordjs/builders').version);
console.log("Has setDefaultValues:", typeof SelectMenuBuilder.prototype.setDefaultValues === 'function');
console.log("discord.js path:", require.resolve('discord.js'));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Function to build role options with member counts (dynamic - all roles)
function buildRoleOptions(guild, userMember, hasSelection = false) {
  const options = [];
  
  // Get all roles except @everyone and bot roles
  const roles = guild.roles.cache.filter(role => 
    !role.managed && // exclude bot roles
    role.id !== guild.id && // exclude @everyone
    role.name !== '@everyone'
  );
  
  // Sort roles by member count (descending) and take only first 23-24 (depending on clear option)
  const maxRoles = hasSelection ? 24 : 23;
  const sortedRoles = Array.from(roles.sort((a, b) => b.members.size - a.members.size).values()).slice(0, maxRoles);
  
  sortedRoles.forEach(role => {
    const memberCount = role.members.size;
    options.push({
      label: `${role.name} 👤 ${memberCount}`,
      value: role.id
    });
  });
  
  // Add clear selection option only when no selection is made
  if (!hasSelection) {
    options.push({
      label: '❌ Clear Selection',
      value: 'clear_selection',
      description: 'Clear the current selection'
    });
  }
  
  // Safety check - ensure we never exceed 25 options
  if (options.length > 25) {
    return options.slice(0, 25);
  }
  
  return options;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!test1') {
    const member = await message.guild.members.fetch(message.author.id);
    const row = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Make a selection')
        .addOptions(buildRoleOptions(message.guild, member, false))
    );
    await message.channel.send({ content: 'Choose a role to toggle:', components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId === 'role_select') {
    const selectedValue = interaction.values[0];
      // Handle when Discord's X button is clicked (no values selected)
    if (!selectedValue || selectedValue === '') {
      const row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId('role_select')
          .setPlaceholder('Make a selection')
          .addOptions(buildRoleOptions(interaction.guild, null, false))
      );
      await interaction.update({
        content: 'Choose a role to toggle:',
        components: [row],
      });
      return;
    }

    // Handle clear selection
    if (selectedValue === 'clear_selection') {
      const row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId('role_select')
          .setPlaceholder('Make a selection')
          .addOptions(buildRoleOptions(interaction.guild, null, false))
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
    
    // Show the selected role with default values (enables Discord's X button)
    const row = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Make a selection')
        .setDefaultValues([roleId])
        .addOptions(buildRoleOptions(interaction.guild, member, true))
    );
    
    await interaction.update({
      content: 'Choose a role to toggle:',
      components: [row],
    });
  }
});

client.login(process.env.BOT_TOKEN);

