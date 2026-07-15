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
    console.log(`Commands: ${PREFIX} | ${PREFIX} #kanaal | ${PREFIX}all`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    // === .1all → ALLE CHANNELS VERWIJDEREN ===
    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Je hebt Administrator rechten nodig voor dit commando!");
        }

        await message.reply("⚠️ **WAARSCHUWING**: Alle channels worden verwijderd in 5 seconden!\nTyp `.1cancel` om te stoppen.");

        // 5 seconden cooldown + cancel mogelijkheid
        let cancelled = false;

        const cancelListener = async (msg) => {
            if (msg.author.id === message.author.id && msg.content.toLowerCase() === '.1cancel') {
                cancelled = true;
                message.reply("✅ Operatie geannuleerd.");
                client.removeListener('messageCreate', cancelListener);
            }
        };

        client.on('messageCreate', cancelListener);

        setTimeout(async () => {
            client.removeListener('messageCreate', cancelListener);
            if (cancelled) return;

            const channels = message.guild.channels.cache;
            let deleted = 0;

            for (const [id, channel] of channels) {
                if (channel.deletable) {
                    try {
                        await channel.delete();
                        deleted++;
                        await new Promise(r => setTimeout(r, 800)); // kleine delay om rate limit te vermijden
                    } catch (err) {
                        console.log(`Kon niet verwijderen: ${channel.name}`);
                    }
                }
            }

            try {
                await message.channel.send(`✅ Klaar! **${deleted}** channels verwijderd.`);
            } catch {}
        }, 5000);

        return;
    }

    // === Normale .1 command (één channel) ===
    let targetChannel;

    if (args.length > 0) {
        targetChannel = message.mentions.channels.first();
    } else {
        targetChannel = message.channel;
    }

    if (!targetChannel) {
        return message.reply("❌ Geen geldig kanaal gevonden. Gebruik `.1 #kanaal` of `.1`");
    }

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply("❌ Je hebt geen toestemming om channels te verwijderen.");
    }

    try {
        await message.reply(`🗑️ **${targetChannel.name}** wordt verwijderd...`);
        await targetChannel.delete();
    } catch (error) {
        message.reply("❌ Kon dit kanaal niet verwijderen.").catch(() => {});
    }
});

client.login(process.env.TOKEN);
