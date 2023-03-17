const {Client,Collection,GatewayIntentBits,Partials,ApplicationCommandType,ApplicationCommandOptionType,ActionRowBuilder,Events,ModalBuilder,TextInputBuilder,TextInputStyle} = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages], partials: [Partials.Channel]});
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const fs = require('fs');
const Artifacter_func = require("../../ArtifacterImageGen/ArtifacterImageGen.js");
module.exports = {
	data: {
		name: "genshin_artifactor",
		description: "聖遺物スコアを画像で出します。",
		type: ApplicationCommandType.ChatInput,
	options: [{
			type: "BOOLEAN",
			name: "remember_my_uid",
			description: "UIDを記憶させるか(上書きの場合もこちら)。",
			required: false,
			type: ApplicationCommandOptionType.Boolean
	},{
			type: "BOOLEAN",
			name: "dont_use_my_uid",
			description: "自分のUIDを使いません(記録もされません)。",
			required: false,
			type: ApplicationCommandOptionType.Boolean
	}]},
	async execute(interaction) {
		console.log(`Artfactor: ${interaction.guild.name}:${interaction.user.username}`)
		var remember_flag = "_";
		var saved_uid,path_name,user_data_json;
		try{
			if (interaction.options.getBoolean('remember_my_uid') == true){
				remember_flag = "_remember"
			}
		}catch{}
		try{
			if (interaction.options.getBoolean('dont_use_my_uid') == true){
				remember_flag = "_dont_use"
			}
		}catch{}
		try{
			if (interaction.options.getBoolean('dont_use_my_uid') == true && interaction.options.getBoolean('remember_my_uid') == true){
				interaction.reply({content: '「dont_use_my_uid」と「remember_my_uid」は同時に設定しないでください。', ephemeral: true });
				return;
			}
		}catch{}
		try{
			path_name = `./ArtifacterImageGen/user_data_jsons/${interaction.user.id}.json`
			user_data_json = JSON.parse(fs.readFileSync(path_name,'utf-8'));
			saved_uid = user_data_json[0].uid;
		}catch{}
		if(remember_flag == "_" && String(saved_uid).match(/[0-9]{9}/)){
			Artifacter_func.Artifacterbranch_condition(interaction,true,user_data_json[0].uid);
		}else{
			const modal = new ModalBuilder()
				.setCustomId(`input_uid_modal${remember_flag}`)
				.setTitle('UIDの入力');
			const UID_input = new TextInputBuilder()
				.setCustomId('input_uid')
				.setLabel("UIDを入力してください。")
				.setMaxLength(9)
				.setMinLength(9)
				.setPlaceholder('000000000')
				.setRequired(true)
				.setStyle(TextInputStyle.Short);
			const firstActionRow = new ActionRowBuilder().addComponents(UID_input);
			modal.addComponents(firstActionRow);
			await interaction.showModal(modal);
		}
	}
}