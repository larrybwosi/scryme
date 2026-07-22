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
    title: "How to Scale Your Retail Business from 1 to 10 Locations",
    slug: { current: "scaling-retail-business" },
    publishedAt: "2025-06-15T09:00:00.000Z",
    excerpt: "Learn the essential strategies for multi-location retail management, from centralized inventory to unified CRM data.",
    mainImage: {
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      alt: "Multi-location retail storefronts highlighting rapid business scaling",
      caption: "Scaling successfully across multiple physical stores requires unified operating ledgers.",
      attribution: "Photo by Markus Spiske on Unsplash"
    },
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
        _key: "inline-image-1",
        _type: "image",
        url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80",
        alt: "Centralized modern retail point-of-sale setup",
        caption: "Seamless integration between multiple registers minimizes latency and sync issues.",
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
    mainImage: {
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      alt: "Tablets and devices in a modern checkout workflow",
      caption: "Offline-first architectures guarantee continuous operations even when network connectivity drops.",
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
  heroTitle: 'Every sale, deal, and shipment. One reconciled record.',
  heroSubtitle: 'Scryme merges CRM, Point of Sale, Inventory, and Finance into a single ledger — so nothing you run your business on ever needs reconciling by hand again.',
  heroImage: {
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    alt: "Scryme Unified Business Ledger and Analytics Dashboard"
  },
  reconciledToday: 284900,
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
      name: 'Customer Relationship Management',
      description: 'Track every interaction, run the pipeline, and automate follow-ups — each closed deal posts straight to Finance and unlocks fulfillment in Inventory.',
      image: {
        url: "https://images.unsplash.com/photo-1552581234-2612b75dc679?auto=format&fit=crop&w=600&q=80",
        alt: "Client Relationship Management and Pipeline Pipeline Collaboration"
      },
      connectsTo: ['FIN', 'INV'],
      href: '/products/crm',
      accent: '#C89A4B',
    },
    {
      code: 'POS',
      name: 'Point of Sale',
      description: 'Ring up retail and wholesale sales, offline-capable, with stock and revenue reconciled to the second the register closes.',
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
      name: 'Inventory Management',
      description: 'Monitor stock across warehouses and storefronts, with automatic reorders that draw straight from committed Finance budgets.',
      image: {
        url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        alt: "Organized Multi-location Retail and Wholesale Warehouse Inventory Management"
      },
      connectsTo: ['POS', 'FIN'],
      href: '/products/inventory',
      accent: '#7C93B0',
    },
    {
      code: 'FIN',
      name: 'Financial Management',
      description: 'Invoicing, expense tracking, and reconciliation — every entry from CRM, POS, and Inventory lands here as one ledger line.',
      image: {
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        alt: "Corporate Ledger Bookkeeping and Financial Reconciliation Dashboard"
      },
      connectsTo: ['CRM', 'POS', 'INV'],
      href: '/products/finance',
      accent: '#B4553A',
    },
    {
      code: 'HR',
      name: 'HR & Workforce',
      description: 'Manage people, attendance, and payroll, with labor cost flowing directly into the same Finance ledger as everything else.',
      image: {
        url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80",
        alt: "Human Resource Workforce Management and Enterprise Hiring Onboarding"
      },
      connectsTo: ['FIN'],
      href: '/products/hr',
      accent: '#9A7FB0',
    },
    {
      code: 'BI',
      name: 'Business Analytics',
      description: "Every module writes to one record, so reporting is never a reconciliation project — it's a query against a single source of truth.",
      image: {
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        alt: "Enterprise Big Data Business Analytics and Real-time Metric Querying"
      },
      connectsTo: ['CRM', 'POS', 'INV', 'FIN', 'HR'],
      href: '/products/analytics',
      accent: '#4E7FB5',
    },
  ],
  stats: [
    {
      value: '500+',
      label: 'Enterprise businesses',
      sublabel: 'across 12 countries',
    },
    {
      value: '$2B+',
      label: 'Transactions processed',
      sublabel: 'annually on the platform',
    },
    {
      value: '99.9%',
      label: 'Platform uptime SLA',
      sublabel: 'guaranteed & monitored',
    },
    {
      value: '24/7',
      label: 'Expert support',
      sublabel: 'dedicated account teams',
    },
  ],
  testimonials: [
    {
      quote: 'Scryme replaced four separate systems we were running. Our operations team now has a single dashboard for everything — inventory, POS, CRM, and finance. The ROI in the first quarter alone paid for the full-year subscription.',
      name: 'Amara Diallo',
      title: 'Chief Operating Officer',
      company: 'Fontaine Group',
      ticker: 'FTN',
      initials: 'AD',
    },
    {
      quote: 'We run 23 retail branches across three regions. Before Scryme, reconciling end-of-day sales was a half-day job. Now it takes minutes. The multi-branch inventory visibility alone is a game changer.',
      name: 'Marcus Chen',
      title: 'Head of Retail Operations',
      company: 'Westfield Retail Holdings',
      ticker: 'WRH',
      initials: 'MC',
    },
    {
      quote: 'The CRM pipeline gave our sales team a new level of accountability. We went from guessing what was in the pipeline to having real-time data on every deal. Deal velocity improved 40% in our first six months.',
      name: 'Sophia Hargreaves',
      title: 'VP of Sales',
      company: 'Meridian Corp',
      ticker: 'MRD',
      initials: 'SH',
    },
  ],
};

export const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  heroTitle: "The ERP built for businesses that can't afford to stop",
  heroSubtitle: 'We built Scryme after watching too many retailers lose hours every week reconciling spreadsheets, battling unreliable POS systems, and missing growth because their tools were designed for someone else. Scryme is different — purpose-built for the businesses that keep the economy moving.',
  stats: [
    { value: '4,200+', label: 'Businesses on Scryme' },
    { value: '18', label: 'Countries' },
    { value: '$3.8M+', label: 'Transactions daily' },
    { value: '4.9 / 5', label: 'Customer satisfaction' },
  ],
  missionTitle: 'Give every business the tools that used to require a Fortune 500 budget',
  missionText: [
    'Enterprise ERP platforms have long been out of reach for independent retailers and mid-market wholesalers — priced in six-figure implementation fees and requiring dedicated IT departments to maintain.',
    'Scryme changes that. We ship a unified platform — CRM, POS, Inventory, and Finance — that a 10-person team can run as confidently as a 10,000-person organisation. Our pricing is transparent, our onboarding is measured in days not months, and our support is staffed by people who understand retail and wholesale.',
  ],
  missionImage: {
    url: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80",
    alt: "Corporate Enterprise Strategy Planning and Team Collaboration"
  },
  timeline: [
    {
      year: '2019',
      milestone: 'Founded in Accra, Ghana. First POS beta shipped to 12 local retailers.',
    },
    {
      year: '2021',
      milestone: 'Launched CRM and Inventory modules. Reached 500 businesses across West Africa.',
    },
    {
      year: '2022',
      milestone: 'Series A funding. Expanded to UK and Southeast Asia markets.',
    },
    {
      year: '2023',
      milestone: 'Launched Finance module and Tauri desktop POS. Crossed 2,000 customers.',
    },
    {
      year: '2025',
      milestone: '4,200+ businesses in 18 countries. $3.8M+ daily transactions processed.',
    },
  ],
  values: [
    {
      tag: 'RF',
      title: 'Reliability first',
      desc: 'Our offline-first POS and 99.9% uptime commitment mean your business keeps running — no matter what the network does.',
    },
    {
      tag: 'RO',
      title: 'Built for real operations',
      desc: 'Every feature in Scryme was informed by actual conversations with retailers and wholesalers, not theoretical user stories.',
    },
    {
      tag: 'TP',
      title: 'Transparent pricing',
      desc: 'No hidden modules, no per-feature add-ons. The price you see is what you pay — features included as your business scales.',
    },
    {
      tag: 'LP',
      title: 'Long-term partnership',
      desc: "We measure success by our customers' revenue growth, not activation rates. Our team is reachable, accountable, and invested.",
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
  heroTitle: 'Simple pricing. No surprises.',
  heroSubtitle: 'Every plan includes a 30-day free trial with full feature access. No credit card required.',
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
        '1 POS terminal',
        '1 store location',
        'Up to 500 SKUs',
        'Basic inventory tracking',
        'Daily sales reports',
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
      tagline: 'For growing businesses with multiple staff',
      cta: 'Start free trial',
      href: 'https://app.scryme.tech/sign-up',
      highlight: true,
      badge: 'Most popular',
      features: [
        'Up to 5 POS terminals',
        'Up to 3 locations',
        'Unlimited SKUs',
        'Full inventory + transfers',
        'CRM — up to 2,500 contacts',
        'Finance module',
        'Demand forecasting',
        'Priority support',
        null,
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tagline: 'For large retailers and wholesale operations',
      cta: 'Talk to sales',
      href: 'https://app.scryme.tech/sign-up',
      highlight: false,
      features: [
        'Unlimited POS terminals',
        'Unlimited locations',
        'Unlimited SKUs',
        'Full inventory + transfers',
        'CRM — unlimited contacts',
        'Finance module',
        'Demand forecasting',
        'Dedicated success manager',
        'Custom SLA & onboarding',
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
      feature: 'Store locations',
      starter: '1',
      growth: 'Up to 3',
      enterprise: 'Unlimited',
    },
    {
      feature: 'SKU limit',
      starter: '500',
      growth: 'Unlimited',
      enterprise: 'Unlimited',
    },
    {
      feature: 'CRM contacts',
      starter: false,
      growth: '2,500',
      enterprise: 'Unlimited',
    },
    { feature: 'Finance module', starter: false, growth: true, enterprise: true },
    {
      feature: 'Demand forecasting',
      starter: false,
      growth: true,
      enterprise: true,
    },
    { feature: 'API access', starter: false, growth: true, enterprise: true },
    {
      feature: 'Custom integrations',
      starter: false,
      growth: false,
      enterprise: true,
    },
    { feature: 'Dedicated CSM', starter: false, growth: false, enterprise: true },
    { feature: 'Custom SLA', starter: false, growth: false, enterprise: true },
    {
      feature: 'On-premise deployment',
      starter: false,
      growth: false,
      enterprise: true,
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
      a: 'Yes. The POS desktop app stores a full local copy of your data and syncs automatically when connectivity returns. There is no minimum uptime requirement.',
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
      testimonials
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
