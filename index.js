import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '.1';

client.once('ready', () => {
    console.log(`✅ Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    // ====================== .1all ======================
    if (command === 'all') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "❌ Je hebt Administrator rechten nodig!", ephemeral: false });
        }

        // **Alleen de uitvoerder ziet de warning**
        await message.reply({
            content: "⚠️ **GEVAARLIJK COMMando**\nAlle channels worden over **3 seconden** verwijderd!\nTyp `.1cancel` om te annuleren.",
            ephemeral: false // Alleen jij ziet dit niet, maar we maken het snel
        });

        let cancelled = false;

        const cancelFilter = m => m.author.id === message.author.id && m.content.toLowerCase() === '.1cancel';
        const cancelCollector = message.channel.createMessageCollector({ filter: cancelFilter, time: 3000 });

        cancelCollector.on('collect', () => {
            cancelled = true;
            message.reply("✅ **Geannuleerd**");
        });

        // Wacht 3 seconden
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (cancelled) return;

        // Snelle verwijdering
        const channels = message.guild.channels.cache.filter(ch => ch.deletable);
        let deleted = 0;

        message.reply(`🚀 Starten met verwijderen van **${channels.size}** channels...`);

        for (const [id, channel] of channels) {
            try {
                await channel.delete();
                deleted++;
                // Kleine delay om rate limits te vermijden
                await new Promise(r => setTimeout(r, 400));
            } catch (err) {
                console.log(`Kon niet verwijderen: ${channel.name}`);
            }
        }

        try {
            await message.channel.send(`✅ Klaar! **${deleted}** channels verwijderd.`);
        } catch (e) {}
        
        return;
    }

    // ====================== Normale .1 ======================
    let targetChannel = args.length > 0 
        ? message.mentions.channels.first() 
        : message.channel;

    if (!targetChannel) {
        return message.reply("❌ Geen geldig kanaal gevonden. Gebruik `.1 #kanaal` of gewoon `.1`");
    }

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply("❌ Je hebt geen toestemming om channels te verwijderen.");
    }

    try {
        await targetChannel.delete();
        if (targetChannel.id !== message.channel.id) {
            await message.reply(`🗑️ **${targetChannel.name}** verwijderd.`);
        }
    } catch (error) {
        message.reply("❌ Kon dit kanaal niet verwijderen.");
    }
});

client.login(process.env.TOKEN);
