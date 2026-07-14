import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = "2023-05-03";

// Determine if we should use the actual Sanity Client or Fallback
const isConfigured =
  projectId &&
  dataset &&
  projectId !== "your-project-id" &&
  dataset !== "production-mock-stub" &&
  projectId !== "your-sanity-project-id";

export const client = isConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // Set to false for dynamic queries
    })
  : null;

export interface Author {
  name: string;
  image?: {
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  };
  bio?: string;
}

export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  publishedAt: string;
  excerpt?: string;
  mainImage?: {
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  };
  author?: Author;
  body: any; // Portable Text block array
}

// Fallback Mock Data using standard Portable Text for the bodies
export const FALLBACK_POSTS: Post[] = [
  {
    _id: "mock-post-1",
    title: "How to Scale Your Retail Business from 1 to 10 Locations",
    slug: { current: "scaling-retail-business" },
    publishedAt: "2025-06-15T09:00:00.000Z",
    excerpt: "Learn the essential strategies for multi-location retail management, from centralized inventory to unified CRM data.",
    author: {
      name: "Scryme Team",
      bio: "Retail automation experts dedicated to building robust ERP and POS systems.",
    },
    body: [
      {
        _key: "block-1",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "span-1",
            _type: "span",
            marks: [],
            text: "Introduction: The Multi-Location Challenge",
          },
        ],
      },
      {
        _key: "block-2",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "span-2",
            _type: "span",
            marks: [],
            text: "Expanding from a single retail store to multiple locations is a major milestone. However, it also introduces significant operational complexity. Managing stock across different locations, keeping track of staff, and maintaining a unified customer relationship strategy requires robust systems and clear processes.",
          },
        ],
      },
      {
        _key: "block-3",
        _type: "block",
        style: "h3",
        children: [
          {
            _key: "span-3",
            _type: "span",
            marks: [],
            text: "1. Centralized Inventory Management",
          },
        ],
      },
      {
        _key: "block-4",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "span-4",
            _type: "span",
            marks: [],
            text: "Without real-time inventory tracking, you risk stockouts, overstocking, and mismatched records. A central database serves as a single source of truth, ensuring that transfers between stores are tracked precisely and stock levels are automatically updated.",
          },
        ],
      },
      {
        _key: "block-5",
        _type: "block",
        style: "h3",
        children: [
          {
            _key: "span-5",
            _type: "span",
            marks: [],
            text: "2. Unified CRM and Customer Loyalty",
          },
        ],
      },
      {
        _key: "block-6",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "span-6",
            _type: "span",
            marks: [],
            text: "Your customers expect a seamless experience whether they shop at store A, store B, or online. A unified CRM allows you to track purchase history globally, enroll customers in unified reward programs, and personalize marketing campaigns effectively.",
          },
        ],
      },
      {
        _key: "block-7",
        _type: "block",
        style: "h3",
        children: [
          {
            _key: "span-7",
            _type: "span",
            marks: [],
            text: "Conclusion",
          },
        ],
      },
      {
        _key: "block-8",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "span-8",
            _type: "span",
            marks: [],
            text: "Scaling successfully requires moving away from manual spreadsheets and legacy software towards modern ERP platforms designed for growth. Start with a solid foundation, and the expansion will follow smoothly.",
          },
        ],
      },
    ],
  },
  {
    _id: "mock-post-2",
    title: "The Importance of Offline-First POS in Modern Retail",
    slug: { current: "importance-of-offline-first-pos" },
    publishedAt: "2025-06-10T10:30:00.000Z",
    excerpt: "Why relying on a constant internet connection for your point of sale is a risk you shouldn't take.",
    author: {
      name: "Scryme Team",
      bio: "Engineers of offline-first POS systems that never let retail transactions pause.",
    },
    body: [
      {
        _key: "b1",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "s1",
            _type: "span",
            marks: [],
            text: "Why Internet Outages Shouldn't Halt Your Sales",
          },
        ],
      },
      {
        _key: "b2",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "s2",
            _type: "span",
            marks: [],
            text: "In modern retail, a fast and reliable checkout experience is critical. Many cloud-based Point of Sale (POS) systems require a constant internet connection. If your ISP experiences an outage or your Wi-Fi flickers, your entire checkout lane stops, leading to lost revenue and frustrated customers.",
          },
        ],
      },
      {
        _key: "b3",
        _type: "block",
        style: "h3",
        children: [
          {
            _key: "s3",
            _type: "span",
            marks: [],
            text: "The Solution: Offline-First Architecture",
          },
        ],
      },
      {
        _key: "b4",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "s4",
            _type: "span",
            marks: [],
            text: "An offline-first POS operates locally on the terminal or a local server. Transactions are processed instantly using a local database, and then synchronized with the main cloud server once connection is restored. This guarantees 100% uptime for checkout lanes.",
          },
        ],
      },
      {
        _key: "b5",
        _type: "block",
        style: "h3",
        children: [
          {
            _key: "s5",
            _type: "span",
            marks: ["strong"],
            text: "Key Advantages of Offline-First",
          },
        ],
      },
      {
        _key: "b6",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "s6",
            _type: "span",
            marks: [],
            text: "• Uninterrupted Sales: Customers never wait because of a slow network connection.\n• Sub-second Latency: Local database queries are blazingly fast compared to network requests.\n• Secure Synchronization: Data is safely stored and queued, preventing transactional data loss.",
          },
        ],
      },
    ],
  },
];

/**
 * Fetch all blog posts, sorted by publication date descending.
 * Gracefully falls back to mock data if Sanity is not configured or fails.
 */
export async function getPosts(): Promise<Post[]> {
  if (!client) {
    return FALLBACK_POSTS;
  }

  try {
    const query = `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      mainImage,
      author->{
        name,
        image,
        bio
      },
      body
    }`;
    const posts = await client.fetch<Post[]>(query);
    // If the returned array is empty, we can still fall back to mock data
    // so there's always something beautiful to see.
    if (!posts || posts.length === 0) {
      return FALLBACK_POSTS;
    }
    return posts;
  } catch (error) {
    console.warn("Sanity fetch error, falling back to mock posts:", error);
    return FALLBACK_POSTS;
  }
}

/**
 * Fetch a single blog post by its slug.
 * Gracefully falls back to mock data if Sanity is not configured or fails.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!client) {
    return FALLBACK_POSTS.find((p) => p.slug.current === slug) || null;
  }

  try {
    const query = `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      mainImage,
      author->{
        name,
        image,
        bio
      },
      body
    }`;
    const post = await client.fetch<Post | null>(query, { slug });
    if (!post) {
      // Look in mock data if not found in Sanity
      return FALLBACK_POSTS.find((p) => p.slug.current === slug) || null;
    }
    return post;
  } catch (error) {
    console.warn(`Sanity fetch error for slug "${slug}", falling back to mock posts:`, error);
    return FALLBACK_POSTS.find((p) => p.slug.current === slug) || null;
  }
}
