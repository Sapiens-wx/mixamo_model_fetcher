
export async function products({page=1, type='', query=''}){
    query=encodeURIComponent(query);
	const res = await fetch(`https://www.mixamo.com/api/v1/products?page=${page}&limit=100&order=&type=${type}&query=${query}`, {
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

export async function all_products({type='', query=''}){
	let numPages=undefined;
	let res=[];
	for(let i=1; numPages===undefined || i<=numPages; ++i){
		const page=await products({type, query, page: i});
		if(numPages===undefined)
			numPages=page.pagination.num_pages;
		res.push(...page.results);
		process.stdout.write(`\r[STATUS] get product status: ${i}/${numPages}`)
	}
    process.stdout.write('\n');
	return res;
}