const { MessageActionRow, MessageButton, ActionRowBuilder, Events, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder, AttachmentBuilder,EmbedBuilder} = require('discord.js');
const fs = require('fs');
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const artifact_category = ["flower","wing","clock","cup","crown"];
const artifact_type_category = ["生の花","死の羽","時の砂","空の杯","理の冠"];
const elements_type = [ "炎","水","氷","雷","草","風","岩" ];
const score_target_status_type = ["攻撃","防御","熟知","チャージ","HP"];
exports.Artifacterbranch_condition = async function(interaction,not_interaction,saved_uid){
	if(not_interaction){
		ArtifacterJsonGen(interaction,saved_uid);
	}
	switch(interaction.customId){
		case 'score_target_status':
			var path_name = `./ArtifacterImageGen/user_data_jsons/${interaction.user.id}.json`;
			var user_data_json = JSON.parse(fs.readFileSync(path_name,'utf-8'));
			ArtifacterImageGen(interaction,user_data_json[0].selected_character,interaction.values[0]);
			break;
		case 'select_character':
			ArtifacterImageGen(interaction,interaction.values);
			break;
		case 'show_off':
			show_offed(interaction);
			break;
		case 'input_uid_modal_':
		case 'input_uid_modal_remember':
		case 'input_uid_modal_dont_use':
			var is_remember = false;
			var is_dont_use = false;
			const uid = interaction.fields.getTextInputValue('input_uid');
			if(! uid.match(/^[0-9]{9}$/)){
				interaction.reply({content: 'UIDは半角数字で頼むぜ', ephemeral: true });
				return;
			}
			switch(interaction.customId){
				case 'input_uid_modal_remember':
					is_remember = true;
					break;
				case 'input_uid_modal_dont_use':
					is_dont_use = true;
					break;
			}
			ArtifacterJsonGen(interaction,uid,is_remember,is_dont_use);
			break;
		default:
			return;
			break;
	}
}
function show_offed(interaction){
	const show_off = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('show_off')
				.setLabel('見せびらかす')
				.setStyle(ButtonStyle.Primary)
				.setDisabled(true),
		);
	interaction.update({content: '', ephemeral: true ,components: [interaction.message.components[0],interaction.message.components[1],show_off]});
	interaction.guild.channels.cache.get(interaction.channel.id).send({content: interaction.message.embeds[0].data.image.url});
}
async function ArtifacterImageGen(interaction,selected,score_target_status = "攻撃"){
	var score_target_status_select_list = [];
	for (var i=0;i<=score_target_status_type.length-1;i++){
		score_target_status_select_list[i] = {label: score_target_status_type[i],value: score_target_status_type[i]};
	}
	const score_target_status_slelect = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("score_target_status")
				.setPlaceholder("換算スコア")
				.addOptions(score_target_status_select_list)
		);
	const show_off = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('show_off')
				.setLabel('見せびらかす')
				.setStyle(ButtonStyle.Primary),
		);
	await interaction.update({content: '', ephemeral: true ,components: [interaction.message.components[0],score_target_status_slelect]})
	var path_name = `./ArtifacterImageGen/user_data_jsons/${interaction.user.id}.json`
	var user_data_json = JSON.parse(await fs.readFileSync(path_name,'utf-8'));
	user_data_json[0].selected_character = selected;
	fs.writeFileSync(path_name,JSON.stringify(user_data_json));

	var selected_character_json = user_data_json[1][selected];
	selected_character_json.Score = artifacts_score_calc(selected_character_json.Artifacts,score_target_status);
	selected_character_json.uid = user_data_json[0].tmp_uid;
	var shell_command = `echo '${JSON.stringify(selected_character_json)}'|base64|tr -d '\n'|tee ./ArtifacterImageGen/data.json`
	var input_json =  await exec(shell_command);
	const base64_img = await exec(`python3 ./ArtifacterImageGen/Generater.py "${input_json.stdout}"`,{maxBuffer: 8 * 1024 * 1024 - 1,});
	const date = new Date();
	const file_name = `Artifacter_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
	const sfbuff = new Buffer.from(base64_img.stdout, "base64");
	const file = new AttachmentBuilder(sfbuff, { name: `${file_name}.png` });
	const Embed_content = new EmbedBuilder()
		.setColor(0xCC00FF)
		.setTitle('厳選すなはち永遠なり……')
		.setThumbnail('https://pbs.twimg.com/profile_images/1605047778899812354/GjiKQ9pH_400x400.jpg')
		.setImage(`attachment://${file_name}.png`)
		.setTimestamp()
	await interaction.editReply({ embeds: [Embed_content],files:[file],components: [interaction.message.components[0],score_target_status_slelect,show_off] })
	function artifacts_score_calc(artifacts_Data,score_target_status = "攻撃"){
		var score_sum = [];
		var tmp,tmp_category_name;	
		for (var i=0;i<=artifact_category.length - 1;i++){
			tmp_category_name = artifact_category[i];
			tmp = artifacts_Data[tmp_category_name];
			score_sum[tmp_category_name] = 0.0;
			try{
				score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "会心ダメージ")].value)
			}catch{};
			try{
				score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "会心率")].value,2)
			}catch{};
			switch (score_target_status){
				case "HP":
					try{
						score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "HPパーセンテージ")].value)
					}catch{};
					break;
				case "攻撃":
					try{
						score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "攻撃パーセンテージ")].value)
					}catch{};
					break;
				case "防御":
					try{
						score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "防御パーセンテージ")].value)
					}catch{};
					break;
				case "チャージ":
					try{
						score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "元素チャージ効率")].value)
					}catch{};
					break;
				case "熟知":
					try{
						score_sum[tmp_category_name] += sum_only_num(tmp.sub[tmp.sub.findIndex(option_name => option_name.option === "元素熟知")].value,0.25)
					}catch{};
					break;
			}
		}
		for (var i=0;i<=artifact_category.length-1;i++){
			score_sum[artifact_category[i]] = Math.round(score_sum[artifact_category[i]] * 10) / 10;
		}
		return {
			"State": score_target_status,
			"total": Math.round(Object.keys(score_sum).reduce((sum, value) => sum + score_sum[value], 0)*10)/10,
			"flower": score_sum[artifact_category[0]],
			"wing": score_sum[artifact_category[1]],
			"clock": score_sum[artifact_category[2]],
			"cup": score_sum[artifact_category[3]],
			"crown": score_sum[artifact_category[4]]
		};
	}
	function sum_only_num(input,mutiply = 1.0){
		if(Number.isFinite(Number(input))){
			return Number(input) * mutiply;
		}else{
			return 0;
		}
	}	
}
async function ArtifacterJsonGen(interaction,uid,is_remember = false,is_dont_use = false){
	await interaction.deferReply({ ephemeral: true });
	const { EnkaClient } = require("enka-network-api");
	const enka = new EnkaClient({ showFetchCacheLog: true,cacheDirectory: "./cache",defaultLanguage: "jp"});
	enka.cachedAssetsManager.cacheDirectorySetup();
	var json_path_name = `./ArtifacterImageGen/user_data_jsons/${interaction.user.id}.json`
	var User_Data_json = [{"uid": "","tmp_uid": Number(uid),selected_character: 0}];;
	if(fs.existsSync(json_path_name)){
		var saved_user_uid = JSON.parse(await fs.readFileSync(json_path_name,'utf-8'));
		User_Data_json = [{"uid": Number(saved_user_uid[0].uid),"tmp_uid": Number(uid),selected_character: 0}];
	}else{
		if(is_dont_use){
			User_Data_json = [{"uid": "","tmp_uid": Number(uid),selected_character: 0}];
		}
	}
	if(is_remember){
		User_Data_json = [{"uid": Number(uid),"tmp_uid": Number(uid),selected_character: 0}];
	}
	
	var User_Characters_Data_json = [];
	if(await generate_All_Charactor_JSON() == "error"){
		return;
	}
	User_Data_json[1] = await User_Characters_Data_json;
	fs.writeFileSync(json_path_name, JSON.stringify(User_Data_json));
	var char_list = [];
	for (var i=0;i<=User_Characters_Data_json.length-1;i++){
		char_list[i] = {label: User_Characters_Data_json[i].Character.Name,value: i.toString()};
	}
	const char_select = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("select_character")
				.setPlaceholder("キャラ選択")
				.addOptions(char_list)
		);
	await interaction.followUp({ content: 'キャラクターを選んでください。', components: [char_select]});
	
	async function generate_All_Charactor_JSON(){
		async function communicate_enka(){
			try{
				const user = await enka.fetchUser(uid);
				return user;
			}catch{
				await interaction.followUp({ content: 'enka Networkと上手く通信できませんでした。時間を開けてお試しください。'});
				return "error";
			}
		}
		const user = await communicate_enka();
		const characters = user.characters;
		if (characters.length === 0) {
			console.log("This user has no detailed characters on the profile.");
			await interaction.followUp({ content: '公開しているキャラクターがいません。'});
			return "error";
		}
		for (const char of characters) {
			await User_Characters_Data_json.push(make_character_json(char));
		}
		
		function make_character_json(char){
			var status_tmp = {};
			var tmp;
			const name = char.characterData.name.get();
			const level = char.level;
			const love = char.friendship;
			const constellations = char.unlockedConstellations;
			const talent_level = {
				"NormalAttack": char.skillLevels[0].level.value,
				"ElementalSkill": char.skillLevels[1].level.value,
				"ElementalBurst": char.skillLevels[2].level.value
			};
			const maxLevel = char.maxLevel;
			const char_element = char.characterData.element.name.get().replace('元素','');
			const statsList = char.status.statusProperties.map(stats => {
				status_tmp[stats.type.get()] = percent_convert(stats);
			});
			var user_artifacts_Data = {};
			for (var i=0;i<=char.artifacts.length-1;i++){
				tmp = char.artifacts[i];
				
				user_artifacts_Data[artifact_category[artifact_type_category.indexOf(tmp.artifactData.equipTypeName.get())]] = {
					"type": tmp.artifactData.set.name.get(),
					"Level": tmp.level - 1,
					"rarelity": tmp.artifactData.stars,
					"main": {
						"option": percent_convert(tmp.mainstat,1),
						"value": percent_convert(tmp.mainstat)
					},
					"sub": make_substats(tmp)
				};
			}
			//console.log(char.artifacts[4].artifactData.equipTypeName.get())
			const user_weapon_Data = {
				"name": char.weapon.weaponData.name.get(),
				"Level": char.weapon.level,
				"totu": undefined_and_null_to_0(char.weapon.refinement.level),
				"rarelity": char.weapon.weaponData.stars,
				"BaseATK": char.weapon.weaponStats[0].value,
				"Sub": {
					"name": percent_convert(char.weapon.weaponStats[1],1),
					"value": percent_convert(char.weapon.weaponStats[1]),
				}
			};
			
			status_json = {
				"input": "",
				"Character": {
					"Name": name,
					"Const": constellations.length,
					"Level": level,
					"Love": love,
					"Status": {
						"HP": status_tmp["HP上限"],
						"攻撃力": status_tmp["攻撃力"],
						"防御力": status_tmp["防御力"],
						"元素熟知": status_tmp["元素熟知"],
						"会心率": status_tmp["会心率"],
						"会心ダメージ": status_tmp["会心ダメージ"],
						"元素チャージ効率": status_tmp["元素チャージ効率"],
						"元素熟知": status_tmp["元素熟知"],
						[which_damage_is_highest()] : status_tmp[which_damage_is_highest()]
					},
					"Talent": {
						"通常": talent_level.NormalAttack,
						"スキル": talent_level.ElementalSkill,
						"爆発": talent_level.ElementalBurst
					},
					"Base": {
						"HP": status_tmp["基礎HP"],
						"攻撃力": status_tmp["基礎攻撃力"],
						"防御力": status_tmp["防御力"]
					}
				},
				"Weapon": user_weapon_Data,
				"Artifacts": user_artifacts_Data,
				"元素": char_element
			};
			//console.log(JSON.stringify(status_json))
			//console.log(user_artifacts_Data[artifact_category[0]].sub.findIndex(option_name => option_name.option === "会心ダメージ"))
			function make_substats(substatses){
				var tmp_sub_option = [];
				var option_name
				for (var j=0;j<=substatses.substats.total.length-1;j++){
					tmp_sub_option.push({ option: percent_convert(substatses.substats.total[j],1) , value: Math.round(percent_convert(substatses.substats.total[j]) * 10)/10})
				}
				return tmp_sub_option;
			}
			function which_damage_is_highest(){
				var arr = [{name:"物理ダメージ",value: status_tmp["物理ダメージ"]}];
				for(var i=1;i<=elements_type.length;i++){
					arr[i] = {name: `${elements_type[i-1]}元素ダメージ`,value: status_tmp[`${elements_type[i-1]}元素ダメージ`]};
				}
				if (arr.every(v => v.value === arr[0].value)) {
					return status_tmp[`${char_element}元素ダメージ`]
				}else{
					return arr.reduce((a,b)=>a.value>b.value?a:b).name;
				}
			}
			return status_json;
		}
		function percent_convert(status_origin,is_name){
			if (is_name == 1){
				const might_chage_name =  ["攻撃力","防御力","HP"];
				if (might_chage_name.includes(status_origin.type.get()) && status_origin.isPercent == true){
					return `${status_origin.type.get().replace("力","")}パーセンテージ`;
				}else{
					return status_origin.type.get();
				}
			}else{
				const value_ = status_origin.value * (status_origin.isPercent ? 100 : 1);
				const fixed_ = status_origin.isPercent ? 1 : 0;
				return Number(value_.toFixed(fixed_));
			}
		}
		
	}

	function undefined_and_null_to_0(input_num){
		if (input_num === null || input_num === undefined){
			return 0;
		}else{
			return Number(input_num);
		}
	}
}