// index.js
// Discord backup/restore bot
// Commands (prefix "!"):
//   !backup            -> slaat huidige categorieën + kanalen op in backup.json
//   !restore           -> bouwt de laatst opgeslagen structuur weer op (maakt NIETS bestaands kapot)
//   !maketest          -> maakt een testcategorie "TEST-SANDBOX" met 2 kanalen aan
//   !cleartest         -> verwijdert ALLEEN de categorie "TEST-SANDBOX" (en zijn kanalen) die de bot zelf maakte
//
// Vereist environment variable: DISCORD_TOKEN
// Vereist bot-permissie: Manage Channels
// Vereist "Message Content Intent" aan in het Discord Developer Portal

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const PREFIX = "!";
const BACKUP_FILE = path.join(__dirname, "backup.json");
const SANDBOX_NAME = "TEST-SANDBOX";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Ingelogd als ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;
  if (!message.guild) return;

  // Alleen mensen met Manage Channels-permissie mogen deze commando's gebruiken
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    return message.reply("Je hebt de 'Manage Channels'-permissie nodig om dit te gebruiken.");
  }

  const command = message.content.slice(PREFIX.length).trim().toLowerCase();

  try {
    if (command === "backup") {
      await backupGuild(message);
    } else if (command === "restore") {
      await restoreGuild(message);
    } else if (command === "maketest") {
      await makeSandbox(message);
    } else if (command === "cleartest") {
      await clearSandbox(message);
    }
  } catch (err) {
    console.error(err);
    message.reply(`Er ging iets mis: ${err.message}`);
  }
});

// ---------- BACKUP ----------
async function backupGuild(message) {
  const guild = message.guild;
  await guild.channels.fetch(); // zorg dat cache compleet is

  const categories = guild.channels.cache
    .filter((c) => c.type === ChannelType.GuildCategory)
    .map((cat) => ({
      name: cat.name,
      position: cat.position,
      channels: guild.channels.cache
        .filter((ch) => ch.parentId === cat.id)
        .map((ch) => ({
          name: ch.name,
          type: ch.type, // GuildText = 0, GuildVoice = 2, etc.
          position: ch.position,
          topic: ch.topic ?? null,
        })),
    }));

  const data = {
    guildId: guild.id,
    guildName: guild.name,
    backedUpAt: new Date().toISOString(),
    categories,
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));

  message.reply(
    `Backup gemaakt: ${categories.length} categorie(ën) en ${categories.reduce(
      (sum, c) => sum + c.channels.length,
      0
    )} kanalen opgeslagen in backup.json.`
  );
}

// ---------- RESTORE ----------
async function restoreGuild(message) {
  if (!fs.existsSync(BACKUP_FILE)) {
    return message.reply("Er is nog geen backup.json. Gebruik eerst `!backup`.");
  }

  const data = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
  const guild = message.guild;

  let restoredCategories = 0;
  let restoredChannels = 0;

  for (const cat of data.categories) {
    const category = await guild.channels.create({
      name: cat.name,
      type: ChannelType.GuildCategory,
    });
    restoredCategories++;

    for (const ch of cat.channels) {
      await guild.channels.create({
        name: ch.name,
        type: ch.type,
        parent: category.id,
        topic: ch.topic ?? undefined,
      });
      restoredChannels++;
    }
  }

  message.reply(
    `Restore voltooid: ${restoredCategories} categorie(ën) en ${restoredChannels} kanalen opnieuw aangemaakt op basis van backup.json (${data.backedUpAt}).`
  );
}

// ---------- SANDBOX (veilig testen zonder bestaande content te raken) ----------
async function makeSandbox(message) {
  const guild = message.guild;

  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === SANDBOX_NAME
  );
  if (existing) {
    return message.reply(`"${SANDBOX_NAME}" bestaat al. Gebruik \`!cleartest\` om hem eerst op te ruimen.`);
  }

  const category = await guild.channels.create({
    name: SANDBOX_NAME,
    type: ChannelType.GuildCategory,
  });

  await guild.channels.create({
    name: "test-chat",
    type: ChannelType.GuildText,
    parent: category.id,
  });

  await guild.channels.create({
    name: "Test Voice",
    type: ChannelType.GuildVoice,
    parent: category.id,
  });

  message.reply(`Sandboxcategorie "${SANDBOX_NAME}" aangemaakt met 2 kanalen.`);
}

async function clearSandbox(message) {
  const guild = message.guild;
  await guild.channels.fetch();

  const category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === SANDBOX_NAME
  );

  if (!category) {
    return message.reply(`Geen "${SANDBOX_NAME}"-categorie gevonden.`);
  }

  const childChannels = guild.channels.cache.filter((c) => c.parentId === category.id);
  for (const ch of childChannels.values()) {
    await ch.delete("Sandbox opruimen");
  }
  await category.delete("Sandbox opruimen");

  message.reply(`Sandboxcategorie "${SANDBOX_NAME}" en zijn kanalen zijn verwijderd.`);
}

client.login(process.env.DISCORD_TOKEN);
