const admin = require("firebase-admin");

const serviceAccount = require("../../rigrescue-b18c8-firebase-adminsdk-fbsvc-de7ecee509.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
