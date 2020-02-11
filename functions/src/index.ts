import * as functions from "firebase-functions";
import { createTransport } from "nodemailer";
import * as $ from "cheerio";
import * as rp from "request-promise";
import { Cube, cubeConverter } from "./Cube";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = createTransport({
	service: "gmail",
	auth: {
		user: gmailEmail,
		pass: gmailPassword,
	},
});

const APP_NAME = "New Cubes";

const sendEmail = async (emails: string[], text = "test") => {
	try {
		const mailOptions = {
			from: `${APP_NAME} <${gmailEmail}>`,
			bcc: emails,
			subject: "New Cube",
			text: text,
		};
		await mailTransport.sendMail(mailOptions);
		console.log("New cube email sent to:", emails);
		return null;
	} catch (e) {
		return e;
	}
};

const getEmailsAdresses = async () => {
	const emails: string[] = [];
	const emailColl = await db.collection("mails").get();
	emailColl.forEach((doc: any) => {
		emails.push(doc.data().mail);
	});
	return emails;
};

export const sendEmailOnCreation = functions.firestore
	.document("cubes/{cubeid}")
	.onCreate(async (snap, _) => {
		const emails = await getEmailsAdresses();
		const data = snap.data();

		return sendEmail(emails, JSON.stringify(data));
	});

const getCubes = async () => {
	const html = await rp("http://www.ziicube.com/");
	const cubesCheerioObjs = $(".txt", html);
	const cubes: Cube[] = [];
	cubesCheerioObjs.each((_, cube) => {
		const price = $(".price", cube)[0].firstChild.data;
		const namePart = cube.children[3].children[0];
		const link = namePart.attribs.href;
		const name = namePart.firstChild.data;
		if (price !== undefined && name !== undefined && link !== undefined) {
			cubes.push(new Cube(name, price, link));
		}
	});

	return cubes;
};

const sanitizeDocName = (name: string) => {
	return name.replace(/\//g, "\\");
};

const cubesHandler = async () => {
	try {
		console.log("Trying to get cubes");
		const cubes = await getCubes();
		const cubesCollection = db.collection("cubes");
		console.log(cubes);
		for (const cube of cubes) {
			const doc = cubesCollection.doc(sanitizeDocName(cube.name));
			const getDoc = await doc.get();
			if (getDoc.exists) {
				// mby compare other data like link and price
			} else {
				//@ts-ignore
				await doc.withConverter(cubeConverter).set(cube);
			}
		}
		return [cubes];
	} catch (e) {
		console.error(e);
		return [e];
	}
};

export const cubeTest = functions.https.onRequest(async (req, res) => {
	const cubes = await cubesHandler();
	res.send(cubes);
});

export const scheduledFunctionPlainEnglish = functions.pubsub
	.schedule("every 5 minutes")
	.onRun(async context => {
		await cubesHandler();
	});
