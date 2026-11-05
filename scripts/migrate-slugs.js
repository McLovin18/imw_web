/**
 * Migration script to add slugs to existing products and blogs in Firestore
 * Run with: node scripts/migrate-slugs.js
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Convert a string to a URL-friendly slug
 */
function generateSlug(text) {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate a unique slug by checking against existing slugs
 */
function generateUniqueSlug(baseSlug, existingSlugs = new Set()) {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Migrate products to add slugs
 */
async function migrateProducts() {
  console.log('🔄 Starting product migration...');

  const snapshot = await db.collection('productos').get();

  const existingSlugs = new Set();
  const products = [];

  // First pass: collect existing slugs and products without slugs
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.slug) {
      existingSlugs.add(data.slug);
    }
    products.push({ id: doc.id, ...data });
  });

  console.log(`📦 Found ${products.length} products`);
  console.log(`✅ ${existingSlugs.size} products already have slugs`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    if (product.slug) {
      skipped++;
      continue;
    }

    const baseSlug = generateSlug(product.nombre || product.id);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    try {
      await db.collection('productos').doc(product.id).update({
        slug: uniqueSlug,
      });
      existingSlugs.add(uniqueSlug);
      updated++;
      console.log(`✅ Updated product "${product.nombre}" -> slug: ${uniqueSlug}`);
    } catch (error) {
      console.error(`❌ Error updating product ${product.id}:`, error.message);
    }
  }

  console.log(`\n📊 Product migration complete:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
}

/**
 * Migrate blogs to add slugs
 */
async function migrateBlogs() {
  console.log('\n🔄 Starting blog migration...');

  const snapshot = await db.collection('blogs').get();

  const existingSlugs = new Set();
  const blogs = [];

  // First pass: collect existing slugs and blogs without slugs
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.slug) {
      existingSlugs.add(data.slug);
    }
    blogs.push({ id: doc.id, ...data });
  });

  console.log(`📝 Found ${blogs.length} blogs`);
  console.log(`✅ ${existingSlugs.size} blogs already have slugs`);

  let updated = 0;
  let skipped = 0;

  for (const blog of blogs) {
    if (blog.slug) {
      skipped++;
      continue;
    }

    const baseSlug = generateSlug(blog.title || blog.id);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    try {
      await db.collection('blogs').doc(blog.id).update({
        slug: uniqueSlug,
      });
      existingSlugs.add(uniqueSlug);
      updated++;
      console.log(`✅ Updated blog "${blog.title}" -> slug: ${uniqueSlug}`);
    } catch (error) {
      console.error(`❌ Error updating blog ${blog.id}:`, error.message);
    }
  }

  console.log(`\n📊 Blog migration complete:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting slug migration...\n');

    await migrateProducts();
    await migrateBlogs();

    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
