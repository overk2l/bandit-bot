const { Client, GatewayIntentBits, ActionRowBuilder, RoleSelectMenuBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '!roles') {
        try {
            // Get all roles in the guild, excluding @everyone and bot roles
            const roles = message.guild.roles.cache
                .filter(role => 
                    role.name !== '@everyone' && 
                    !role.managed && 
                    !role.tags?.botId
                )
                .sort((a, b) => b.position - a.position);

            if (roles.size === 0) {
                await message.reply('No assignable roles found in this server.');
                return;
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🎭 Role Selection')
                .setDescription('Select a role from the dropdown below to add it to yourself. Select it again to remove it.')
                .setColor('#5865F2');

            // Create role select menu (single-select for native X button)
            const roleSelect = new RoleSelectMenuBuilder()
                .setCustomId('role_select')
                .setPlaceholder('Choose a role...')
                .setMinValues(0)
                .setMaxValues(1);

            const row = new ActionRowBuilder().addComponents(roleSelect);

            await message.reply({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Error creating role selection:', error);
            await message.reply('An error occurred while creating the role selection menu.');
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isRoleSelectMenu()) return;

    if (interaction.customId === 'role_select') {
        try {
            // Check if user cleared the selection (no roles selected)
            if (interaction.values.length === 0) {
                await interaction.reply({
                    content: '✅ Selection cleared!',
                    ephemeral: true
                });
                return;
            }

            const selectedRoleId = interaction.values[0];
            const role = interaction.guild.roles.cache.get(selectedRoleId);
            const member = interaction.member;

            if (!role) {
                await interaction.reply({
                    content: '❌ Role not found!',
                    ephemeral: true
                });
                return;
            }

            // Check if bot has permission to manage this role
            if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                await interaction.reply({
                    content: '❌ I don\'t have permission to manage roles!',
                    ephemeral: true
                });
                return;
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                await interaction.reply({
                    content: `❌ I cannot manage the **${role.name}** role because it's higher than or equal to my highest role!`,
                    ephemeral: true
                });
                return;
            }

            // Toggle the role
            const hasRole = member.roles.cache.has(role.id);
            
            if (hasRole) {
                await member.roles.remove(role);
                await interaction.reply({
                    content: `✅ Removed the **${role.name}** role from you!`,
                    ephemeral: true
                });
            } else {
                await member.roles.add(role);
                await interaction.reply({
                    content: `✅ Added the **${role.name}** role to you!`,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Error handling role selection:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your role selection.',
                ephemeral: true
            });
        }
    }
});

// Use environment variable for bot token
client.login(process.env.BOT_TOKEN);
