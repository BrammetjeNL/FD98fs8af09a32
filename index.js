import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '.1';
const GIF_URL = "https://cdn.discordapp.com/attachments/1522698849276268634/1522701428466909326/togif.gif";

client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    const createAmount = parseInt(args[0]) || 8; // standaard 8 channels

    // ====================== .1all - NUKE ======================
    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Je hebt Administrator rechten nodig!");
        }

        // Waarschuwing via DM
        try {
            await message.author.send(`⚠️ **NUKE START** ⚠️\n\nAlle channels worden eerst verwijderd.\nDaarna worden **${createAmount}** channels aangemaakt genaamd "Finnson the goat".\n\nTyp \`.1cancel\` om te stoppen.`);
        } catch {
            return message.reply("❌ Zorg dat je DM's open hebt staan.");
        }

        let cancelled = false;
        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
            time: 4000
        });

        collector.on('collect', () => cancelled = true);

        await new Promise(r => setTimeout(r, 4000));
        if (cancelled) return;

        // 1. Alles verwijderen
        await message.reply("🗑️ **Alle channels worden verwijderd...**");
        
        const channelsToDelete = message.guild.channels.cache.filter(ch => ch.deletable);
        for (const [, channel] of channelsToDelete) {
            try {
                await channel.delete();
                await new Promise(r => setTimeout(r, 200));
            } catch {}
        }

        // 2. Nieuwe channels aanmaken
        await message.channel.send(`✅ Verwijderd. Nu **${createAmount}** channels aanmaken...`);

        for (let i = 1; i <= createAmount; i++) {
            try {
                const newChannel = await message.guild.channels.create({
                    name: "Finnson the goat",   // Naam die je wilde
                    type: 0, // Text channel
                });

                await newChannel.send(`@everyone\n${GIF_URL}`);
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.log(`Fout bij channel ${i}`);
            }
        }

        await message.channel.send(`🚀 **Klaar!** ${createAmount} channels "Finnson the goat" aangemaakt met de gif.`);
        return;
    }

    // ====================== Normale .1 (één channel deleten) ======================
    let targetChannel = args.length > 0 ? message.mentions.channels.first() : message.channel;

    if (!targetChannel) return message.reply("❌ Geen kanaal gevonden. Gebruik `.1` of `.1 #kanaal`");

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) 
        return message.reply("❌ Geen toestemming.");

    try {
        await targetChannel.delete();
        if (targetChannel.id !== message.channel.id) {
            message.reply(`🗑️ **${targetChannel.name}** verwijderd.`).catch(() => {});
        }
    } catch {
        message.reply("❌ Kon kanaal niet verwijderen.").catch(() => {});
    }
});

client.login(process.env.TOKEN);
