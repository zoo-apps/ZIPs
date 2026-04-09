import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ZIPS_DIR = path.join(process.cwd(), '../ZIPs');

export interface ZIPMetadata {
  zip?: number | string;
  title?: string;
  description?: string;
  status?: 'Draft' | 'Review' | 'Last Call' | 'Final' | 'Withdrawn' | 'Stagnant' | 'Superseded';
  type?: 'Standards Track' | 'Meta' | 'Informational';
  category?: 'Core' | 'DeFi' | 'NFT' | 'Gaming' | 'AI' | 'ZRC';
  author?: string;
  created?: string;
  updated?: string;
  requires?: string | number[];
  tags?: string[];
  [key: string]: unknown;
}

export interface ZIPPage {
  slug: string[];
  data: {
    title: string;
    description?: string;
    content: string;
    frontmatter: ZIPMetadata;
  };
}

export interface CategoryMeta {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  range: [number, number];
  icon: string;
  color: string;
  learnMore: string;
  keyTopics: string[];
}

export interface ZIPCategory extends CategoryMeta {
  zips: ZIPPage[];
}

// ZIP number ranges for categories (based on ZIP-0000)
const ZIP_CATEGORIES: CategoryMeta[] = [
  {
    slug: 'core',
    name: 'Core & Governance',
    shortDesc: 'Ecosystem architecture and processes',
    description: 'Core protocol specifications and governance frameworks for the Zoo ecosystem. Zoo Labs Foundation (501c3) is mission-driven to protect wildlife and democratize AI.',
    range: [0, 99],
    icon: 'settings',
    color: 'blue',
    learnMore: 'Core ZIPs define the foundational architecture of Zoo Network, including governance processes, proposal workflows, ecosystem coordination mechanisms, and the overall technical vision for decentralized wildlife protection and open AI research.',
    keyTopics: ['DAO governance', 'Impact metrics', 'Token economics', 'Mission alignment'],
  },
  {
    slug: 'defi',
    name: 'DeFi for Impact',
    shortDesc: 'Impact-focused financial protocols',
    description: 'Decentralized finance protocols powering conservation and research funding. Every transaction contributes to wildlife protection and open science.',
    range: [100, 199],
    icon: 'coins',
    color: 'emerald',
    learnMore: 'DeFi ZIPs specify impact-focused financial protocols: conservation bonds that fund wildlife protection, yield vaults that direct profits to research, and staking mechanisms that reward positive environmental outcomes.',
    keyTopics: ['Conservation bonds', 'Impact yield', 'Green staking', 'Research funding'],
  },
  {
    slug: 'nft',
    name: 'NFT & Digital Assets',
    shortDesc: 'Wildlife NFTs and digital collectibles',
    description: 'Standards for wildlife-themed NFTs and digital asset infrastructure.',
    range: [200, 299],
    icon: 'image',
    color: 'purple',
    learnMore: 'NFT ZIPs define token standards, metadata schemas, and marketplace protocols for wildlife digital collectibles. This includes animal adoption certificates, conservation badges, and biodiversity tracking tokens that fund real-world preservation efforts.',
    keyTopics: ['Wildlife NFTs', 'Adoption certificates', 'Conservation badges', 'Biodiversity tokens'],
  },
  {
    slug: 'gaming',
    name: 'Gaming & Metaverse',
    shortDesc: 'Wildlife games and virtual habitats',
    description: 'Specifications for wildlife gaming experiences and virtual ecosystems.',
    range: [300, 399],
    icon: 'gamepad',
    color: 'pink',
    learnMore: 'Gaming ZIPs specify protocols for wildlife-themed gaming experiences, virtual habitat simulations, and play-to-conserve mechanics. These interactive experiences educate users about biodiversity while generating funding for real conservation projects.',
    keyTopics: ['Virtual habitats', 'Play-to-conserve', 'Wildlife simulators', 'Educational games'],
  },
  {
    slug: 'ai',
    name: 'AI & Machine Learning',
    shortDesc: 'AI agents and species monitoring',
    description: 'AI-powered systems for wildlife monitoring and conservation intelligence.',
    range: [400, 499],
    icon: 'brain',
    color: 'amber',
    learnMore: 'AI ZIPs define protocols for machine learning models that monitor wildlife populations, detect poaching activities, analyze habitat health, and power intelligent conservation agents. Our zLLM (training-free) approach enables efficient, decentralized AI deployment.',
    keyTopics: ['Species detection', 'Poaching prevention', 'Habitat analysis', 'Conservation agents'],
  },
  {
    slug: 'wildlife',
    name: 'Wildlife Preservation & ESG',
    shortDesc: 'Conservation and environmental impact',
    description: 'On-chain protocols for wildlife tracking, habitat protection, and species conservation. The core mission of Zoo Labs Foundation - protecting biodiversity for future generations.',
    range: [500, 599],
    icon: 'leaf',
    color: 'green',
    learnMore: 'Wildlife ZIPs define the core conservation infrastructure: animal tracking systems, habitat health monitoring, anti-poaching coordination, species recovery programs, and ESG reporting for measurable environmental impact.',
    keyTopics: ['Animal tracking', 'Habitat monitoring', 'Anti-poaching', 'ESG metrics'],
  },
  {
    slug: 'research',
    name: 'Open Science & DeSci',
    shortDesc: 'Democratizing research for impact',
    description: 'Decentralized science protocols for open research and data sharing. Making scientific knowledge accessible to all while advancing conservation.',
    range: [600, 699],
    icon: 'flask',
    color: 'indigo',
    learnMore: 'Research ZIPs establish DeSci (Decentralized Science) infrastructure: open-access biodiversity databases, peer review mechanisms, research funding DAOs, and citizen science programs. Democratizing access to scientific knowledge for global conservation impact.',
    keyTopics: ['Open access', 'Citizen science', 'Research DAOs', 'Knowledge sharing'],
  },
  {
    slug: 'applications',
    name: 'Application Standards',
    shortDesc: 'ZRC tokens and ecosystem apps',
    description: 'Application-layer standards including ZRC token specifications.',
    range: [700, 999],
    icon: 'layers',
    color: 'cyan',
    learnMore: 'Application ZIPs define ZRC token standards (fungible, NFT, multi-token), application interfaces, and cross-platform compatibility specifications. These standards ensure interoperability across the Zoo ecosystem and with external chains.',
    keyTopics: ['ZRC-20 tokens', 'ZRC-721 NFTs', 'Multi-token standards', 'Cross-chain bridges'],
  },
];

function getAllZIPFiles(): string[] {
  try {
    const files = fs.readdirSync(ZIPS_DIR);
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .filter(file => file.startsWith('zip-'));
  } catch (error) {
    console.error('Error reading ZIPs directory:', error);
    return [];
  }
}

function readZIPFile(filename: string): ZIPPage | null {
  try {
    const filePath = path.join(ZIPS_DIR, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const slug = filename.replace(/\.mdx?$/, '').split('/');

    // Extract ZIP number from filename or frontmatter
    const zipMatch = filename.match(/zip-(\d+)/);
    const zipNumber = data.zip || (zipMatch ? parseInt(zipMatch[1], 10) : null);

    // Convert Date objects to strings
    const processedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        processedData[key] = value.toISOString().split('T')[0];
      } else {
        processedData[key] = value;
      }
    }

    return {
      slug,
      data: {
        title: (processedData.title as string) || filename.replace(/\.mdx?$/, ''),
        description: processedData.description as string,
        content,
        frontmatter: {
          ...processedData,
          zip: zipNumber,
        } as ZIPMetadata,
      },
    };
  } catch (error) {
    console.error(`Error reading ZIP file ${filename}:`, error);
    return null;
  }
}

function getZIPNumber(page: ZIPPage): number {
  const zip = page.data.frontmatter.zip;
  if (typeof zip === 'number') return zip;
  if (typeof zip === 'string') return parseInt(zip, 10) || 9999;
  return 9999;
}

export const source = {
  getPage(slugParam?: string[]): ZIPPage | null {
    if (!slugParam || slugParam.length === 0) {
      return null;
    }

    const slug = slugParam;
    const filename = `${slug.join('/')}.md`;
    const mdxFilename = `${slug.join('/')}.mdx`;

    let page = readZIPFile(filename);
    if (!page) {
      page = readZIPFile(mdxFilename);
    }

    return page;
  },

  generateParams(): { slug: string[] }[] {
    const files = getAllZIPFiles();
    return files.map(file => ({
      slug: file.replace(/\.mdx?$/, '').split('/'),
    }));
  },

  getAllPages(): ZIPPage[] {
    const files = getAllZIPFiles();
    return files
      .map(readZIPFile)
      .filter((page): page is ZIPPage => page !== null)
      .sort((a, b) => getZIPNumber(a) - getZIPNumber(b));
  },

  getPagesByStatus(status: string): ZIPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.status?.toLowerCase() === status.toLowerCase()
    );
  },

  getPagesByType(type: string): ZIPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.type?.toLowerCase() === type.toLowerCase()
    );
  },

  getPagesByCategory(category: string): ZIPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.category?.toLowerCase() === category.toLowerCase()
    );
  },

  getCategorizedPages(): ZIPCategory[] {
    const allPages = this.getAllPages();

    return ZIP_CATEGORIES.map(cat => ({
      ...cat,
      zips: allPages.filter(page => {
        const zipNum = getZIPNumber(page);
        return zipNum >= cat.range[0] && zipNum <= cat.range[1];
      }),
    })).filter(cat => cat.zips.length > 0);
  },

  getStats(): { total: number; byStatus: Record<string, number>; byType: Record<string, number> } {
    const pages = this.getAllPages();
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    pages.forEach(page => {
      const status = page.data.frontmatter.status || 'Unknown';
      const type = page.data.frontmatter.type || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      byType[type] = (byType[type] || 0) + 1;
    });

    return { total: pages.length, byStatus, byType };
  },

  getAllCategories(): ZIPCategory[] {
    const allPages = this.getAllPages();

    return ZIP_CATEGORIES.map(cat => ({
      ...cat,
      zips: allPages.filter(page => {
        const num = getZIPNumber(page);
        return num >= cat.range[0] && num <= cat.range[1];
      }),
    }));
  },

  // Generate page tree for Fumadocs sidebar
  getPageTree() {
    const categories = this.getCategorizedPages();

    return {
      name: 'ZIPs',
      children: [
        {
          type: 'page' as const,
          name: 'Overview',
          url: '/docs',
        },
        ...categories.map(cat => ({
          type: 'folder' as const,
          name: cat.name,
          description: cat.shortDesc,
          children: cat.zips.slice(0, 30).map(zip => ({
            type: 'page' as const,
            name: `ZIP-${String(getZIPNumber(zip)).padStart(4, '0')}: ${zip.data.title.substring(0, 40)}${zip.data.title.length > 40 ? '...' : ''}`,
            url: `/docs/${zip.slug.join('/')}`,
          })),
        })),
      ],
    };
  },

  // Search across all ZIPs
  search(query: string): ZIPPage[] {
    const q = query.toLowerCase();
    return this.getAllPages().filter(page => {
      const title = page.data.title.toLowerCase();
      const description = (page.data.description || '').toLowerCase();
      const content = page.data.content.toLowerCase();
      const tags = (page.data.frontmatter.tags || []).join(' ').toLowerCase();

      return title.includes(q) || description.includes(q) || content.includes(q) || tags.includes(q);
    });
  },

  // Get category by slug
  getCategoryBySlug(slug: string): ZIPCategory | undefined {
    const allPages = this.getAllPages();
    const cat = ZIP_CATEGORIES.find(c => c.slug === slug);
    if (!cat) return undefined;

    return {
      ...cat,
      zips: allPages.filter(page => {
        const num = getZIPNumber(page);
        return num >= cat.range[0] && num <= cat.range[1];
      }),
    };
  },

  // Get all category slugs for static params
  getAllCategorySlugs(): string[] {
    return ZIP_CATEGORIES.map(cat => cat.slug);
  },
};
