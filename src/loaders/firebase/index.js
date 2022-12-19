const { credential } = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getAuth } = require('firebase-admin/auth');
const { default: Container } = require('typedi');

const serviceAccount = require('../../../google-application-credentials.json');

module.exports = function firebaseLoader() {
  const app = initializeApp({
    credential: credential.cert(serviceAccount),
  });
  const firestore = getFirestore();
  const storage = getStorage();
  const auth = getAuth();

  Container.set('fbApp', app);
  Container.set('fbDb', firestore);
  Container.set('fbStorage', storage);
  Container.set('fbAuth', auth);

  const docRef = firestore.collection('users');
  docRef.add({
    first: 'Ada',
    last: 'Lovelace',
    born: 1815,
  });

  console.log('Firebase initialized');
};
