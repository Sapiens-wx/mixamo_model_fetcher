import './config.mjs';
import fs from 'fs';
import { Command } from 'commander';
import path from 'path';
import * as motion from './get_motion.mjs';
import * as model from './get_model.mjs';

const program = new Command();
let args={};

program
    .argument('<type>', `- character\n- animation\n- search [characters...] returns the id of the given character name`)
	.argument('[misc...]', 'for search, it\'s the file names')
	.action((type, misc)=>{
		args.type=type;
		args.misc=misc;
	})
	.option('-o, --out <directory>', 'output directory', './results')
	.option('-d, --dry-run', 'do I actually download the files?', false)
	.option('-c, --characters <ids...>', 'SEARCH: the ids of the character to download', [])
	.option('--start <start index>', 'determines the start index of the data to be downloaded', '0')
	.option('--count <count>', 'determines the count of the data to be downloaded', '-1')

program.parse();

const options=program.opts();

// ===== validate argument and opts=====
if(args.type.toLowerCase().includes('char'))
	args.type='character';
else if(args.type.toLowerCase().includes('anim'))
	args.type='animation';

// ensure output directory
const dir_err=ensureDir(options.out);
if(dir_err){
	console.log("[ERROR] invalid output dir:", dir_err);
	process.exit();
}
// range
options.start=+options.start;
options.count=+options.count;

// filter out log messages for the input characters (if the input starts with '[', then it's a log message and should be ignored)
if(options.characters){
	options.characters=options.characters.filter(ele=>/[\w\d]/.test(ele[0])).map(ele=>ele.replace(/\r/g,''));
}
// =====================================

if(args.type==='character'){
	model.download_all_models(options);
} else if(args.type==='animation'){ // animation
	if(options.characters.length>0){
		const numCharacters=options.characters.length;
		const rootDir=options.out;
		for(let i=0;i<numCharacters;++i){
			console.log(`[STATUS] character ${i}/${numCharacters} ${options.characters[i]}`);
			// pack character animations into different directories to avoid a lot of files in a single directory
			options.out=path.join(rootDir, options.characters[i].substring(0,2));
			ensureDir(options.out);
			const res = await motion.download_all_motions(options, options.characters[i]);
		}
	} else{
		motion.download_all_motions(options);
	}
} else if(args.type==='search'){ // search
	motion.get_character(args, options);
}

function ensureDir(path) {
  if (!fs.existsSync(path)) {
	try{
      fs.mkdirSync(path, { recursive: true });
	} catch(err){
		return err;
	}
  }
}
