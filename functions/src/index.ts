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

const APP_NAME = "New Cubes Notifications";

const sendEmail = async (
  emails: string[],
  text: string,
  subject: string = "New Cube"
): Promise<void> => {
  try {
    const mailOptions = {
      from: `${APP_NAME} <${gmailEmail}>`,
      bcc: emails,
      subject: subject,
      text: text,
    };
    await mailTransport.sendMail(mailOptions);
    console.log("New cube email sent to:", emails);
  } catch (e) {}
};

const getEmailsAdresses = async (): Promise<string[]> => {
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
    if (data) {
      return sendEmail(emails, JSON.stringify(data), data.name);
    }
  });

const getCubes = async (): Promise<Cube[]> => {
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

const sanitizeDocName = (name: string): string => {
  return name.replace(/\//g, "\\");
};

const cubesHandler = async (): Promise<Cube[]> => {
  try {
    console.log("Trying to get cubes");
    const cubes = await getCubes();
    const cubesCollection = db.collection("cubes");
    console.log(cubes);
    for (const cube of cubes) {
      const doc = cubesCollection.doc(sanitizeDocName(cube.toString()));
      const getDoc = await doc.get();
      if (getDoc.exists) {
        await doc.withConverter(cubeConverter).update(cube);
      } else {
        await doc.withConverter(cubeConverter).set(cube);
      }
    }
    return cubes;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const cubeTest = functions.https.onRequest(
  async (req, res): Promise<void> => {
    const cubes = await cubesHandler();
    res.send(cubes);
  }
);

export const scheduledFunctionPlainEnglish = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(
    async (): Promise<void> => {
      await cubesHandler();
    }
  );
