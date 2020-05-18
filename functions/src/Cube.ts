import { firestore } from "firebase-admin";

export class Cube {
  constructor(
    readonly name: string,
    readonly price: string,
    readonly link: string
  ) {}

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
