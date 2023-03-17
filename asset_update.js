const fs = require('fs');
const { EnkaClient } = require("enka-network-api");
const enka = new EnkaClient({ showFetchCacheLog: true,cacheDirectory: "./cache",defaultLanguage: "jp"});
enka.cachedAssetsManager.cacheDirectorySetup();
enka.cachedAssetsManager.fetchAllContents();
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
var error_files = []
async function weapon_pic_download(){
	const weapons = enka.getAllWeapons();
	weapons.map(async w => {
		var name = w.name.get();
		if (!fs.existsSync(`./ArtifacterImageGen/weapon/${name}.png`)){
			var pic_url = w.awakenIcon.url;
			const res = await dowmload(pic_url,`./ArtifacterImageGen/weapon/${name}.png`)
		}else{
			console.log(`exist: ${name}`)
		}
	})
}
async function download_charactor_image(){
	const characters = enka.getAllCharacters();
	characters.map(async w => {
		var name = w.name.get();
		if (!fs.existsSync(`./ArtifacterImageGen/character/${name}/avatar.png`)){
			var pic_url = w.splashImage.url;
			await dowmload(pic_url,`./ArtifacterImageGen/character/${name}/avatar.png`)
			for (i=0;i<=w.constellations.length-1;i++){
				await dowmload(w.constellations[i].icon.url,`./ArtifacterImageGen/character/${name}/${i}.png`)
			}
			await dowmload(w.skills[0].icon.url,`./ArtifacterImageGen/character/${name}/通常.png`)
			await dowmload(w.skills[1].icon.url,`./ArtifacterImageGen/character/${name}/スキル.png`)
			await dowmload(w.skills[2].icon.url,`./ArtifacterImageGen/character/${name}/爆発.png`)
			
		}else{
			console.log(`exist: ${name}`)
		}
		return
	})
}
async function artifacts_pic_download(){
	const artifact_category = ["flower","wing","clock","cup","crown"];
	const artifact_type_category = ["生の花","死の羽","時の砂","空の杯","理の冠"];
	const artifacts = enka.getAllArtifacts();
	artifacts.map(async w => {
		var name = w.set.name.get();
		if (!fs.existsSync(`./ArtifacterImageGen/Artifact/${name}/${artifact_category[artifact_type_category.indexOf(w.equipTypeName.get())]}.png`)){
			const res = await dowmload(w.icon.url,`./ArtifacterImageGen/Artifact/${name}/${artifact_category[artifact_type_category.indexOf(w.equipTypeName.get())]}.png`)
		}else{
			console.log(`exist: ${name}`)
		}
	})
}
async function dowmload(url,outFile){
	console.log(outFile.replace(/[a-z|\.]*$/,''))
	await exec(`mkdir -p ${outFile.replace(/[a-z|\.]*$/,'')}`);
	await exec(`curl -Lo ${outFile} "${url}"`);
	var file_size = await exec(`cat "${outFile}" | wc -c`)
	if ( Number(file_size.stdout) < 1886){
		console.log(`bad data: ${outFile}`)
		await exec(`rm -f "${outFile}"`);
		error_files.push({name:outFile,url:url})
	}
	console.log(`download: ${outFile}\nurl: ${url}`)
};
async function main(){
	await weapon_pic_download();
	await download_charactor_image();
	artifacts_pic_download();
}
main().then(console.log(error_files));