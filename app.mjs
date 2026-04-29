import './config.mjs';
import fs from 'fs';
import { Command } from 'commander';
import * as motion from './get_motion.mjs';
import * as model from './get_model.mjs';

const program = new Command();

program
    .argument('<type>', 'character or animation')
	.option('-o, --out <directory>', 'output directory', './results')
	.option('-d, --dry-run', 'do I actually download the files?', false)
	.option('--start <start index>', 'determines the start index of the data to be downloaded', '0')
	.option('--count <count>', 'determines the count of the data to be downloaded', '-1')

program.parse();

const options=program.opts();

// ===== validate argument and opts=====
if(program.args[0].toLowerCase().includes('char'))
	program.args[0]='character';
else if(program.args[0].toLowerCase().includes('anim'))
	program.args[0]='animation';
else{
	console.log("[ERROR] invalid argument:", program.args[0]);
	process.exit();
}

// ensure output directory
const dir_err=ensureDir(options.out);
if(dir_err){
	console.log("[ERROR] invalid output dir:", dir_err);
	process.exit();
}
// range
options.start=+options.start;
options.count=+options.count;
// =====================================

if(program.args[0]==='character'){
	model.download_all_models(options);
} else{
	motion.download_all_motions(options);
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
