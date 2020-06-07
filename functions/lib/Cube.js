"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cubeConverter = exports.Cube = void 0;
/**
 * Helper class for getting and setting cube data.
 */
class Cube {
    /**
     *
     * @param {string} name  cube name
     * @param {string} price  cube price
     * @param {string} link  link to the cube
     */
    constructor(name, price, link) {
        this.name = name;
        this.price = price;
        this.link = link;
    }
    /**
      * @return {string} identificator
      */
    toString() {
        return this.link;
    }
}
exports.Cube = Cube;
exports.cubeConverter = {
    toFirestore: (cube) => {
        return {
            name: cube.name,
            price: cube.price,
            link: cube.link,
        };
    },
    fromFirestore: (snapshot) => {
        const data = snapshot.data();
        return new Cube(data.name, data.price, data.link);
    },
};
//# sourceMappingURL=Cube.js.map