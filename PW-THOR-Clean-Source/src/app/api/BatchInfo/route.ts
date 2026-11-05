import { NextRequest, NextResponse } from "next/server";
import fallbackData from "@/data/batches.json";
import { BatchDetailData } from "@/types";

interface BatchSubjectConfig {
  name: string;
  slug: string;
  description: string;
  lectureCount: number;
  tagCount: number;
}

const EARNERS_BATCH_SUBJECTS: Record<string, BatchSubjectConfig[]> = {
  // Mobile Video Editing
  "66e010010000000000000001": [
    { name: "CapCut & VN Editor Foundations", slug: "mobile-editing-foundations", description: "Mobile timeline, trimming, split cuts, keyframes & pacing", lectureCount: 6, tagCount: 5 },
    { name: "Color Grading & Cinematic Overlays", slug: "color-grading-cinematic", description: "LUTs, saturation, film glow, textures & speed ramps", lectureCount: 6, tagCount: 5 },
    { name: "Audio Design & Viral SFX Beats", slug: "audio-design-sfx", description: "Foley, whooshes, beat sync, voice enhancement & background music", lectureCount: 6, tagCount: 5 },
    { name: "Short-Form Storytelling & Viral Hooks", slug: "short-form-storytelling", description: "3-second hook psychology, captions, retention graphs & pacing", lectureCount: 6, tagCount: 5 },
    { name: "Freelance Client Pitching & Pricing", slug: "freelance-client-pitching", description: "Portfolio showcase, rate cards (₹2,000-₹5,000/reel) & client outreach", lectureCount: 5, tagCount: 4 },
  ],
  // AI & ChatGPT
  "66e010010000000000000002": [
    { name: "ChatGPT 4o & Prompt Engineering", slug: "chatgpt-prompt-engineering", description: "Zero-shot, few-shot prompting, custom GPTs & workflow automation", lectureCount: 6, tagCount: 5 },
    { name: "Generative AI Images (Midjourney & Flux)", slug: "ai-image-generation", description: "Photorealistic prompts, style matching, upscaling & negative prompts", lectureCount: 6, tagCount: 5 },
    { name: "AI Video Generation & Avatars (HeyGen & Runway)", slug: "ai-video-generation", description: "Lip-sync avatars, text-to-video, voice cloning & dynamic reels", lectureCount: 6, tagCount: 5 },
    { name: "AI Automation with Make.com & Zapier", slug: "ai-automations", description: "No-code automation workflows, webhook triggers & API integrations", lectureCount: 6, tagCount: 5 },
    { name: "Monetizing AI Services for Clients", slug: "ai-monetization-freelance", description: "Selling AI-generated content, chatbots & automations to businesses", lectureCount: 5, tagCount: 4 },
  ],
  // YouTube Content Creation
  "66e010010000000000000003": [
    { name: "Channel Setup & High-CPM Niche Research", slug: "youtube-niche-setup", description: "Niche selection, branding, channel art, settings & monetization roadmap", lectureCount: 6, tagCount: 5 },
    { name: "Viral Scriptwriting & Storyboarding", slug: "viral-scriptwriting", description: "Retention curves, open loops, 3-act storytelling & audience triggers", lectureCount: 6, tagCount: 5 },
    { name: "High-CTR Thumbnail Design & Psychology", slug: "high-ctr-thumbnails", description: "Color theory, facial expressions, curiosity gaps & A/B testing", lectureCount: 6, tagCount: 5 },
    { name: "Video SEO, Tags & Algorithm Secrets", slug: "youtube-seo-algorithm", description: "CTR, AVD, search ranking, browse features & YouTube Studio analytics", lectureCount: 6, tagCount: 5 },
    { name: "Brand Deals & Sponsorship Monetization", slug: "sponsorships-monetization", description: "Media kits, brand outreach emails, pricing formulas & affiliate marketing", lectureCount: 5, tagCount: 4 },
  ],
  // Instagram Growth
  "66e010010000000000000004": [
    { name: "Instagram Algorithm & Profile Optimization", slug: "instagram-algorithm-profile", description: "Bio hooks, aesthetic grid, highlight covers & keyword SEO", lectureCount: 6, tagCount: 5 },
    { name: "Viral Reel Formats & Content Calendar", slug: "viral-reels-strategy", description: "Trending audio, hook templates, carousel structures & batch production", lectureCount: 6, tagCount: 5 },
    { name: "Personal Branding & Community Engagement", slug: "personal-branding-growth", description: "Story polls, broadcast channels, DM automation & superfan building", lectureCount: 6, tagCount: 5 },
    { name: "Social Media Management for Businesses", slug: "smm-client-management", description: "Managing client handles, analytics reporting & monthly retainer pitches", lectureCount: 6, tagCount: 5 },
    { name: "Monetizing Through Paid Brand Collabs", slug: "brand-collabs-influencer", description: "Rate cards, sponsored reels, affiliate links & digital products", lectureCount: 5, tagCount: 4 },
  ],
  // Mobile Graphic Designing
  "66e010010000000000000005": [
    { name: "Mobile Design Principles & Color Theory", slug: "mobile-design-principles", description: "Visual hierarchy, typography pairs, contrast, margins & grids", lectureCount: 6, tagCount: 5 },
    { name: "Canva Pro Mastery for Posters & Posts", slug: "canva-pro-mastery", description: "Layering, magic tools, background removal & brand kits", lectureCount: 6, tagCount: 5 },
    { name: "Pixellab Advanced Typography & Manipulation", slug: "pixellab-typography-design", description: "3D text, custom fonts, shading, textures & vector styling", lectureCount: 6, tagCount: 5 },
    { name: "YouTube Thumbnail & Banner Design", slug: "thumbnail-banner-design", description: "Bold focal points, outline strokes, light leaks & eye tracking", lectureCount: 6, tagCount: 5 },
    { name: "Brand Identity Packs & Client Deliverables", slug: "brand-identity-packs", description: "Packaging logos, social media templates & delivery formats", lectureCount: 5, tagCount: 4 },
  ],
  // Video Editing with AI
  "66e010010000000000000006": [
    { name: "Adobe Premiere Pro Interface & Timeline", slug: "premiere-pro-interface", description: "Project setup, proxies, sequence settings, J-cuts & L-cuts", lectureCount: 6, tagCount: 5 },
    { name: "Color Correction, LUTs & Lumetri Scopes", slug: "lumetri-color-grading", description: "Waveforms, vectorscopes, matching shots & cinematic film looks", lectureCount: 6, tagCount: 5 },
    { name: "Motion Graphics & Kinetic Typography", slug: "after-effects-motion", description: "Keyframe easing, text animators, masking & lower thirds", lectureCount: 6, tagCount: 5 },
    { name: "Sound Design, Foley & Multitrack Mixing", slug: "premiere-audio-design", description: "Parametric EQ, compression, de-noising & cinematic sound beds", lectureCount: 6, tagCount: 5 },
    { name: "High-Ticket Client Portfolio & Delivery", slug: "client-portfolio-delivery", description: "Showreel creation, revisions handling, cloud delivery & invoice templates", lectureCount: 5, tagCount: 4 },
  ],
  // Full Stack Web Development
  "66e010010000000000000007": [
    { name: "HTML5, Modern CSS & TailwindCSS", slug: "html-css-tailwindcss", description: "Semantic markup, flexbox, CSS grid & modern utility-first styling", lectureCount: 6, tagCount: 5 },
    { name: "JavaScript Mastery & ES6+", slug: "javascript-mastery", description: "DOM manipulation, async/await, closures, promises & API calls", lectureCount: 6, tagCount: 5 },
    { name: "React.js & Next.js Full Stack", slug: "react-nextjs-fullstack", description: "Components, hooks, server components, dynamic routing & SSR", lectureCount: 6, tagCount: 5 },
    { name: "Node.js, Express & Database APIs", slug: "backend-databases-apis", description: "REST APIs, authentication (JWT), MongoDB, PostgreSQL & security", lectureCount: 6, tagCount: 5 },
    { name: "Deploying & Selling Web Apps to Clients", slug: "deploying-client-projects", description: "Vercel, custom domains, SEO optimization & selling freelance websites", lectureCount: 5, tagCount: 4 },
  ],
  // Data Analytics
  "66e010010000000000000008": [
    { name: "Python for Data Analysis", slug: "python-data-analysis", description: "Python fundamentals, functions, data types & virtual environments", lectureCount: 6, tagCount: 5 },
    { name: "Pandas, NumPy & Data Cleaning", slug: "pandas-numpy-cleaning", description: "DataFrames, handling missing values, filtering & aggregations", lectureCount: 6, tagCount: 5 },
    { name: "SQL & Database Querying", slug: "sql-database-querying", description: "SELECT, JOINs, GROUP BY, subqueries, CTEs & database design", lectureCount: 6, tagCount: 5 },
    { name: "PowerBI & Tableau Interactive Dashboards", slug: "powerbi-tableau-dashboards", description: "KPI cards, data modeling, DAX formulas & client presentation", lectureCount: 6, tagCount: 5 },
    { name: "AI Data Insights & Freelance Analytics", slug: "ai-data-insights-freelance", description: "Using ChatGPT for data insights & pitching business analytics gigs", lectureCount: 5, tagCount: 4 },
  ],
  // Freelancing & Client Acquisition
  "66e010010000000000000011": [
    { name: "Upwork & Fiverr Profile Optimization", slug: "upwork-fiverr-optimization", description: "Keyword-rich bios, gig video thumbnails, portfolio projects & badges", lectureCount: 6, tagCount: 5 },
    { name: "Cold Emailing & LinkedIn Inbound Leads", slug: "cold-emailing-linkedin", description: "Finding decision makers, personalized loom videos & email copy", lectureCount: 6, tagCount: 5 },
    { name: "Pitching & Client Discovery Calls", slug: "pitching-discovery-calls", description: "Overcoming objections, consultative selling & closing high-ticket deals", lectureCount: 6, tagCount: 5 },
    { name: "Pricing, International Payments & Contracts", slug: "pricing-payments-contracts", description: "Value-based pricing, Stripe/PayPal setup & client agreement templates", lectureCount: 6, tagCount: 5 },
    { name: "Building a Scalable Digital Agency", slug: "building-digital-agency", description: "SOPs, hiring sub-contractors, client retention & scaling past $5k/month", lectureCount: 5, tagCount: 4 },
  ],
};

// Default subjects for any other PW Earners batch
const DEFAULT_EARNERS_SUBJECTS: BatchSubjectConfig[] = [
  { name: "Foundations & Core Principles", slug: "core-foundations", description: "Fundamental skill breakdown, tools setup & initial walkthrough", lectureCount: 6, tagCount: 5 },
  { name: "Intermediate Hands-on Projects", slug: "intermediate-projects", description: "Real-world project execution with industry best practices", lectureCount: 6, tagCount: 5 },
  { name: "Advanced Industry Workflows & AI", slug: "advanced-ai-workflows", description: "Leveraging modern AI tools to 10x your output and quality", lectureCount: 6, tagCount: 5 },
  { name: "Portfolio & Client Case Studies", slug: "portfolio-case-studies", description: "Building standout portfolio pieces that convince paying clients", lectureCount: 6, tagCount: 5 },
  { name: "Freelancing & Career Roadmap", slug: "freelancing-career-roadmap", description: "Client outreach, pricing strategies & landing your first paid gig", lectureCount: 5, tagCount: 4 },
];

function buildBatchDetails(batchId: string): BatchDetailData {
  const allBatches: any[] = (fallbackData as any)?.data || [];
  const matched = allBatches.find((b) => b._id === batchId || b.batchId === batchId);

  const name = matched?.batchName || "PW Earners Masterclass";
  const image =
    matched?.batchImage ||
    "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/4f17deae-eab1-4b19-b5cb-2bb2291d60e5.jpg";

  const rawSubjects = EARNERS_BATCH_SUBJECTS[batchId] || DEFAULT_EARNERS_SUBJECTS;

  const subjects = rawSubjects.map((s, idx) => ({
    _id: `sub_${batchId.slice(0, 10)}_${s.slug}`,
    subject: s.name,
    subjectId: `sub_${batchId.slice(0, 10)}_${s.slug}`,
    slug: s.slug,
    description: s.description,
    lectureCount: s.lectureCount,
    tagCount: s.tagCount,
    teacherIds: [
      {
        _id: `faculty_${idx + 1}`,
        firstName: "PW",
        lastName: "Industry Mentor",
        qualification: "Senior Professional & Top Freelancer",
        subject: s.name,
      },
    ],
  }));

  return {
    _id: batchId,
    name,
    batchCode: `PWE-${batchId.slice(-4).toUpperCase()}`,
    byName: matched?.byName || "PW Earners • Upskilling & Freelancing",
    class: "Beginner to Advanced (All Learners)",
    description: `Official comprehensive curriculum for ${name}. Designed to help you build real-world digital skills, build a client-ready portfolio, and start earning through freelancing and digital careers. Includes complete HD video lectures, project files, guides, and assignments.`,
    shortDescription: "Job-ready skills, practical projects, and freelance roadmap by PW Earners.",
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    startDate: matched?.startDate || "2024-06-01",
    status: "ACTIVE",
    language: matched?.language || "Hinglish",
    isPurchased: true,
    batchPrice: 0,
    fee: {
      amount: 4999,
      discount: 4999,
      total: 0,
    },
    subjects,
    program: {
      name: "PW Earners Initiative",
      exam: ["Freelancing", "Skill Certification", "Portfolio"],
      language: matched?.language || "Hinglish",
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("BatchId");

  if (!batchId) {
    return NextResponse.json(
      { success: false, errorType: "BAD_REQUEST", message: "Missing required parameter: BatchId" },
      { status: 400 }
    );
  }

  // Validate format (MongoDB ObjectId is 24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(batchId)) {
    return NextResponse.json(
      { success: false, errorType: "INVALID_ID", message: `Invalid batch ID format: "${batchId}"` },
      { status: 400 }
    );
  }

  const batchDetails = buildBatchDetails(batchId);

  return NextResponse.json({
    success: true,
    data: batchDetails,
    isFallback: false,
  });
}
