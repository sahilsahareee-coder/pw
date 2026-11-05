import { NextRequest, NextResponse } from "next/server";

interface ChapterTemplate {
  name: string;
  slug: string;
  videos: number;
  notes: number;
  exercises: number;
}

const EARNERS_SUBJECT_CHAPTERS: Record<string, ChapterTemplate[]> = {
  // Mobile Editing
  "mobile-editing-foundations": [
    { name: "01. Workspace Overview & Tool Setup (CapCut & VN)", slug: "ch-01-workspace-setup", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Trimming, Precision Split Cuts & Pacing", slug: "ch-02-trimming-pacing", videos: 5, notes: 3, exercises: 3 },
    { name: "03. Keyframe Animations & Smooth Speed Ramps", slug: "ch-03-keyframes-speedramps", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Video Overlays, Green Screen & PIP Layers", slug: "ch-04-overlays-pip", videos: 5, notes: 3, exercises: 3 },
    { name: "05. Best Export Settings for Crisp 4K Instagram Reels", slug: "ch-05-export-settings", videos: 4, notes: 2, exercises: 2 },
  ],
  "color-grading-cinematic": [
    { name: "01. Color Theory, Highlights, Shadows & Exposure", slug: "ch-01-color-fundamentals", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Installing & Applying Cinematic LUTs", slug: "ch-02-applying-luts", videos: 5, notes: 3, exercises: 3 },
    { name: "03. Signature Teal & Orange Film Color Grade", slug: "ch-03-teal-orange-grading", videos: 6, notes: 3, exercises: 3 },
    { name: "04. Adding Film Grain, Glow & Light Leak Textures", slug: "ch-04-film-grain-textures", videos: 5, notes: 2, exercises: 2 },
  ],
  "audio-design-sfx": [
    { name: "01. Sound Effects (SFX) Essentials & Categorization", slug: "ch-01-sfx-essentials", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Beat Syncing & Dynamic Transition Whooshes", slug: "ch-02-beat-syncing", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Voice Denoising & Vocal EQ for Crisp Voiceover", slug: "ch-03-vocal-denoising", videos: 5, notes: 3, exercises: 2 },
    { name: "04. Finding Royalty-Free Viral Background Music", slug: "ch-04-royalty-free-music", videos: 4, notes: 2, exercises: 2 },
  ],
  "short-form-storytelling": [
    { name: "01. The 3-Second Viral Hook Blueprint", slug: "ch-01-viral-hook-blueprint", videos: 5, notes: 3, exercises: 3 },
    { name: "02. Dynamic Subtitles & Animated Captions", slug: "ch-02-dynamic-subtitles", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Pacing, B-Roll & Visual Pattern Interrupts", slug: "ch-03-pattern-interrupts", videos: 5, notes: 3, exercises: 3 },
    { name: "04. Retention Curve Analysis & Instagram Algorithm", slug: "ch-04-retention-algorithm", videos: 5, notes: 3, exercises: 2 },
  ],
  "freelance-client-pitching": [
    { name: "01. Building a Killer 60-Second Video Showreel", slug: "ch-01-killer-showreel", videos: 5, notes: 4, exercises: 3 },
    { name: "02. Finding Creators & Instagram DM Outreach Templates", slug: "ch-02-dm-outreach-templates", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Pricing Your Work (₹2,000–₹5,000 per Reel / Retainers)", slug: "ch-03-pricing-retainers", videos: 5, notes: 3, exercises: 2 },
    { name: "04. Delivering Revisions & Getting Client Testimonials", slug: "ch-04-client-testimonials", videos: 4, notes: 3, exercises: 2 },
  ],

  // AI & ChatGPT
  "chatgpt-prompt-engineering": [
    { name: "01. ChatGPT 4o Fundamentals & Core Architecture", slug: "ch-01-chatgpt-architecture", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Advanced Prompt Engineering (Role-Task-Context-Format)", slug: "ch-02-prompt-frameworks", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Custom Instructions & Memory Management", slug: "ch-03-custom-instructions", videos: 5, notes: 3, exercises: 2 },
    { name: "04. Building Custom GPTs for Content & Research", slug: "ch-04-building-custom-gpts", videos: 6, notes: 4, exercises: 3 },
    { name: "05. Analyzing Data & Documents with ChatGPT Code Interpreter", slug: "ch-05-code-interpreter", videos: 5, notes: 3, exercises: 3 },
  ],
  "ai-image-generation": [
    { name: "01. Midjourney V6 Setup & Discord Workspace", slug: "ch-01-midjourney-setup", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Photorealistic Character & Product Photography Prompts", slug: "ch-02-photorealistic-prompts", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Style Mimicking, Aspect Ratios & Camera Angles", slug: "ch-03-camera-angles-styles", videos: 5, notes: 3, exercises: 3 },
    { name: "04. Flux & Stable Diffusion Free Open-Source Workflows", slug: "ch-04-flux-stable-diffusion", videos: 5, notes: 3, exercises: 2 },
  ],
  "ai-video-generation": [
    { name: "01. Creating AI Avatars & Talking Heads with HeyGen", slug: "ch-01-heygen-avatars", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Text-to-Video & Image-to-Video with Runway Gen-3", slug: "ch-02-runway-gen3", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Realistic Voice Cloning & Voiceovers with ElevenLabs", slug: "ch-03-elevenlabs-voice-clone", videos: 5, notes: 3, exercises: 2 },
    { name: "04. Producing 100% AI-Generated Viral YouTube Shorts", slug: "ch-04-ai-shorts-pipeline", videos: 6, notes: 4, exercises: 3 },
  ],
  "ai-automations": [
    { name: "01. Introduction to Make.com & Automation Logic", slug: "ch-01-makecom-basics", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Connecting Google Sheets, Airtable & Telegram Webhooks", slug: "ch-02-webhooks-integrations", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Automated AI Social Media Publishing Engine", slug: "ch-03-social-publishing-engine", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Building AI Customer Support Chatbots for Websites", slug: "ch-04-ai-support-chatbots", videos: 5, notes: 3, exercises: 3 },
  ],
  "ai-monetization-freelance": [
    { name: "01. Packaging AI Services (Chatbots, Content, Automation)", slug: "ch-01-packaging-ai-services", videos: 5, notes: 4, exercises: 2 },
    { name: "02. Finding Local Businesses and Real Estate Clients", slug: "ch-02-local-business-outreach", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Pitching Automation Retainers ($500–$1,500/month)", slug: "ch-03-retainer-pitching", videos: 5, notes: 3, exercises: 2 },
    { name: "04. Case Study: Scaling an AI Agency from Scratch", slug: "ch-04-agency-case-study", videos: 5, notes: 3, exercises: 2 },
  ],

  // YouTube Content Creation
  "youtube-niche-setup": [
    { name: "01. High-CPM Niches with Massive Growth in 2024–2025", slug: "ch-01-high-cpm-niches", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Outlier Video Research & Reverse Engineering Competitors", slug: "ch-02-competitor-outliers", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Setting Up a Verified YouTube Brand Account", slug: "ch-03-brand-account-setup", videos: 4, notes: 2, exercises: 2 },
    { name: "04. YouTube SEO: Title Writing & Keyword Ingestion", slug: "ch-04-seo-titles-keywords", videos: 5, notes: 3, exercises: 3 },
  ],
  "viral-scriptwriting": [
    { name: "01. The Hook-Retain-Deliver Script Framework", slug: "ch-01-script-framework", videos: 5, notes: 4, exercises: 3 },
    { name: "02. Building Curiosity Gaps & Mini-Cliffhangers", slug: "ch-02-curiosity-gaps", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Storyboarding B-Roll & Visual Transitions", slug: "ch-03-storyboarding-broll", videos: 5, notes: 3, exercises: 2 },
    { name: "04. Voice Modulation, Pacing & Teleprompter Workflow", slug: "ch-04-voice-teleprompter", videos: 5, notes: 3, exercises: 2 },
  ],
  "high-ctr-thumbnails": [
    { name: "01. Eye Tracking & Visual Psychology of 15%+ CTR", slug: "ch-01-ctr-psychology", videos: 5, notes: 4, exercises: 3 },
    { name: "02. Bold Typography, Color Grading & Subject Isolation", slug: "ch-02-typography-isolation", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Designing Thumbnails in Photoshop & Canva Step-by-Step", slug: "ch-03-photoshop-canva-design", videos: 6, notes: 4, exercises: 3 },
    { name: "04. A/B Testing Thumbnails with YouTube Native Tools", slug: "ch-04-ab-testing-native", videos: 4, notes: 2, exercises: 2 },
  ],
  "youtube-seo-algorithm": [
    { name: "01. How the YouTube Recommendation Engine Actually Works", slug: "ch-01-algorithm-engine", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Understanding Click-Through Rate (CTR) and Average View Duration (AVD)", slug: "ch-02-ctr-avd-metrics", videos: 6, notes: 3, exercises: 3 },
    { name: "03. Decoding YouTube Studio Analytics for Explosive Growth", slug: "ch-03-studio-analytics", videos: 5, notes: 3, exercises: 2 },
    { name: "04. YouTube Shorts Algorithm vs Long-Form Videos", slug: "ch-04-shorts-vs-longform", videos: 5, notes: 3, exercises: 2 },
  ],
  "sponsorships-monetization": [
    { name: "01. AdSense Monetization Criteria & Payment Setup", slug: "ch-01-adsense-monetization", videos: 4, notes: 3, exercises: 2 },
    { name: "02. Creating a Professional Media Kit for Sponsors", slug: "ch-02-media-kit-creation", videos: 5, notes: 4, exercises: 3 },
    { name: "03. Pitching Brands for Paid Integrations (Email Templates)", slug: "ch-03-brand-pitching-emails", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Affiliate Marketing & Selling Digital Products", slug: "ch-04-affiliate-digital-products", videos: 5, notes: 3, exercises: 2 },
  ],

  // Web Development
  "html-css-tailwindcss": [
    { name: "01. HTML5 Semantic Elements & Responsive Viewports", slug: "ch-01-html5-semantics", videos: 5, notes: 3, exercises: 3 },
    { name: "02. Modern CSS: Flexbox & CSS Grid Deep Dive", slug: "ch-02-flexbox-grid", videos: 6, notes: 4, exercises: 3 },
    { name: "03. TailwindCSS Configuration & Mobile-First Styling", slug: "ch-03-tailwindcss-styling", videos: 6, notes: 3, exercises: 3 },
    { name: "04. Building a High-Converting SaaS Landing Page", slug: "ch-04-saas-landing-page", videos: 6, notes: 4, exercises: 4 },
  ],
  "javascript-mastery": [
    { name: "01. JavaScript Variables, Scopes, Arrow Functions & ES6+", slug: "ch-01-js-fundamentals", videos: 6, notes: 4, exercises: 3 },
    { name: "02. DOM Manipulation, Event Listeners & UI State", slug: "ch-02-dom-event-listeners", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Asynchronous JavaScript: Promises & Async/Await", slug: "ch-03-async-promises", videos: 6, notes: 3, exercises: 3 },
    { name: "04. Fetching Real-Time REST APIs & Dynamic Rendering", slug: "ch-04-fetching-apis", videos: 5, notes: 3, exercises: 3 },
  ],
  "react-nextjs-fullstack": [
    { name: "01. React Components, Props, JSX & State Management", slug: "ch-01-react-components-state", videos: 6, notes: 4, exercises: 3 },
    { name: "02. Essential Hooks: useState, useEffect, useRef & useMemo", slug: "ch-02-essential-hooks", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Next.js App Router, Dynamic Routing & Server Components", slug: "ch-03-nextjs-app-router", videos: 6, notes: 4, exercises: 4 },
    { name: "04. API Routes, Server Actions & Production Build Optimization", slug: "ch-04-api-routes-actions", videos: 6, notes: 4, exercises: 3 },
  ],
  "backend-databases-apis": [
    { name: "01. Node.js & Express REST API Setup", slug: "ch-01-nodejs-express-setup", videos: 5, notes: 3, exercises: 3 },
    { name: "02. MongoDB & Mongoose Schema Architecture", slug: "ch-02-mongodb-schemas", videos: 6, notes: 4, exercises: 3 },
    { name: "03. JWT Authentication & Password Hashing with Bcrypt", slug: "ch-03-jwt-authentication", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Payment Gateway Integration (Stripe & Razorpay)", slug: "ch-04-payment-gateways", videos: 6, notes: 4, exercises: 3 },
  ],
  "deploying-client-projects": [
    { name: "01. Deploying on Vercel, Railway & Custom Domains", slug: "ch-01-vercel-railway-deployment", videos: 5, notes: 3, exercises: 2 },
    { name: "02. On-Page SEO, OpenGraph Tags & Lighthouse 100 Score", slug: "ch-02-seo-lighthouse-optimization", videos: 5, notes: 3, exercises: 2 },
    { name: "03. Freelance Web Development Contracts & Pricing ($1,000+)", slug: "ch-03-web-freelance-pricing", videos: 5, notes: 4, exercises: 2 },
    { name: "04. Client Handover, Hosting Subscriptions & Maintenance", slug: "ch-04-client-handover-maintenance", videos: 4, notes: 3, exercises: 2 },
  ],

  // Freelancing & Client Acquisition
  "upwork-fiverr-optimization": [
    { name: "01. Creating a 100% Standout Upwork Profile & Title", slug: "ch-01-upwork-profile-creation", videos: 5, notes: 4, exercises: 3 },
    { name: "02. Writing Winning Upwork Proposals (High Response Rate)", slug: "ch-02-winning-proposals", videos: 6, notes: 4, exercises: 3 },
    { name: "03. Designing Top-Ranking Fiverr Gigs & Video Previews", slug: "ch-03-fiverr-gig-ranking", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Winning Your First 5-Star Review Fast", slug: "ch-04-first-5star-review", videos: 5, notes: 3, exercises: 2 },
  ],
  "cold-emailing-linkedin": [
    { name: "01. Scraping Targeted Business Leads using Apollo & Google Maps", slug: "ch-01-lead-scraping-apollo", videos: 6, notes: 4, exercises: 3 },
    { name: "02. Cold Email Copywriting That Gets Opened and Replied", slug: "ch-02-cold-email-copywriting", videos: 6, notes: 4, exercises: 3 },
    { name: "03. The Loom Video Strategy: 3-Minute Audits That Sell", slug: "ch-03-loom-video-strategy", videos: 5, notes: 3, exercises: 3 },
    { name: "04. LinkedIn Organic Networking & DM Inbound Systems", slug: "ch-04-linkedin-inbound-networking", videos: 5, notes: 3, exercises: 2 },
  ],
  "pitching-discovery-calls": [
    { name: "01. Structuring the 20-Minute Client Discovery Call", slug: "ch-01-discovery-call-structure", videos: 5, notes: 4, exercises: 3 },
    { name: "02. Diagnosing Client Pain Points & Value-Based Framing", slug: "ch-02-diagnosing-pain-points", videos: 5, notes: 3, exercises: 2 },
    { name: "03. Handling Objections: 'It is too expensive' & 'Send portfolio'", slug: "ch-03-handling-price-objections", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Closing the Deal & Sending the Payment Link on the Call", slug: "ch-04-closing-payment-links", videos: 5, notes: 3, exercises: 2 },
  ],
};

function getCurriculumChapters(subjectIdentifier: string, batchId: string) {
  const norm = (subjectIdentifier || "").toLowerCase();

  // Check direct slug match
  for (const [key, chapters] of Object.entries(EARNERS_SUBJECT_CHAPTERS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return chapters.map((c, i) => ({
        _id: `top_${batchId.slice(0, 6)}_${key.slice(0, 8)}_${i + 1}`,
        name: c.name,
        slug: c.slug,
        description: `Full syllabus lessons, project files, and exercises for ${c.name}.`,
        videos: c.videos,
        videosCount: c.videos,
        notes: c.notes,
        notesCount: c.notes,
        exercises: c.exercises,
        dppsCount: c.exercises,
      }));
    }
  }

  // Fallback 5 comprehensive modules
  const fallbackModules: ChapterTemplate[] = [
    { name: "01. Introduction, Fundamentals & Core Concept Breakdown", slug: "ch-01-core-breakdown", videos: 5, notes: 3, exercises: 2 },
    { name: "02. Tooling Setup, Step-by-Step Hands-on Walkthrough", slug: "ch-02-hands-on-walkthrough", videos: 5, notes: 3, exercises: 3 },
    { name: "03. Intermediate Project Work & Practical Execution", slug: "ch-03-intermediate-execution", videos: 6, notes: 4, exercises: 3 },
    { name: "04. Advanced AI Workflows & Optimization Secrets", slug: "ch-04-advanced-ai-secrets", videos: 5, notes: 3, exercises: 2 },
    { name: "05. Client Case Studies, Freelance Roadmap & Invoicing", slug: "ch-05-freelance-invoicing", videos: 5, notes: 4, exercises: 3 },
  ];

  return fallbackModules.map((c, i) => ({
    _id: `top_${batchId.slice(0, 6)}_${norm.slice(0, 6)}_${i + 1}`,
    name: c.name,
    slug: c.slug,
    description: `Full lessons, guides, and exercises for ${c.name}.`,
    videos: c.videos,
    videosCount: c.videos,
    notes: c.notes,
    notesCount: c.notes,
    exercises: c.exercises,
    dppsCount: c.exercises,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("BatchId") || searchParams.get("batchId") || "66e010010000000000000001";
  const subjectId = searchParams.get("SubjectId") || searchParams.get("subjectId") || "";
  const slugParam = searchParams.get("slug");
  const idParam = searchParams.get("id");

  const bestIdentifier = slugParam || subjectId || idParam || "editing";
  const topics = getCurriculumChapters(bestIdentifier, batchId);

  return NextResponse.json({
    success: true,
    status: 200,
    isLocked: false,
    data: topics,
  });
}
