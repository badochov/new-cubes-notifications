import type {firestore} from 'firebase-admin'; // eslint-disable-line

/**
 * Helper class for getting and setting cube data.
 */
export class Cube {
  /**
   *
   * @param {string} name  cube name
   * @param {string} price  cube price
   * @param {string} link  link to the cube
   */
  constructor(
    readonly name: string,
    readonly price: string,
    readonly link: string,
  ) {}
  /**
    * @return {string} identificator
    */
  toString(): string {
    return this.link;
  }
}

export const cubeConverter = {
  toFirestore: (cube: Cube): firestore.DocumentData => {
    return {
      name: cube.name,
      price: cube.price,
      link: cube.link,
    };
  },
  fromFirestore: (snapshot: firestore.QueryDocumentSnapshot): Cube => {
    const data = snapshot.data();
    return new Cube(data.name, data.price, data.link);
  },
};
