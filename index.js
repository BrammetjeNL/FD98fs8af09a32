import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '.1';

client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    // ====================== .1all - ULTRA SNEL ======================
    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Administrator rechten nodig!");
        }

        // Snelle private waarschuwing
        await message.reply({
            content: "⚠️ **ALLE CHANNELS** worden nu verwijderd in **2 seconden**!\nTyp `.1cancel` om te stoppen.",
        });

        let cancelled = false;

        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
            time: 2000
        });

        collector.on('collect', () => {
            cancelled = true;
            message.reply("✅ **Geannuleerd**");
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (cancelled) return;

        // === ULTRA SNEL VERWIJDEREN ===
        const channels = message.guild.channels.cache.filter(ch => ch.deletable);
        let deleted = 0;

        await message.reply(`🚀 Verwijderen van **${channels.size}** channels...`);

        for (const [, channel] of channels) {
            try {
                await channel.delete();
                deleted++;
                await new Promise(r => setTimeout(r, 150)); // Zeer korte delay
            } catch (err) {
                // Silent fail voor rate limits
            }
        }

        try {
            await message.channel.send(`✅ Klaar! **${deleted}** channels verwijderd.`);
        } catch {}

        return;
    }

    // ====================== Normale .1 ======================
    let targetChannel = args.length > 0 
        ? message.mentions.channels.first() 
        : message.channel;

    if (!targetChannel) return message.reply("❌ Geen kanaal gevonden. Gebruik `.1` of `.1 #kanaal`");

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) 
        return message.reply("❌ Geen toestemming.");

    try {
        await targetChannel.delete();
        if (targetChannel.id !== message.channel.id) {
            message.reply(`🗑️ **${targetChannel.name}** verwijderd.`).catch(() => {});
        }
    } catch (error) {
        message.reply("❌ Kon kanaal niet verwijderen.").catch(() => {});
    }
});

client.login(process.env.TOKEN);
