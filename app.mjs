import './config.mjs';
import {download_all} from './get_model.mjs';
import fs from 'fs';

function ensureDir(path) {
  if (!fs.existsSync(path)) {
	try{
      fs.mkdirSync(path, { recursive: true });
	} catch(err){
		return err;
	}
  }
}

if(process.argv.length<3)
	download_all();
else{
	const dir=process.argv[2];
	const err=ensureDir(dir);
	if(err)
		console.log(err);
	else
		download_all(dir);
}
