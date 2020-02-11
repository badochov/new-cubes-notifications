export class Cube {
	constructor(
		readonly name: string,
		readonly price: string,
		readonly link: string
	) {}

	toString() {
		return name;
	}
}

export const cubeConverter = {
	toFirestore: (cube: Cube) => {
		return {
			name: cube.name,
			price: cube.price,
			link: cube.link,
		};
	},
	fromFirestore: (snapshot: any, options: any) => {
		const data = snapshot.data(options);
		return new Cube(data.name, data.price, data.link);
	},
};
