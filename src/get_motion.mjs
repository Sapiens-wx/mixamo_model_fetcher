import './config.mjs';
import path from 'path';
import fs from 'fs';
import https from 'https';

let programOptions=undefined;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function download_all_motions(options){
    programOptions=options;
    const motions=await get_all_motions();
    const startIdx=options.start;
    const endIdx=options.count==-1?motions.length:Math.min(motions.length, startIdx+options.count);
    for(let i=startIdx;i<endIdx;++i){
        const m=motions[i];
        console.log(`[STATUS] motion ${i}/${endIdx}`);
        const res=await download_motion(m, "f7b85d05-5f1c-47d8-9770-9a1a054bd6f6", {dir:options.out});
    }
}

// returns an array of the following object
// {
//   id: 'c9c68950-b96c-11e4-a802-0aaa78deedf9',
//   type: 'Motion',
//   description: 'Reaction To Getting Clipped While Walking Unaware',
//   category: '',
//   character_type: 'human',
//   name: 'Shoved Reaction With Spin',
//   thumbnail: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/102450901/static.png',
//   thumbnail_animated: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/102450901/animated.gif',
//   motion_id: 'c9c68950-b96c-11e4-a802-0aaa78deedf9',
//   motions: null,
//   source: 'system'
// }
async function get_all_motions({type='Motion%2CMotionPack'}={}){
    async function get_motion_by_page(page, type){
        const res = await fetch(`https://www.mixamo.com/api/v1/products?page=${page}&limit=100&order=&type=${type}&query=`, {
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
	let motions=[];
    // get the pagination info
    const firstPage=await get_motion_by_page(1, type);
    const numPages=firstPage.pagination.num_pages;
    motions.push(...firstPage.results);
    // get all pages
    let pages=[];
	for(let i=2; i<=numPages; ++i){
        pages.push(get_motion_by_page(i, type));
	}
    for(let i=2;i<=numPages;++i){
		const page=await pages[i];
        if(page===undefined) continue;
		motions.push(...page.results);
    }
	return motions;
}

// ===== Download a single model =====

// model: {name: String, id: String}
// returns: true if success, false if fails
async function download_motion(motion, characterId, {format='fbx7_2019', dir='./tmp', fps="30", reducekf="0", skin="true"}={}){
	console.log('[STEP] exporting', motion.name);
	const export_res=await step_export(motion, characterId, {format, fps, reducekf, skin});
    if(export_res.err){
        console.log(`[WARNING] fail to download ${motion.name}: ${export_res.err}`);
        return false;
    }
	console.log(`[STEP] waiting for export ${motion.name} to finish`);
	const download_url=await step_monitor(characterId);
    if(download_url){
        console.log(`[STEP] downloading ${motion.name}`);
        let suffix=motion.type==='Motion'?'fbx':'zip';
        const safeName = motion.name.replace(/[\/\s]/g, '_');
        const download_res=step_download(download_url, path.join(dir, `${safeName}.${suffix}`));
        return true;
    }
    return false;
}

// supports motion and motion pack.
// if type==motion, then returns the gms_hash as a single-element array
// else, returns an array of gms_hash
async function getGmsHash(motion, characterId){
    const res=await fetch(`https://www.mixamo.com/api/v1/products/${motion.id}?similar=0&character_id=${characterId}`,{
        "headers": {
        "authorization":process.env.AUTHKEY,
        "x-api-key": "mixamo2",
        }
    });
    const jsonBody=await res.json();
    function preprocessGmsHash(gms_hash){
        gms_hash.params=gms_hash.params.map(p=>p[1]).join(',');
        return gms_hash;
    }
    if(motion.type==='Motion'){
        let gms_hash = jsonBody.details.gms_hash;
        return [preprocessGmsHash(gms_hash)];
    } else{
        let gms_hash_array = jsonBody.details.motions.map(m=>{
            let gms_hash=m.gms_hash;
            gms_hash.name=m.name;
            gms_hash.overdrive=0;
            gms_hash=preprocessGmsHash(gms_hash);
            return gms_hash;
        });
        return gms_hash_array;
    }
}

// motion is the obj from the returned array of get_all_motions
async function step_export(motion, characterId, {format="fbx7_2019", fps="30", reducekf="0", skin="true"}={}){
    function getMotionId(motion){
        return motion.thumbnail.match(/motions\/(\d+)/)?.[1];
    }
    function createGmsHashElement(motion){
        const model_id = getMotionId(motion);
        return {
            "arm-space" : 0,
            inplace : false,
            mirror : false,
            "model-id" : +model_id,
            overdrive : 0,
            params : "0,0",
            trim : [0, 100]
        };
    }
	let body;
    let reqBody={
        character_id: characterId,
        gms_hash: await getGmsHash(motion, characterId),
        preferences: {
            format : "fbx7_2019",
            fps : "30",
            reducekf : "0",
            skin : "true"
        },
        product_name: motion.name,
        type: motion.type
    };
    if(motion.type==='MotionPack'){
        reqBody.preferences.mesh_motionpack='t-pose';
    }
    reqBody=JSON.stringify(reqBody);
	do{
		const res = await fetch("https://www.mixamo.com/api/v1/animations/export", {
			"headers": {
			"authorization":process.env.AUTHKEY,
			"content-type": "application/json; charset=UTF-8",
			"x-api-key": "mixamo2",
			},
			"body": reqBody,
			"method": "POST",
		});
		body=await res.json();
		if(body.message!=='Too many requests')
			break;
		sleep(1000);
	} while(true)
	if(body.status===undefined){
		console.log(`[ERROR] fetching motion. Message: ${body.message}`);
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
			console.log(`\n[ERROR] error monitor status. Message: ${body.message}`);
            return undefined;
		} else if(body.status==='failed'){
            console.log(`\n[ERROR] monitor status: ${body.status}, msg: ${body.message}`);
            return undefined;
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