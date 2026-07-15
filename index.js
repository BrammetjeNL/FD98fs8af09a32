import { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const TOKEN = process.env.TOKEN; // Token komt van Render Environment Variables

client.once('ready', async () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);

    // Slash commands registreren
    const commands = [
        new SlashCommandBuilder()
            .setName('deletechannel')
            .setDescription('Verwijder een channel')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('Het channel dat je wilt verwijderen')
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    ];

    await client.application?.commands.set(commands);
    console.log('✅ Slash command /deletechannel is geregistreerd');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'deletechannel') {
        const channel = interaction.options.getChannel('channel');

        // Check permissies
        if (!interaction.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "❌ Ik heb geen toestemming om dit channel te verwijderen.", ephemeral: true });
        }

        await interaction.reply({ content: `🗑️ **${channel.name}** wordt verwijderd...`, ephemeral: true });

        try {
            await channel.delete();
            console.log(`Channel verwijderd: ${channel.name}`);
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: "❌ Er ging iets mis bij het verwijderen van het channel.", ephemeral: true });
        }
    }
});

client.login(TOKEN);
