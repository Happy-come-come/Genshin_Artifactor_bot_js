const {Client,Collection,ChannelType,GatewayIntentBits,Partials,Events,Discord} = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages], partials: [Partials.Channel]});
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const functions = require("./functions.js");
const cron = require('node-cron');
const util = require('util');
const Artifacter_func = require("./ArtifacterImageGen/ArtifacterImageGen.js")
const commands = {};
const commandFolders = fs.readdirSync("./commands");
for (const folder of commandFolders) {
    console.log(`\u001b[32m===${folder} commands===\u001b[0m`);
      const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));
      for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        try {
            commands[command.data.name] = command;
            console.log(`${command.data.name} がロードされました。`);
        } catch (error) {
            console.log(`\u001b[31m${command.data.name} はエラーによりロードされませんでした。\nエラー内容\n ${error}\u001b[0m`);
          }
        }
}
console.log(`\u001b[32m============\u001b[0m`);

client.once("ready", async () => {
    const data = []
    for (const commandName in commands) {
        data.push(commands[commandName].data)
    }
	//使いたいサーバーのIDをxxxxxxのところに代わりに入れる。
    await client.application.commands.set(data, 'xxxxxxxxxxxxxxxxx');
});
// コマンドが来た時
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commands[interaction.commandName];
    if (!command) return;

    // DM専用コマンド
    if (command.guildOnly && !interaction.inGuild()) {
      await interaction.reply({
          content: 'このコマンドはDMでは使えません。',
          ephemeral: true,
      })
        return;
    }
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'コマンド実行時にエラーが発生しました。',
            ephemeral: true,
        })
    }

});

// エラー処理 (これ入れないとエラーで落ちる。本当は良くないかもしれない)
process.on("uncaughtException", error => {
    console.error(`[${functions.timeToJST(Date.now(), true)}] ${error.stack}`);
    console.log("error");
});

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}
client.on(Events.InteractionCreate, async interaction => {
	const genshin_artifactor_modal_id = ["input_uid_modal_","input_uid_modal_remember","input_uid_modal_dont_use"];
	const interaction_command_name = functions.get_interaction_commnads_name(interaction);
	switch(true){
		case (interaction_command_name == "genshin_artifactor" || genshin_artifactor_modal_id.indexOf(interaction.customId) != "-1"):
			Artifacter_func.Artifacterbranch_condition(interaction);
			break;
		default:
			return;
			break;
	}
});

client.login().then(() => {
    client.user.setPresence({ activities: [{ name: 'もうN度目の春', type: 5 }], status: 'online' });
});
