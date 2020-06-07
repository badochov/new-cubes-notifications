"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledFunctionPlainEnglish = exports.cubeTest = exports.sendEmailOnCreation = void 0;
const functions = require("firebase-functions");
const nodemailer_1 = require("nodemailer");
const $ = require("cheerio");
const Cube_1 = require("./Cube");
const admin = require("firebase-admin");
const node_fetch_1 = require("node-fetch");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer_1.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});
const APP_NAME = 'New Cubes Notifications';
const sendEmail = async (emails, text, subject = 'New Cube') => {
    try {
        const mailOptions = {
            from: `${APP_NAME} <${gmailEmail}>`,
            bcc: emails,
            subject: subject,
            text: text,
        };
        await mailTransport.sendMail(mailOptions);
        console.log('New cube email sent to:', emails);
    }
    catch (e) { }
};
const getEmailsAdresses = async () => {
    const emails = [];
    const emailColl = await db.collection('mails').get();
    emailColl.forEach((doc) => {
        emails.push(doc.data().mail);
    });
    return emails;
};
exports.sendEmailOnCreation = functions.firestore
    .document('cubes/{cubeid}')
    .onCreate(async (snap, _) => {
    const emails = await getEmailsAdresses();
    const data = snap.data();
    if (data) {
        return sendEmail(emails, JSON.stringify(data), data.name);
    }
});
const getCubes = async () => {
    try {
        const site = await node_fetch_1.default('http://www.ziicube.com/');
        const html = await site.text();
        const cubesCheerioObjs = $('.txt', html);
        const cubes = [];
        cubesCheerioObjs.each((_, cube) => {
            const price = $('.price', cube)[0].firstChild.data;
            const namePart = cube.children[3].children[0];
            const link = namePart.attribs.href;
            const name = namePart.firstChild.data;
            if (price !== undefined && name !== undefined && link !== undefined) {
                cubes.push(new Cube_1.Cube(name, price, link));
            }
        });
        return cubes;
    }
    catch (e) {
        console.error(e);
        return [];
    }
};
const sanitizeDocName = (name) => {
    return name.replace(/\//g, '\\');
};
const cubesHandler = async () => {
    try {
        console.log('Trying to get cubes');
        const cubes = await getCubes();
        const cubesCollection = db.collection('cubes');
        console.log(cubes);
        for (const cube of cubes) {
            const doc = cubesCollection.doc(sanitizeDocName(cube.toString()));
            const getDoc = await doc.get();
            if (getDoc.exists) {
                await doc.withConverter(Cube_1.cubeConverter).update(cube);
            }
            else {
                await doc.withConverter(Cube_1.cubeConverter).set(cube);
            }
        }
        return cubes;
    }
    catch (e) {
        console.error(e);
        return [];
    }
};
exports.cubeTest = functions.https.onRequest(async (req, res) => {
    const cubes = await cubesHandler();
    res.send(cubes);
});
exports.scheduledFunctionPlainEnglish = functions.pubsub
    .schedule('every 30 minutes')
    .onRun(async (context) => {
    await cubesHandler();
});
//# sourceMappingURL=index.js.map