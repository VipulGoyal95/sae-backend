// firestore.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Load service account key
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();