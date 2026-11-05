import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  limit,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Blog } from "./blog-types";
import { generateSlug } from "./slug-utils";

const COLLECTION = "blogs";

export async function getAllBlogsAdmin(): Promise<Blog[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), limit(50)));
  const blogs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Blog[];
  return blogs.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
}

export async function getPublishedBlogs(): Promise<Blog[]> {
  const q = query(
    collection(db, COLLECTION),
    where("status", "==", "published")
  );
  const snap = await getDocs(q);
  const blogs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Blog[];
  return blogs.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
}

export async function getBlogById(id: string): Promise<Blog | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as Blog;
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    // Check localStorage cache first
    if (typeof window !== 'undefined') {
      const cacheKey = `blog:${slug}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache por 5 minutos
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data as Blog;
        }
      }
    }

    const res = await fetch(`/api/blog?slug=${slug}`, {
      cache: 'force-cache',
    });
    if (!res.ok) {
      return null;
    }
    const blog = await res.json();

    // Cache en localStorage
    if (typeof window !== 'undefined' && blog) {
      const cacheKey = `blog:${slug}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: blog,
        timestamp: Date.now(),
      }));
    }

    return blog as Blog;
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    return null;
  }
}

export async function saveBlog(data: Partial<Blog> & { id?: string }): Promise<Blog> {
  const now = Timestamp.now();
  if (data.id) {
    const { id, ...rest } = data;
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      ...rest,
      updatedAt: now,
    } as any);
    const updated = await getDoc(ref);
    return { id, ...(updated.data() as any) } as Blog;
  }

  // Auto-generate slug for new blogs
  const slug = data.slug || generateSlug(data.title || "");

  const ref = await addDoc(collection(db, COLLECTION), {
    title: data.title || "",
    description: data.description || "",
    blocks: data.blocks || [],
    featured: data.featured || false,
    status: data.status || "draft",
    slug,
    createdAt: now,
    updatedAt: now,
  } as any);

  const snap = await getDoc(ref);
  return { id: ref.id, ...(snap.data() as any) } as Blog;
}

export async function deleteBlog(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function setFeaturedBlog(blogId: string): Promise<void> {
  const snap = await getDocs(collection(db, COLLECTION));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { featured: d.id === blogId });
  });
  await batch.commit();
}

export async function removeFeaturedBlog(): Promise<void> {
  const snap = await getDocs(collection(db, COLLECTION));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { featured: false });
  });
  await batch.commit();
}

export async function updateBlogPositions(blogIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  blogIds.forEach((id, index) => {
    const ref = doc(db, COLLECTION, id);
    batch.update(ref, { position: index });
  });
  await batch.commit();
}
