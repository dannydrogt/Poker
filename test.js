let def = {
	admin: false,
	name: 'test',
	money: 500
};

let provided = {
	admin: true,
	extra: 1,
	money: 1100
};

let opts = {...def, ...provided};
console.log(opts);

opts = Object.assign(def, provided);
console.log(opts)