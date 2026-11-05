/**
 * Script to check all blogs and their slugs
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config({ path: '.env.local' });

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkBlogs() {
  try {
    console.log('🔍 Checking all blogs...\n');

    const snapshot = await db.collection('blogs').get();

    console.log(`📝 Found ${snapshot.size} blogs:\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Slug: ${data.slug || 'NO SLUG'}`);
      console.log(`Title: ${data.title}`);
      console.log(`Status: ${data.status}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBlogs();
