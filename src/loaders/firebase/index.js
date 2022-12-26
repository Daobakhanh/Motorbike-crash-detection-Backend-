const { credential } = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getAuth } = require('firebase-admin/auth');
const { default: Container } = require('typedi');

const serviceAccount = require('../../../google-application-credentials.json');
const { DI_KEYS } = require('../../commons/constants');

module.exports = function firebaseLoader() {
  const app = initializeApp({
    credential: credential.cert(serviceAccount),
    storageBucket: 'gs://motorbike-crash-detection.appspot.com',
  });
  const firestore = getFirestore();
  const storage = getStorage();
  const auth = getAuth();

  Container.set(DI_KEYS.FB_APP, app);
  Container.set(DI_KEYS.FB_DB, firestore);
  Container.set(DI_KEYS.FB_STORAGE, storage);
  Container.set(DI_KEYS.FB_AUTH, auth);

  console.log('Firebase initialized');
};
