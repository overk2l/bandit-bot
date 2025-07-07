const { Client, GatewayIntentBits, Partials, ActionRowBuilder, RoleSelectMenuBuilder, Events } = require('discord.js');
require('dotenv').config();

console.log("discord.js version:", require('discord.js').version);
console.log("Has addDefaultRoles:", typeof RoleSelectMenuBuilder.prototype.addDefaultRoles === 'function');
console.log("discord.js path:", require.resolve('discord.js'));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// RoleSelectMenuBuilder automatically shows all roles, no need for manual options
// Just filter out bot roles and @everyone when setting defaults

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!test1') {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Choose roles to toggle')
        .setMinValues(0)
        .setMaxValues(25)
    );
    await message.channel.send({ content: 'Choose roles to toggle:', components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isRoleSelectMenu()) return;
  if (interaction.customId === 'role_select') {
    const selectedRoles = interaction.values; // Array of role IDs
    const member = interaction.member;
    let message = '';
    
    // Track which roles were added/removed
    const addedRoles = [];
    const removedRoles = [];
    
    // Process each selected role
    for (const roleId of selectedRoles) {
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) continue;
      
      if (member.roles.cache.has(roleId)) {
        // User has this role, remove it
        try {
          await member.roles.remove(role);
          removedRoles.push(role.name);
        } catch (error) {
          console.error(`Error removing role ${role.name}:`, error);
        }
      } else {
        // User doesn't have this role, add it
        try {
          await member.roles.add(role);
          addedRoles.push(role.name);
        } catch (error) {
          console.error(`Error adding role ${role.name}:`, error);
        }
      }
    }
    
    // Build response message
    const parts = [];
    if (addedRoles.length > 0) {
      parts.push(`Added: ${addedRoles.join(', ')}`);
    }
    if (removedRoles.length > 0) {
      parts.push(`Removed: ${removedRoles.join(', ')}`);
    }
    
    if (parts.length === 0) {
      message = 'No role changes made.';
    } else {
      message = parts.join(' | ');
    }
    
    // Create updated dropdown with current user's roles as default
    const userRoleIds = member.roles.cache.filter(role => 
      !role.managed && // exclude bot roles
      role.id !== interaction.guild.id && // exclude @everyone
      role.name !== '@everyone'
    ).map(role => role.id);
    
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Choose roles to toggle')
        .setMinValues(0)
        .setMaxValues(25)
        .addDefaultRoles(userRoleIds) // Set current user roles as default
    );
    
    await interaction.reply({
      content: message,
      components: [row],
      ephemeral: true
    });
  }
});

client.login(process.env.BOT_TOKEN);

