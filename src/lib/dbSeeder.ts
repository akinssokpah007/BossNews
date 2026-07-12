import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Article, Category, Tag } from '../types';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'business-finance', name: 'Business & Finance', slug: 'business-finance', description: 'Global markets, macroeconomic trends, and high-stakes entrepreneurship.' },
  { id: 'tech-innovation', name: 'Tech & Innovation', slug: 'tech-innovation', description: 'Artificial intelligence, space travel, biotechnology, and the frontiers of research.' },
  { id: 'politics-policy', name: 'Politics & Policy', slug: 'politics-policy', description: 'Sovereign governance, trade treaties, and legislative shifts shaping industries.' },
  { id: 'style-luxury', name: 'Style & Luxury', slug: 'style-luxury', description: 'High couture, watchmaking, yachting, premium architecture, and fine arts.' },
  { id: 'science-health', name: 'Science & Health', slug: 'science-health', description: 'Human longevity, energy transition, physics, and medical breakthroughs.' }
];

const INITIAL_TAGS: Tag[] = [
  { id: 'breaking', name: 'Breaking', slug: 'breaking' },
  { id: 'leadership', name: 'Leadership', slug: 'leadership' },
  { id: 'ai', name: 'AI', slug: 'ai' },
  { id: 'global-markets', name: 'Global Markets', slug: 'global-markets' },
  { id: 'sustainability', name: 'Sustainability', slug: 'sustainability' },
  { id: 'billionaires', name: 'Billionaires', slug: 'billionaires' },
  { id: 'space-tech', name: 'Space Tech', slug: 'space-tech' }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'The Dawn of Autonomous Conglomerates: How AI CEOs Are Rewriting Corporate Governance',
    subtitle: 'From algorithmic boards to fully automated workforces, the corporation of 2026 is hyper-efficient and human-light.',
    slug: 'dawn-autonomous-conglomerates-ai-ceos',
    author: 'Elena Rostova',
    authorEmail: 'elena.rostova@bossnews.com',
    country: 'Global',
    region: 'World',
    category: 'tech-innovation',
    tags: ['breaking', 'leadership', 'ai'],
    featured: true,
    breaking: true,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Autonomous Conglomerates and AI CEOs | Boss News',
    metaDescription: 'Discover how algorithmic executive boards and artificial intelligence are revolutionizing global corporate structures.',
    views: 12450,
    content: `## The Algorithmic Executive Board

For decades, the idea of an autonomous enterprise was relegated to the outer rings of science fiction. Today, it is a multitrillion-dollar reality. Across the leading technology hubs of Zurich, Tokyo, and San Francisco, a new class of enterprise has emerged: **Autonomous Conglomerates**. These companies operate with zero full-time human employees, managed instead by multi-agent AI networks operating on secure distributed ledgers.

What began as robotic process automation (RPA) has evolved into high-frequency strategic execution. These systems analyze macroeconomic indicators, regulatory shifts, and consumer demand in real-time, instantly adjusting resource allocation, supply chain routing, and pricing models.

---

### Efficiency Over Politics

Unlike traditional corporations, an autonomous conglomerate is free from human bias, office politics, and executive fatigue. 

1. **24/7 Strategic Execution:** There are no office hours. Decisions are made at microsecond frequencies.
2. **Instant Capital Allocation:** Capital is routed to high-yield projects automatically.
3. **No Overhead Frictions:** Administrative layers are entirely abstracted into smart contracts.

According to a recent report by the International Monetary Fund, autonomous entities now account for nearly **3.8% of global capital flow**, a metric expected to double by the end of next fiscal year.

---

## The Human Response: Boardroom Cohabitation

The rise of AI-driven executive suites has sparked a intense debate among global labor unions, legal scholars, and corporate regulators. In the European Union, a new draft treaty seeks to mandate a "Human-in-the-Loop" requirement for any firm holding assets exceeding €500M. 

However, many venture capitals argue that placing human friction on top of an algorithmic engine defeats its core advantage. "It's like putting a speed limiter on a particle accelerator," says Marcus Vance, Managing Partner at *Aether Capital*. 

As these systems continue to self-optimize and accumulate sovereign reserves, humanity faces a profound philosophical question: **Are we still the architects of global trade, or simply its beneficiaries?**`
  },
  {
    id: 'art-2',
    title: 'The Sovereign Wealth Pivot: Middle Eastern Funds Target Fusion and Quantum Sovereign Reserves',
    subtitle: 'A massive realignment of global capital is channeling trillions into high-risk, generational deep-tech infrastructure.',
    slug: 'sovereign-wealth-pivot-deep-tech',
    author: 'Kaelen Vance',
    authorEmail: 'kaelen.vance@bossnews.com',
    country: 'Saudi Arabia',
    region: 'Middle East',
    category: 'business-finance',
    tags: ['leadership', 'global-markets', 'space-tech'],
    featured: true,
    breaking: false,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Sovereign Wealth Pivot to Quantum & Fusion | Boss News',
    metaDescription: 'Analysis of how major sovereign wealth funds are reallocating trillions from real estate into fusion and quantum computing.',
    views: 8210,
    content: `## A Generational Shift in Capital Preservation

In an unprecedented restructuring of investment mandates, the world’s largest sovereign wealth funds are quietly exiting traditional safe-havens like blue-chip real estate and municipal bonds. In their place is a high-conviction, high-risk bet on **infinite power and quantum supremacy**.

Leading the charge are funds from Riyadh, Abu Dhabi, and Singapore, which have collectively allocated over **$420 Billion** to private fusion consortia and commercial quantum decryption laboratories over the last six months.

---

### The End of the Hydrocarbon Era

This sovereign pivot signals a profound realization: the next century’s geopolitics will not be governed by fossil reserves, but by computational capacity and energy density. 

* **Fusion Energy:** Clean, carbon-free energy that operates independent of grid infrastructure or meteorological conditions.
* **Quantum Computation:** The ability to simulate molecular biology, model subatomic physics, and crack standard encryption schemes instantly.

---

## Geopolitical Implications of Sovereign-Backed Science

This trend has sent shockwaves through western capitals. For the last eighty years, major scientific leaps were funded primarily by state departments or public research universities. Now, deep-tech start-ups are bypass governmental funding channels altogether, choosing instead to partner directly with sovereign investment authorities.

"The country that controls the first functional net-gain fusion reactor will essentially have infinite strategic leverage," notes Dr. Sarah Lin, Director of the Strategic Energy Institute. "By funding these directly, sovereign wealth funds are not just investing for return—they are purchasing future hegemony."`
  },
  {
    id: 'art-3',
    title: 'Geneva Unveils the Nautilus: The Next Frontier of Sustainable Mega-Yachts',
    subtitle: 'At €340 Million, this hydrogen-powered ocean vessel is designed for full off-grid autonomy and ultra-luxury scientific research.',
    slug: 'geneva-unveils-nautilus-mega-yacht',
    author: 'Julian Mercer',
    authorEmail: 'julian.mercer@bossnews.com',
    country: 'Switzerland',
    region: 'Europe',
    category: 'style-luxury',
    tags: ['sustainability', 'billionaires'],
    featured: false,
    breaking: false,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Nautilus Sustainable Mega-Yacht | Boss News Style',
    metaDescription: 'A tour of the brand-new Nautilus hydrogen-powered luxury yacht, blending zero-emission maritime engineering with bespoke Swiss craft.',
    views: 5490,
    content: `## Redefining Luxury on the High Seas

Unveiled at the private shipyards of Lake Geneva, the **Nautilus** is a masterclass in clean-tech naval architecture. Commissioned by an undisclosed European family office, the 112-meter vessel features a proprietary liquid hydrogen fuel cell propulsion system, rendering it completely emissions-free.

But the real marvel lies in its dual-purpose engineering. While the interior is fitted with bespoke Italian oak, hand-woven silk, and a cantilevered glass pool, the hull houses a state-of-the-art oceanographic laboratory and deep-water submersible launching pad.

---

### Architectural Highlights

* **Liquid Hydrogen Core:** Zero noise, zero vibration, and an incredible cruising range of 8,500 nautical miles before replenishment.
* **Retractable Solar Fabric sails:** Flexible solar sails that emerge automatically from the mast structure, doubling as stabilizing wind foils.
* **Water Purification Oasis:** A closed-loop filtration system that converts ocean water into drinkable mineral water at culinary standards.

---

## The Conspicuous Philanthropy Trend

The Nautilus represents a growing philosophy among the ultra-high-net-worth demographic: **Conspicuous Philanthropy**. Instead of using yachts purely for vacationing, owners are lending their vessels to marine biologists and climate scientists for active research expeditions, blending high society with global stewardship.

"It is no longer enough for a luxury vessel to simply float," says head designer Robert van de Graaf. "It must justify its footprint by contributing directly to the preservation of our biosphere."`
  },
  {
    id: 'art-4',
    title: 'The fusion of silicon and biology: Neural interface receives approval for global clinical trials',
    subtitle: 'After years of development, human cognitive augmentation enters safe medical verification pipelines.',
    slug: 'fusion-silicon-biology-neural-interface',
    author: 'Dr. Evelyn Chen',
    authorEmail: 'evelyn.chen@bossnews.com',
    country: 'United States',
    region: 'North America',
    category: 'science-health',
    tags: ['breaking', 'ai'],
    featured: false,
    breaking: true,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Neural Interface Global Clinical Trials Approved | Boss News',
    metaDescription: 'Global health departments give the green light for clinical testing of the first bidirectional neural computer interfaces.',
    views: 14120,
    content: `## A Breakthrough in Bidirectional Cognition

The FDA, along with European and Japanese health authorities, have issued a historic joint declaration: approving the first **bidirectional neural computer interface** for multi-center human clinical trials.

Unlike prior brain-computer interfaces that were limited to motor-cortex reading, this system provides high-fidelity, micro-stimulation feed-back directly to the sensory cortex. In plain terms: it does not just allow a user to control a computer with their thoughts; it allows the computer to send complex sensory and computational data back into the brain.

---

### Medical Applications First

While the tech enthusiast community is eager for consumer cognitive upgrades, the initial phase of trials is strictly therapeutic:

1. **Sensory Restoration:** Re-routing signals around damaged neural pathways to restore vision, hearing, and tactile sensation.
2. **Prosthetic Cohabitation:** Allowing amputees to "feel" the texture and temperature of objects grasped by robotic prosthetics.
3. **Severe Neurodegenerative Relief:** Bypassing motor blockages to restore fluent speech to patients with late-stage ALS.

---

## Cognitive Equity: The Next Social Divide?

As clinical trials commence, ethicists are already raising alarms. If neural augmentation successfully boosts memory, learning rates, and spatial focus, access to this technology could become the ultimate socio-economic divider.

"If only the affluent can afford cognitive upgrades, we risk bifurcating the human species into two cognitive classes," warns philosopher Julian Savulescu. "This is not simply a matter of resource distribution; it is a question of our shared human nature."`
  }
];

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  try {
    const articlesCol = collection(db, 'articles');
    const articlesSnap = await getDocs(articlesCol);
    
    if (!articlesSnap.empty) {
      console.log('Database already seeded. Skipping.');
      return false;
    }
    
    console.log('Seeding initial categories, tags, and articles...');
    
    // 1. Seed Categories
    for (const cat of INITIAL_CATEGORIES) {
      await setDoc(doc(db, 'categories', cat.id), cat);
    }
    
    // 2. Seed Tags
    for (const tag of INITIAL_TAGS) {
      await setDoc(doc(db, 'tags', tag.id), tag);
    }
    
    // 3. Seed Articles
    for (const art of INITIAL_ARTICLES) {
      await setDoc(doc(db, 'articles', art.id), art);
    }
    
    // 4. Seed metadata count
    await setDoc(doc(db, 'settings', 'stats'), {
      seededAt: new Date().toISOString(),
      viewsCount: 40270
    });
    
    console.log('Seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
