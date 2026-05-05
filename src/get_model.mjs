import './config.mjs';
import fs from 'fs';
import https from 'https';
import path from 'path';

let programOptions=undefined;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// the directory to download the models
export async function download_all_models(options){
	programOptions=options;
	const models=await get_all_model_id();
    const startIdx=options.start;
    const endIdx=options.count==-1?models.length:Math.min(models.length, options.count);
	for(let i=startIdx; i<endIdx; ++i){
		const model=models[i];
        console.log(`[STATUS] character ${i}/${endIdx}`);
		const res=await download_model(model, {dir: options.out});
	}
}

// returns {
// 	   pagination: {num_pages: int},
// 	   results: [{id: String, name: String}],
// }
async function get_model_id_by_page(page, type='Character'){
	const res = await fetch(`https://www.mixamo.com/api/v1/products?page=${page}&limit=48&order=&type=${type}&query=`, {
		"headers": {
			"Authorization":process.env.AUTHKEY,
			"X-Api-Key": "mixamo2"
		},
		"referrer": "https://www.mixamo.com/",
		"body": null,
		"method": "GET",
		"mode": "cors",
		"credentials": "omit"
	});
	const body=await res.json();
	return body;
}

async function get_all_model_id(){
	let numPages=undefined;
	let models=[];
	for(let i=1; numPages===undefined || i<=numPages; ++i){
		const page=await get_model_id_by_page(i);
		if(numPages===undefined)
			numPages=page.pagination.num_pages;
		models.push(...page.results);
	}
	return models;
}

// ===== Download a single model =====

// model: {name: String, id: String}
async function download_model(model, {format='fbx7_2019', mesh='t-pose', dir='.'}){
	console.log('[STEP] exporting', model.name);
	const export_res=await step_export(model.id, format, mesh);
	console.log(`[STEP] waiting for export ${model.name} to finish`);
	const download_url=await step_monitor(model.id);
	console.log(`[STEP] downloading ${model.name}`);
	const safeName = model.name.replace(/[\/\s]/g, '_');
	const download_res=step_download(download_url, path.join(dir, `${safeName}.fbx`));
}

async function step_export(characterId, format='fbx7_2019', mesh='t-pose'){
	let body;
	do{
		const res = await fetch("https://www.mixamo.com/api/v1/animations/export", {
			"headers": {
			"authorization":process.env.AUTHKEY,
			"content-type": "application/json; charset=UTF-8",
			"x-api-key": "mixamo2",
			},
			"body": JSON.stringify({
			character_id: characterId,
			gms_hash: null,
			preferences: {format, mesh},
			product_name: "Default Character",
			type: "Character"
			}),
			"method": "POST",
		});
		body=await res.json();
		if(body.message!=='Too many requests')
			break;
		sleep(1000);
	} while(body.message==='Too many requests')
	if(body.status===undefined){
		console.log(`[ERROR] fetching model. Message: ${body.message}`);
		process.exit();
	}
	console.log(`[STATUS] export status: ${body.status}, msg: ${body.message}`);
	return body;
}

async function step_monitor(characterId){
	let body;
	let count=0;
	do{
		const res=await fetch(`https://www.mixamo.com/api/v1/characters/${characterId}/monitor`, {
			"headers": {
				"authorization":process.env.AUTHKEY,
				"content-type": "application/json; charset=UTF-8",
				"x-api-key": "mixamo2",
			}
		});
		body=await res.json();
		if(body.status===undefined){
			console.log(`[ERROR] error monitor status. Message: ${body.message}`);
			process.exit();
		}
		process.stdout.write(`\r[STATUS] monitor status: ${body.status}, msg: ${body.message} ${count}s`)
		count++;
		const sleep_res=await sleep(1000);
	} while(body.status!=='completed');
	process.stdout.write('\n');
	return body.job_result;
}

async function step_download(url, path){
	if(programOptions.dryRun) return;
	const file = fs.createWriteStream(path);
	const options = {
        headers: {
			"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
			"accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"sec-ch-ua": "\"Microsoft Edge\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": "\"Windows\"",
			"sec-fetch-dest": "document",
			"sec-fetch-mode": "navigate",
			"sec-fetch-site": "cross-site",
			"sec-fetch-user": "?1",
			"upgrade-insecure-requests": "1"
		}
	};
	https.get(url, options, (res) => {
		res.pipe(file);

		file.on("finish", () => {
			file.close();
			console.log("[SUCCESS] Download completed:", path);
		});
	});
}
