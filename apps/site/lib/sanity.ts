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
      useCdn: true, // Enable edge cache for blazingly fast loads
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
    asset?: {
      _ref: string;
      _type: "reference";
    };
    url?: string;
    alt?: string;
    caption?: string;
    attribution?: string;
  };
  author?: Author;
  body: any; // Portable Text block array
}

// Fallback Mock Data using standard Portable Text for the bodies
export const FALLBACK_POSTS: Post[] = [
  {
    _id: "mock-post-1",
    title: "How to Scale Your Retail Business across Multiple Locations",
    slug: { current: "scaling-retail-business" },
    publishedAt: "2025-06-15T09:00:00.000Z",
    excerpt: "Learn the essential strategies for multi-branch retail management, from centralized inventory to automated storefront websites.",
    mainImage: {
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      alt: "Multi-branch retail storefronts highlighting rapid business scaling",
      caption: "Scaling successfully across multiple physical stores and digital storefronts.",
      attribution: "Photo by Markus Spiske on Unsplash"
    },
    author: {
      name: "Scryme Team",
      bio: "High-performance retail scaling and storefront automation experts.",
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
            text: "Introduction: The Multi-Branch Challenge",
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
            text: "Expanding from a single retail store to multiple branches is a major milestone. However, it also introduces significant operational complexity. Keeping stock aligned across different branches, managing localized shifts, and running a unified storefront strategy requires modern scaling platforms.",
          },
        ],
      },
      {
        _key: "inline-image-1",
        _type: "image",
        url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80",
        alt: "Centralized modern retail point-of-sale setup",
        caption: "Seamless integration between multiple registers and your e-commerce storefront minimizes latency.",
        attribution: "Photo by Blake Wisz on Unsplash"
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
            text: "1. Centralized Multi-Branch Stock Control",
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
            text: "Without real-time multi-branch stock tracking, you risk stockouts, overstocking, and mismatched records. A central management database serves as a single source of truth, ensuring that transfers between branches are tracked precisely and stock levels are automatically updated across all channels, including your storefronts.",
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
            text: "2. Automated Client Storefront Websites",
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
            text: "Your clients and customers expect a seamless digital experience. By automatically generating and managing custom-facing storefront websites directly from your central inventory database, you enable lightning-fast sales with zero double-entry work.",
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
            text: "Scaling successfully requires moving away from manual spreadsheets and legacy software towards modern platforms designed for growth. Start with a solid high-performance foundation, and the expansion will follow smoothly.",
          },
        ],
      },
    ],
  },
  {
    _id: "mock-post-2",
    title: "Enhancing Performance with Offline-First POS in Multi-Store Retail",
    slug: { current: "importance-of-offline-first-pos" },
    publishedAt: "2025-06-10T10:30:00.000Z",
    excerpt: "Why relying on a constant internet connection for your point of sale is a performance bottleneck you can't afford.",
    mainImage: {
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      alt: "Tablets and devices in a modern checkout workflow",
      caption: "Offline-first architectures guarantee continuous operations even when branch networks drop.",
      attribution: "Photo by CardMapr.nl on Unsplash"
    },
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
        _key: "inline-image-2",
        _type: "image",
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
        alt: "Enterprise server database tracking syncing operations",
        caption: "A localized database ensures sub-second speeds before queued transactions sync to the cloud.",
        attribution: "Photo by Carlos Muza on Unsplash"
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
            text: "The Solution: Offline-First Performance",
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
    if (!posts || posts.length === 0) {
      return FALLBACK_POSTS;
    }
    return posts;
  } catch (error) {
    console.warn("Sanity fetch error, falling back to mock posts:", error);
    return FALLBACK_POSTS;
  }
}

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
      return FALLBACK_POSTS.find((p) => p.slug.current === slug) || null;
    }
    return post;
  } catch (error) {
    console.warn(`Sanity fetch error for slug "${slug}", falling back to mock posts:`, error);
    return FALLBACK_POSTS.find((p) => p.slug.current === slug) || null;
  }
}

// Dynamic Site Content interfaces
export interface HomePageContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    url?: string;
    alt?: string;
  };
  reconciledToday: number;
  brands: string[];
  modules: Array<{
    code: string;
    name: string;
    description: string;
    image?: {
      asset?: {
        _ref: string;
        _type: "reference";
      };
      url?: string;
      alt?: string;
    };
    connectsTo: string[];
    href: string;
    accent: string;
  }>;
  stats: Array<{
    value: string;
    label: string;
    sublabel: string;
  }>;
  testimonials: Array<{
    quote: string;
    name: string;
    title: string;
    company: string;
    ticker: string;
    initials: string;
  }>;
  storefrontTitle?: string;
  storefrontSubtitle?: string;
  storefrontImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    url?: string;
    alt?: string;
  };
  multiBranchTitle?: string;
  multiBranchSubtitle?: string;
  multiBranchImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    url?: string;
    alt?: string;
  };
  stockManagementTitle?: string;
  stockManagementSubtitle?: string;
  stockManagementImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    url?: string;
    alt?: string;
  };
}

export interface AboutPageContent {
  heroTitle: string;
  heroSubtitle: string;
  stats: Array<{
    value: string;
    label: string;
  }>;
  missionTitle: string;
  missionText: string[];
  missionImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    url?: string;
    alt?: string;
  };
  timeline: Array<{
    year: string;
    milestone: string;
  }>;
  values: Array<{
    tag: string;
    title: string;
    desc: string;
  }>;
  team: Array<{
    name: string;
    role: string;
    initials: string;
    avatar?: {
      asset?: {
        _ref: string;
        _type: "reference";
      };
      url?: string;
      alt?: string;
    };
  }>;
}

export interface PricingPageContent {
  heroTitle: string;
  heroSubtitle: string;
  plans: Array<{
    name: string;
    price: string;
    period: string;
    tagline: string;
    cta: string;
    href: string;
    highlight: boolean;
    badge?: string;
    features: (string | null)[];
  }>;
  comparisonRows: Array<{
    feature: string;
    starter: string | boolean;
    growth: string | boolean;
    enterprise: string | boolean;
  }>;
  faqItems: Array<{
    q: string;
    a: string;
  }>;
}

// Fallback constants
export const DEFAULT_HOME_CONTENT: HomePageContent = {
  heroTitle: 'The commerce engine built for scaling and performance',
  heroSubtitle: 'Scryme integrates retail POS, multi-branch syncing, advanced stock control, and centralized management with automated customer-facing storefront websites. Built for high-performance operations.',
  heroImage: {
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    alt: "Scryme High-Performance Multi-Branch Commerce Dashboard"
  },
  reconciledToday: 341850,
  brands: [
    'Westfield Retail',
    'Meridian Corp',
    'Fontaine Group',
    'Harlen & Co.',
    'Argent Industries',
    'Solis Distributors',
    'Kestrel Holdings',
  ],
  modules: [
    {
      code: 'CRM',
      name: 'Storefronts & CRM',
      description: 'Create and manage customer-facing storefront websites for your clients, beautifully synced with inventory and central operations.',
      image: {
        url: "https://images.unsplash.com/photo-1552581234-2612b75dc679?auto=format&fit=crop&w=600&q=80",
        alt: "Customer Storefront website management and automated setup builder"
      },
      connectsTo: ['FIN', 'INV'],
      href: '/products/crm',
      accent: '#C89A4B',
    },
    {
      code: 'POS',
      name: 'Integrated Point of Sale',
      description: 'Ring up transactions offline-first, with stock and revenue reconciled across multiple branches the split second a shift closes.',
      image: {
        url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
        alt: "Offline-capable Modern Retail Point of Sale Checkout System"
      },
      connectsTo: ['INV', 'FIN'],
      href: '/products/pos',
      accent: '#4B9073',
    },
    {
      code: 'INV',
      name: 'Stock & Inventory Management',
      description: 'Advanced stock management across warehouses and branches, with automated reorders and instant digital storefront stock syncing.',
      image: {
        url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        alt: "Organized Multi-branch Retail and Wholesale Stock & Inventory Management"
      },
      connectsTo: ['POS', 'FIN'],
      href: '/products/inventory',
      accent: '#7C93B0',
    },
    {
      code: 'FIN',
      name: 'Central Management & ERP',
      description: 'Manage several branches, global accounting, consolidated reporting, and multi-store configurations from one master dashboard.',
      image: {
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        alt: "Corporate Central Management ERP and Financial Operations Console"
      },
      connectsTo: ['CRM', 'POS', 'INV'],
      href: '/products/finance',
      accent: '#B4553A',
    },
    {
      code: 'HR',
      name: 'Multi-Branch Workforce',
      description: 'Orchestrate staffing, shifts, and registers across several branches with centralized corporate policy and permission controls.',
      image: {
        url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80",
        alt: "Human Resource Multi-Branch Workforce Scheduling and Shift Control"
      },
      connectsTo: ['FIN'],
      href: '/products/hr',
      accent: '#9A7FB0',
    },
    {
      code: 'BI',
      name: 'Performance Analytics',
      description: "Analyze branch growth, inventory turnover, and conversion metrics in real-time to scale business performance with precision.",
      image: {
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        alt: "Performance Analytics Querying and Scaling Optimization Engine"
      },
      connectsTo: ['CRM', 'POS', 'INV', 'FIN', 'HR'],
      href: '/products/analytics',
      accent: '#4E7FB5',
    },
  ],
  stats: [
    {
      value: '2,500+',
      label: 'Active storefronts',
      sublabel: 'generated and fully managed',
    },
    {
      value: '45ms',
      label: 'Barcode scan sync',
      sublabel: 'under extreme load',
    },
    {
      value: '100%',
      label: 'Offline POS uptime',
      sublabel: 'local SQLite sync technology',
    },
    {
      value: '24/7',
      label: 'Performance monitoring',
      sublabel: 'built to scale business ops',
    },
  ],
  testimonials: [
    {
      quote: 'Scryme allowed us to scale from 2 to 14 branches in under a year. We manage central pricing, stock replenishments, and 14 local POS terminals from one dashboard. Plus, the automated storefront websites generated for our clients have increased our wholesale demand by 60%.',
      name: 'Amara Diallo',
      title: 'Chief Operating Officer',
      company: 'Fontaine Group',
      ticker: 'FTN',
      initials: 'AD',
    },
    {
      quote: 'We run 23 retail branches. Before Scryme, managing physical stock transfers and syncing them with our digital customer storefront was a nightmare. Now it takes seconds. Performance and accuracy have skyrocketed.',
      name: 'Marcus Chen',
      title: 'Head of Retail Operations',
      company: 'Westfield Retail Holdings',
      ticker: 'WRH',
      initials: 'MC',
    },
    {
      quote: 'The managed storefront websites are a game changer. We generated branded stores for our main buyers, syncing our central stock levels directly to their shopping carts. Wholesale orders are fully automated now.',
      name: 'Sophia Hargreaves',
      title: 'VP of Sales',
      company: 'Meridian Corp',
      ticker: 'MRD',
      initials: 'SH',
    },
  ],
  storefrontTitle: 'Customer-Facing Storefront Websites',
  storefrontSubtitle: 'Instantly build, customize, and manage customer-facing storefront websites for your brand. Beautiful e-commerce templates synchronized natively with your central stock database and retail POS registers.',
  storefrontImage: {
    url: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    alt: "Automated customer-facing storefront e-commerce template builder"
  },
  multiBranchTitle: 'Unified Multi-Branch Orchestration',
  multiBranchSubtitle: 'Scale across several branches with ease. Oversee location-specific pricing, staff shift rosters, live drawer reconciliations, and inter-branch inventory transfers from a unified cloud console.',
  multiBranchImage: {
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    alt: "Multi-branch retail synchronization and operational hub"
  },
  stockManagementTitle: 'Advanced Stock & Inventory Control',
  stockManagementSubtitle: 'Optimize cash flow with intelligent stock level monitoring. Prevent stockouts using multi-warehouse replenishment workflows and automated trigger thresholds synchronized with online and offline channels.',
  stockManagementImage: {
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    alt: "Advanced stock management tracking and warehouse organization"
  },
};

export const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  heroTitle: "The high-performance platform built to scale operations",
  heroSubtitle: 'We built Scryme to empower businesses to scale securely and enhance their performance. By unifying offline-first POS registers, multi-branch syncing, advanced stock tracking, and automated customer storefronts into a single system, we eliminate friction and drive growth.',
  stats: [
    { value: '4,200+', label: 'Stores scaled on Scryme' },
    { value: '18', label: 'Countries active' },
    { value: '$12M+', label: 'Daily volume' },
    { value: '4.9 / 5', label: 'Performance rating' },
  ],
  missionTitle: 'Equip every growing merchant with absolute control and scale',
  missionText: [
    'Managing several branches, tracking massive stock, and maintaining an online storefront has historically required a patchwork of bloated systems and an expensive IT staff to reconcile data.',
    'Scryme changes that. We provide an integrated, enterprise-ready engine. Beautiful, high-converting customer-facing storefronts, lightning-fast POS terminals, robust multi-branch inventory transfers, and complete central management — all engineered to run at maximum performance.',
  ],
  missionImage: {
    url: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80",
    alt: "Corporate Enterprise Strategy Planning and Team Collaboration"
  },
  timeline: [
    {
      year: '2019',
      milestone: 'Founded in Accra, Ghana. First integrated POS and multi-branch engine shipped to 12 retail teams.',
    },
    {
      year: '2021',
      milestone: 'Launched automated Customer Storefront builders. Reached 500 businesses syncing stock in real-time.',
    },
    {
      year: '2022',
      milestone: 'Series A funding. Expanded central management ERP to UK and European wholesale markets.',
    },
    {
      year: '2023',
      milestone: 'Released advanced offline-first POS engine and SQLite sync plugins. Crossed 2,000 customers.',
    },
    {
      year: '2025',
      milestone: '4,200+ brands scaling across several branches. Real-time operations running at peak performance.',
    },
  ],
  values: [
    {
      tag: 'PS',
      title: 'Performance & Scale',
      desc: 'Our engine is designed to handle rapid barcode scanning, complex stock allocations, and sudden storefront traffic spikes without slowing down.',
    },
    {
      tag: 'MB',
      title: 'Multi-Branch Integrity',
      desc: 'Never worry about inventory drifting. Transfers, branch sales, and online orders sync with transaction-level precision.',
    },
    {
      tag: 'SE',
      title: 'Storefront Excellence',
      desc: 'We enable you to offer your clients stunning, fast, SEO-optimized shopping storefronts that run perfectly across all devices.',
    },
    {
      tag: 'CM',
      title: 'Centralized Control',
      desc: "One central platform to rule them all. Manage catalogs, pricing, users, and performance analytics across all physical and online stores.",
    },
  ],
  team: [
    {
      name: 'Adeola Mensah',
      role: 'Chief Executive Officer',
      initials: 'AM',
      avatar: {
        url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80",
        alt: "Adeola Mensah, CEO"
      }
    },
    {
      name: 'Yuki Tanaka',
      role: 'Chief Product Officer',
      initials: 'YT',
      avatar: {
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
        alt: "Yuki Tanaka, CPO"
      }
    },
    {
      name: 'Samuel Osei',
      role: 'Chief Technology Officer',
      initials: 'SO',
      avatar: {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
        alt: "Samuel Osei, CTO"
      }
    },
    {
      name: 'Lena Hoffmann',
      role: 'VP of Customer Success',
      initials: 'LH',
      avatar: {
        url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80",
        alt: "Lena Hoffmann, VP Customer Success"
      }
    },
    {
      name: 'Priya Rajan',
      role: 'Head of Engineering',
      initials: 'PR',
      avatar: {
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80",
        alt: "Priya Rajan, Head of Engineering"
      }
    },
    {
      name: 'Marcus Webb',
      role: 'Head of Sales',
      initials: 'MW',
      avatar: {
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
        alt: "Marcus Webb, Head of Sales"
      }
    },
  ],
};

export const DEFAULT_PRICING_CONTENT: PricingPageContent = {
  heroTitle: 'Simple, transparent pricing to scale your brand',
  heroSubtitle: 'Choose the right plan to expand across branches, manage stock, and launch stunning storefront websites.',
  plans: [
    {
      name: 'Starter',
      price: '$49',
      period: '/mo',
      tagline: 'For independent retailers getting started',
      cta: 'Start free trial',
      href: 'https://app.scryme.tech/sign-up',
      highlight: false,
      features: [
        '1 Integrated POS terminal',
        '1 store location / branch',
        'Up to 1,000 SKUs & stock tracking',
        '1 Customer storefront website',
        'Real-time central management',
        'Email support',
        null,
        null,
        null,
      ],
    },
    {
      name: 'Growth',
      price: '$149',
      period: '/mo',
      tagline: 'For growing brands scaling several branches',
      cta: 'Start free trial',
      href: 'https://app.scryme.tech/sign-up',
      highlight: true,
      badge: 'Most popular',
      features: [
        'Up to 5 POS terminals',
        'Up to 3 branches',
        'Unlimited SKUs & advanced stock control',
        'Up to 5 Customer storefront websites',
        'Central management ERP & CRM tools',
        'Inter-branch inventory transfers',
        'Performance forecasting',
        'Priority support',
        null,
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tagline: 'For large retailers, franchises, and wholesale setups',
      cta: 'Talk to sales',
      href: 'https://app.scryme.tech/sign-up',
      highlight: false,
      features: [
        'Unlimited POS terminals',
        'Unlimited branches & warehouses',
        'Unlimited SKUs & stock configurations',
        'Unlimited Customer storefront websites',
        'Consolidated corporate central management',
        'High-performance analytics BI suite',
        'Dedicated success manager',
        'Custom SLA & guided branch onboarding',
      ],
    },
  ],
  comparisonRows: [
    {
      feature: 'POS terminals',
      starter: '1',
      growth: 'Up to 5',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Store locations & branches',
      starter: '1',
      growth: 'Up to 3',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Customer storefront websites',
      starter: '1',
      growth: 'Up to 5',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Stock limits (SKUs)',
      starter: '1,000',
      growth: 'Unlimited',
      enterprise: 'Unlimited',
    },
    { feature: 'Central Management ERP', starter: 'Included', growth: 'Included', enterprise: 'Included' },
    {
      feature: 'Inter-branch transfers',
      starter: '—',
      growth: 'Included',
      enterprise: 'Included',
    },
    { feature: 'API access', starter: '—', growth: 'Included', enterprise: 'Included' },
    {
      feature: 'Custom integrations',
      starter: '—',
      growth: '—',
      enterprise: 'Included',
    },
    { feature: 'Dedicated CSM', starter: '—', growth: '—', enterprise: 'Included' },
    { feature: 'Custom SLA', starter: '—', growth: '—', enterprise: 'Included' },
    {
      feature: 'On-premise deployment',
      starter: '—',
      growth: '—',
      enterprise: 'Included',
    },
  ],
  faqItems: [
    {
      q: 'Can I change plans at any time?',
      a: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing cycle.',
    },
    {
      q: 'What happens after the 30-day trial?',
      a: 'At the end of your trial, you choose a plan and enter payment details. If you decide not to continue, your data is retained for 60 days before deletion.',
    },
    {
      q: 'Is there a setup or onboarding fee?',
      a: 'No setup fees on Starter or Growth. Enterprise customers receive guided onboarding as part of their package at no extra cost.',
    },
    {
      q: 'Can I run Scryme POS without an internet connection?',
      a: 'Yes. The POS desktop app stores a full local copy of your data and syncs automatically with central management when connectivity returns.',
    },
    {
      q: 'Do you offer discounts for annual billing?',
      a: 'Yes — annual billing saves 20% compared to monthly. Contact sales or switch from your account settings after sign-up.',
    },
  ],
};

// Site content GROQ Fetchers
export async function getHomePageContent(): Promise<HomePageContent> {
  if (!client) {
    return DEFAULT_HOME_CONTENT;
  }
  try {
    const data = await client.fetch<HomePageContent | null>(`*[_type == "homePage"][0] {
      heroTitle,
      heroSubtitle,
      heroImage,
      reconciledToday,
      brands,
      modules,
      stats,
      testimonials,
      storefrontTitle,
      storefrontSubtitle,
      storefrontImage,
      multiBranchTitle,
      multiBranchSubtitle,
      multiBranchImage,
      stockManagementTitle,
      stockManagementSubtitle,
      stockManagementImage
    }`);
    if (!data) return DEFAULT_HOME_CONTENT;
    return {
      heroTitle: data.heroTitle || DEFAULT_HOME_CONTENT.heroTitle,
      heroSubtitle: data.heroSubtitle || DEFAULT_HOME_CONTENT.heroSubtitle,
      heroImage: data.heroImage || DEFAULT_HOME_CONTENT.heroImage,
      reconciledToday: data.reconciledToday ?? DEFAULT_HOME_CONTENT.reconciledToday,
      brands: data.brands && data.brands.length > 0 ? data.brands : DEFAULT_HOME_CONTENT.brands,
      modules: data.modules && data.modules.length > 0 ? data.modules : DEFAULT_HOME_CONTENT.modules,
      stats: data.stats && data.stats.length > 0 ? data.stats : DEFAULT_HOME_CONTENT.stats,
      testimonials: data.testimonials && data.testimonials.length > 0 ? data.testimonials : DEFAULT_HOME_CONTENT.testimonials,
      storefrontTitle: data.storefrontTitle || DEFAULT_HOME_CONTENT.storefrontTitle,
      storefrontSubtitle: data.storefrontSubtitle || DEFAULT_HOME_CONTENT.storefrontSubtitle,
      storefrontImage: data.storefrontImage || DEFAULT_HOME_CONTENT.storefrontImage,
      multiBranchTitle: data.multiBranchTitle || DEFAULT_HOME_CONTENT.multiBranchTitle,
      multiBranchSubtitle: data.multiBranchSubtitle || DEFAULT_HOME_CONTENT.multiBranchSubtitle,
      multiBranchImage: data.multiBranchImage || DEFAULT_HOME_CONTENT.multiBranchImage,
      stockManagementTitle: data.stockManagementTitle || DEFAULT_HOME_CONTENT.stockManagementTitle,
      stockManagementSubtitle: data.stockManagementSubtitle || DEFAULT_HOME_CONTENT.stockManagementSubtitle,
      stockManagementImage: data.stockManagementImage || DEFAULT_HOME_CONTENT.stockManagementImage,
    };
  } catch (error) {
    console.warn("Sanity fetch error for homePage, falling back to default:", error);
    return DEFAULT_HOME_CONTENT;
  }
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  if (!client) {
    return DEFAULT_ABOUT_CONTENT;
  }
  try {
    const data = await client.fetch<AboutPageContent | null>(`*[_type == "aboutPage"][0] {
      heroTitle,
      heroSubtitle,
      stats,
      missionTitle,
      missionText,
      missionImage,
      timeline,
      values,
      team
    }`);
    if (!data) return DEFAULT_ABOUT_CONTENT;
    return {
      heroTitle: data.heroTitle || DEFAULT_ABOUT_CONTENT.heroTitle,
      heroSubtitle: data.heroSubtitle || DEFAULT_ABOUT_CONTENT.heroSubtitle,
      stats: data.stats && data.stats.length > 0 ? data.stats : DEFAULT_ABOUT_CONTENT.stats,
      missionTitle: data.missionTitle || DEFAULT_ABOUT_CONTENT.missionTitle,
      missionText: data.missionText && data.missionText.length > 0 ? data.missionText : DEFAULT_ABOUT_CONTENT.missionText,
      missionImage: data.missionImage || DEFAULT_ABOUT_CONTENT.missionImage,
      timeline: data.timeline && data.timeline.length > 0 ? data.timeline : DEFAULT_ABOUT_CONTENT.timeline,
      values: data.values && data.values.length > 0 ? data.values : DEFAULT_ABOUT_CONTENT.values,
      team: data.team && data.team.length > 0 ? data.team : DEFAULT_ABOUT_CONTENT.team,
    };
  } catch (error) {
    console.warn("Sanity fetch error for aboutPage, falling back to default:", error);
    return DEFAULT_ABOUT_CONTENT;
  }
}

export async function getPricingPageContent(): Promise<PricingPageContent> {
  if (!client) {
    return DEFAULT_PRICING_CONTENT;
  }
  try {
    const data = await client.fetch<PricingPageContent | null>(`*[_type == "pricingPage"][0] {
      heroTitle,
      heroSubtitle,
      plans,
      comparisonRows,
      faqItems
    }`);
    if (!data) return DEFAULT_PRICING_CONTENT;
    return {
      heroTitle: data.heroTitle || DEFAULT_PRICING_CONTENT.heroTitle,
      heroSubtitle: data.heroSubtitle || DEFAULT_PRICING_CONTENT.heroSubtitle,
      plans: data.plans && data.plans.length > 0 ? data.plans : DEFAULT_PRICING_CONTENT.plans,
      comparisonRows: data.comparisonRows && data.comparisonRows.length > 0 ? data.comparisonRows : DEFAULT_PRICING_CONTENT.comparisonRows,
      faqItems: data.faqItems && data.faqItems.length > 0 ? data.faqItems : DEFAULT_PRICING_CONTENT.faqItems,
    };
  } catch (error) {
    console.warn("Sanity fetch error for pricingPage, falling back to default:", error);
    return DEFAULT_PRICING_CONTENT;
  }
}
