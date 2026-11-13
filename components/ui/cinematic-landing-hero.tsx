"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Activity, Eye, Sparkles, Timer, Database, Brain, Star, CheckCircle2, TrendingUp, ShieldCheck, Award } from "lucide-react";
import ShapeGrid from '@/components/ShapeGrid';

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const REVIEWS_ROW_1 = [
  {
    name: "Aarav Sharma",
    branch: "B.Tech CSE '25",
    metric: "+1.38 SGPA",
    quote: "The SGPA simulator is a lifesaver before mid-sems. I simulated 3 grade scenarios and hit my target 9.12 CGPA exactly.",
    avatar: "AS",
    color: "#bbf246"
  },
  {
    name: "Sneha Patel",
    branch: "B.Tech IT '26",
    metric: "45-Day Streak",
    quote: "Focus Kaizen with biological pacing stopped my burnout during finals. Easily the most polished app built for KIITians.",
    avatar: "SP",
    color: "#38bdf8"
  },
  {
    name: "Rohan Mukherjee",
    branch: "B.Tech CSSE '25",
    metric: "100% Parsing",
    quote: "Grade ingestion parsed my entire SAP portal grade report in under 2 seconds. No manual entry, zero errors.",
    avatar: "RM",
    color: "#4ade80"
  },
  {
    name: "Priya Verma",
    branch: "B.Tech ECSc '26",
    metric: "Neural Mentor",
    quote: "Neural Advisor answered my exact syllabus queries with KIIT course codes in real time. Feels like an AI proctor in my pocket.",
    avatar: "PV",
    color: "#bbf246"
  }
];

const REVIEWS_ROW_2 = [
  {
    name: "Debashish Jena",
    branch: "B.Tech ETC '25",
    metric: "Zero Backlogs",
    quote: "Optimization Engine identified high-leverage subjects for improvement exams. My SGPA jumped from 7.4 to 8.65 in one sem.",
    avatar: "DJ",
    color: "#facc15"
  },
  {
    name: "Ananya Mishra",
    branch: "B.Tech CSE '24",
    metric: "9.62 CGPA",
    quote: "Deterministic SGPA forecasting eliminated all exam anxiety. The tactile Apple-grade design makes tracking grades exciting.",
    avatar: "AM",
    color: "#a855f7"
  },
  {
    name: "Kavya Singhania",
    branch: "B.Tech CSCE '26",
    metric: "Sleep Sync",
    quote: "Cognitive Sync predicted my burnout two days before mid-sems and suggested paced breaks. Saved my mental health.",
    avatar: "KS",
    color: "#38bdf8"
  },
  {
    name: "Vikramaditya Roy",
    branch: "B.Tech EE '25",
    metric: "Top 5% Rank",
    quote: "The dynamic grade weighting matches KIIT's relative curve down to decimal points. An indispensable utility.",
    avatar: "VR",
    color: "#bbf246"
  }
];

const FEATURES = [
  { title: "SGPA Simulator", desc: "Scenario-based simulation engine for risk analysis and grade forecasting.", icon: Activity, color: "#bbf246" },
  { title: "Optimization Engine", desc: "Algorithmic identification of high-leverage subjects for improvement exams.", icon: Eye, color: "#a3e635" },
  { title: "Neural Advisor", desc: "Context-aware chat assistant for academic queries using Gemini 3 Flash.", icon: Sparkles, color: "#bbf246", isNew: true },
  { title: "Focus Kaizen", desc: "Adaptive Pomodoro timer with biological pacing to manage cognitive load.", icon: Timer, color: "#facc15", isNew: true },
  { title: "Grade Ingestion", desc: "Local-first PDF parsing pipeline for KIIT Semester Grade Reports.", icon: Database, color: "#4ade80" },
  { title: "Cognitive Sync", desc: "Daily wellness & sleep tracking to predict burnout before it breaks you.", icon: Brain, color: "#bbf246", isNew: true },
];

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
      transform: translateZ(0);
      contain: strict;
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* -------------------------------------------------------------------
     PHYSICAL SKEUOMORPHIC MATERIALS (Restored 3D Depth & Dynamic Dark/Light Mode)
  ---------------------------------------------------------------------- */
  
  /* OUTSIDE THE CARD: Theme-aware text (Shadow in Light Mode, Glow in Dark Mode) */
  .text-3d-matte {
      color: var(--foreground, #000000);
      text-shadow: 
          0 10px 30px color-mix(in srgb, var(--foreground, #000000) 15%, transparent), 
          0 2px 4px color-mix(in srgb, var(--foreground, #000000) 8%, transparent);
  }
  .dark .text-3d-matte {
      color: var(--foreground, #ffffff);
      text-shadow: 
          0 10px 30px color-mix(in srgb, var(--foreground, #ffffff) 20%, transparent), 
          0 2px 4px color-mix(in srgb, var(--foreground, #ffffff) 10%, transparent);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, #18181b 0%, #71717a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0); /* Hardware acceleration to prevent WebKit clipping bug */
      filter: drop-shadow(0px 6px 12px rgba(0, 0, 0, 0.08));
  }
  .dark .text-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #71717a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0px 10px 20px rgba(0, 0, 0, 0.8));
  }

  /* INSIDE THE CARD: Dynamic Light/Dark Mode Typography */
  .text-card-silver-matte {
      background: linear-gradient(180deg, #09090b 0%, #52525b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.08));
  }
  .dark .text-card-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0px 12px 24px rgba(0,0,0,0.8));
  }

  /* Deep Physical Card: White Porcelain in Light Mode, Obsidian Titanium in Dark Mode */
  .premium-depth-card {
      background: linear-gradient(145deg, #ffffff 0%, #f4f4f6 100%);
      box-shadow: 
          0 30px 60px -15px rgba(0, 0, 0, 0.08),
          0 10px 25px -10px rgba(0, 0, 0, 0.04),
          inset 0 1px 2px rgba(255, 255, 255, 1),
          inset 0 -2px 4px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.08);
      position: relative;
  }
  .dark .premium-depth-card {
      background: linear-gradient(145deg, #0e121b 0%, #06080e 100%);
      box-shadow: 
          0 40px 100px -20px rgba(0, 0, 0, 0.9),
          0 20px 40px -20px rgba(0, 0, 0, 0.8),
          inset 0 1px 2px rgba(255, 255, 255, 0.12),
          inset 0 -2px 4px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03) 0%, transparent 40%);
      mix-blend-mode: multiply; transition: opacity 0.3s ease;
  }
  .dark .card-sheen {
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06) 0%, transparent 40%);
      mix-blend-mode: screen;
  }

  /* Realistic iPhone Mockup Hardware */
  .iphone-bezel {
      background-color: #111;
      box-shadow: 
          inset 0 0 0 2px #52525B, 
          inset 0 0 0 7px #000, 
          0 40px 80px -15px rgba(0,0,0,0.9),
          0 15px 25px -5px rgba(0,0,0,0.7);
      transform-style: preserve-3d;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #404040 0%, #171717 100%);
      box-shadow: 
          -2px 0 5px rgba(0,0,0,0.8),
          inset -1px 0 1px rgba(255,255,255,0.15),
          inset 1px 0 2px rgba(0,0,0,0.8);
      border-left: 1px solid rgba(255,255,255,0.05);
  }
  
  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow: 
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.03);
  }

  .floating-ui-badge {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
          0 0 0 1px rgba(0, 0, 0, 0.08),
          0 15px 30px -10px rgba(0, 0, 0, 0.1),
          inset 0 1px 1px rgba(255, 255, 255, 1);
  }
  .dark .floating-ui-badge {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
      box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.1),
          0 25px 50px -12px rgba(0, 0, 0, 0.8),
          inset 0 1px 1px rgba(255, 255, 255, 0.2),
          inset 0 -1px 1px rgba(0, 0, 0, 0.5);
  }

  /* Physical Tactile Buttons */
  .btn-modern-light, .btn-modern-dark {
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
      background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
      color: #0F172A;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.02);
  }
  .btn-modern-dark {
      background: linear-gradient(180deg, #27272A 0%, #18181B 100%);
      color: #FFFFFF;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #3F3F46 0%, #27272A 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
      background: #18181B;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.5);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({ 
  brandName = "Sobers",
  tagline1 = "Track the journey,",
  tagline2 = "not just the days.",
  cardHeading = "Accountability, redefined.",
  cardDescription = <><span className="text-white font-semibold">Sobers</span> empowers sponsors and sponsees in 12-step recovery programs with structured accountability, precise sobriety tracking, and beautiful visual timelines.</>,
  metricValue = 365,
  metricLabel = "Days Sober",
  ctaHeading = "Start your recovery.",
  ctaDescription = "Join thousands of others in the 12-step program and take control of your timeline today.",
  className, 
  ...props 
}: CinematicHeroProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  // 1. High-Performance Mouse Interaction Logic (Synchronized with Unified Scroll)
  useEffect(() => {
    let cachedCardRect: DOMRect | null = null;

    const onResize = () => {
      cachedCardRect = null;
    };

    window.addEventListener("resize", onResize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      if (typeof document !== "undefined" && document.body.classList.contains("is-scrolling")) return;
      if (window.scrollY > 20) return;

      cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (!mainCardRef.current || !mockupRef.current) return;

        if (!cachedCardRect) {
          cachedCardRect = mainCardRef.current.getBoundingClientRect();
        }
        const rect = cachedCardRect;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
        mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

        gsap.to(mockupRef.current, {
          rotationY: xVal * 12,
          rotationX: -yVal * 12,
          ease: "power3.out",
          duration: 1.2,
          overwrite: "auto",
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 2. Complex Cinematic Scroll Timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });
      gsap.set(".testimonial-layer", { autoAlpha: 0 });
      gsap.set(".features-card", { autoAlpha: 0, xPercent: 120 });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=5500",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".phone-widget", { y: 40, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.15, ease: "back.out(1.2)", duration: 1.5 }, "-=1.5")
        .to(".progress-ring", { strokeDashoffset: 60, duration: 2, ease: "power3.inOut" }, "-=1.2")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".floating-badge", { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".card-left-text", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-text", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2.5 })
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .to({}, { duration: 1.5 })
        // --- Phase 2: Mockup fades out (including ShapeGrid) ---
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text", ".shape-grid-wrapper"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        // --- Phase 3: Card shrinks FIRST (to match screenshot sizing) ---
        .to(".main-card", { 
          width: isMobile ? "92vw" : "85vw", 
          height: isMobile ? "85vh" : "80vh", 
          borderRadius: isMobile ? "32px" : "40px",
          y: 20, // slight push down to clear the fixed header
          ease: "expo.inOut", 
          duration: 1.8 
        }, "pullback")
        // --- Phase 4: Testimonials appear ---
        .to(".testimonial-layer", { autoAlpha: 1, ease: "power2.out", duration: 1.2 })
        .to({}, { duration: 3 })
        // --- Phase 5: Horizontal slide — testimonials go left, features come from right ---
        .to(".main-card", { xPercent: -120, ease: "power3.inOut", duration: 2.5 }, "hslide")
        .fromTo(".features-card", 
          { autoAlpha: 1, xPercent: 120, y: 12 },
          { autoAlpha: 1, xPercent: 0, y: 12, ease: "power3.inOut", duration: 2.5 }, "hslide"
        )
        .to({}, { duration: 3 })
        // --- Phase 6: CTA reveals behind card, then Features card goes UP ---
        .set(".cta-wrapper", { autoAlpha: 1 })
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 })
        .to(".features-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  },[metricValue]); 

  return (
    <div
      ref={containerRef}
      className={cn("relative w-screen h-screen overflow-hidden flex items-center justify-center bg-background text-foreground font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="shape-grid-wrapper absolute inset-0 z-0 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" aria-hidden="true">
        <ShapeGrid 
          speed={0.1}
          squareSize={40}
          direction="down"
          borderColor="rgba(128,128,128,0.2)"
          hoverFillColor="rgba(187, 242, 70, 0.15)"
          shape="square"
          hoverTrailAmount={1}
          // @ts-ignore
          hoverColor="rgba(187, 242, 70, 0.3)"
        />
      </div>

      {/* BACKGROUND LAYER: Hero Texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform transform-style-3d">
        <h1 className="text-track gsap-reveal text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          {tagline2}
        </h1>
      </div>

      {/* BACKGROUND LAYER 2: Tactile CTA Buttons */}
      <div className="cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-silver-matte">
          {ctaHeading}
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-xl mx-auto font-light leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <a href="#" aria-label="Download on the App Store" className="btn-modern-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {/* Authentic Apple App Store Logo SVG */}
            <svg className="w-8 h-8 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 384 512" aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-[-2px]">Download on the</div>
              <div className="text-xl font-bold leading-none tracking-tight">App Store</div>
            </div>
          </a>
          <a href="#" aria-label="Get it on Google Play" className="btn-modern-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background">
            {/* Authentic Google Play Store Solid Logo SVG */}
            <svg className="w-7 h-7 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
               <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-[-2px]">Get it on</div>
              <div className="text-xl font-bold leading-none tracking-tight">Google Play</div>
            </div>
          </a>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Deep Blue Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px] will-change-transform"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* --- TESTIMONIAL LAYER (Redesigned Executive Student Impact Showcase) --- */}
          <div className="testimonial-layer absolute inset-0 z-30 flex flex-col justify-center items-center py-6 sm:py-8 md:py-10 px-2 sm:px-4 md:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(187,242,70,0.06),transparent_75%)] pointer-events-none" />

            {/* Header Title (Clean without eyebrow text) */}
            <div className="text-center mb-3 sm:mb-5 md:mb-6 px-4 shrink-0 relative z-10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground dark:text-white drop-shadow-sm">
                What Students Say
              </h2>
              <p className="text-muted-foreground dark:text-zinc-400 text-xs sm:text-sm font-normal mt-1.5 max-w-lg mx-auto">
                Real academic breakthroughs from 3,500+ KIIT students using Kaizen.
              </p>
            </div>
            
            {/* Row 1 - Left Drift */}
            <div className="w-full flex whitespace-nowrap overflow-hidden group py-1.5 sm:py-2 relative z-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex gap-3 sm:gap-4 md:gap-5 animate-[marqueeLeft_30s_linear_infinite] group-hover:[animation-play-state:paused]">
                {[...REVIEWS_ROW_1, ...REVIEWS_ROW_1].map((r, i) => (
                  <div 
                    key={`r1-${i}`} 
                    className="w-[290px] sm:w-[330px] md:w-[360px] p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-card/90 hover:bg-card dark:bg-[#111622]/90 dark:hover:bg-[#151c2c] border border-border dark:border-white/10 hover:border-primary/50 dark:hover:border-[#bbf246]/50 shadow-md hover:shadow-xl dark:shadow-xl transition-all duration-300 backdrop-blur-xl flex flex-col justify-between whitespace-normal text-left cursor-default group/card"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted/80 dark:bg-zinc-900 border border-border dark:border-white/15 flex items-center justify-center font-bold text-xs text-foreground dark:text-zinc-100 shadow-inner">
                            {r.avatar}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-semibold text-foreground dark:text-white leading-tight flex items-center gap-1">
                              {r.name}
                              <CheckCircle2 size={12} className="text-primary dark:text-[#bbf246]" />
                            </div>
                            <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground dark:text-zinc-400 leading-tight">
                              {r.branch}
                            </div>
                          </div>
                        </div>
                        <div 
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1"
                          style={{ 
                            color: r.color, 
                            borderColor: `${r.color}33`, 
                            backgroundColor: `${r.color}15` 
                          }}
                        >
                          <TrendingUp size={10} />
                          <span>{r.metric}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, starIdx) => (
                          <Star key={starIdx} size={11} className="fill-[#bbf246] text-[#bbf246]" />
                        ))}
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-[13px] font-light leading-relaxed line-clamp-2 sm:line-clamp-3">
                        &ldquo;{r.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 - Right Drift */}
            <div className="w-full flex whitespace-nowrap overflow-hidden group py-1.5 sm:py-2 relative z-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex gap-3 sm:gap-4 md:gap-5 animate-[marqueeRight_34s_linear_infinite] group-hover:[animation-play-state:paused]" style={{ transform: 'translateX(-50%)' }}>
                {[...REVIEWS_ROW_2, ...REVIEWS_ROW_2].map((r, i) => (
                  <div 
                    key={`r2-${i}`} 
                    className="w-[290px] sm:w-[330px] md:w-[360px] p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-card/90 hover:bg-card dark:bg-[#111622]/90 dark:hover:bg-[#151c2c] border border-border dark:border-white/10 hover:border-primary/50 dark:hover:border-[#bbf246]/50 shadow-md hover:shadow-xl dark:shadow-xl transition-all duration-300 backdrop-blur-xl flex flex-col justify-between whitespace-normal text-left cursor-default group/card"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted/80 dark:bg-zinc-900 border border-border dark:border-white/15 flex items-center justify-center font-bold text-xs text-foreground dark:text-zinc-100 shadow-inner">
                            {r.avatar}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-semibold text-foreground dark:text-white leading-tight flex items-center gap-1">
                              {r.name}
                              <CheckCircle2 size={12} className="text-primary dark:text-[#bbf246]" />
                            </div>
                            <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground dark:text-zinc-400 leading-tight">
                              {r.branch}
                            </div>
                          </div>
                        </div>
                        <div 
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1"
                          style={{ 
                            color: r.color, 
                            borderColor: `${r.color}33`, 
                            backgroundColor: `${r.color}15` 
                          }}
                        >
                          <TrendingUp size={10} />
                          <span>{r.metric}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, starIdx) => (
                          <Star key={starIdx} size={11} className="fill-[#bbf246] text-[#bbf246]" />
                        ))}
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-[13px] font-light leading-relaxed line-clamp-2 sm:line-clamp-3">
                        &ldquo;{r.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Proof Metric Bar */}
            <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-6 md:gap-8 px-4 text-[10px] sm:text-xs font-mono text-muted-foreground dark:text-zinc-400 shrink-0 relative z-10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary dark:text-[#bbf246]" />
                <span className="text-foreground dark:text-zinc-200 font-semibold">3,532+</span> Questions Digitized
              </div>
              <div className="hidden sm:inline text-border dark:text-zinc-600">•</div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary dark:text-[#bbf246]" />
                <span className="text-foreground dark:text-zinc-200 font-semibold">99.9%</span> Deterministic Accuracy
              </div>
              <div className="hidden sm:inline text-border dark:text-zinc-600">•</div>
              <div className="flex items-center gap-1.5">
                <Award size={13} className="text-primary dark:text-[#bbf246]" />
                <span className="text-foreground dark:text-zinc-200 font-semibold">100%</span> KIIT Grading Matched
              </div>
            </div>
          </div>

          {/* DYNAMIC RESPONSIVE GRID: Flex-col on mobile to force order, Grid on desktop */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">
            
            {/* 1. TOP (Mobile) / RIGHT (Desktop): BRAND NAME WITH OFFICIAL LOGO */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
                <div className="size-12 sm:size-16 md:size-20 rounded-2xl md:rounded-3xl overflow-hidden border border-border dark:border-white/15 shadow-[0_0_30px_rgba(187,242,70,0.3)] bg-black shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo/kaizen-logo.png" alt="Kaizen" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-5xl md:text-[5.5rem] lg:text-[7.5rem] font-black uppercase tracking-tighter text-card-silver-matte lg:mt-0">
                  {brandName}
                </h2>
              </div>
            </div>

            {/* 2. MIDDLE (Mobile) / CENTER (Desktop): IPHONE MOCKUP */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10 will-change-transform" style={{ perspective: "1000px" }}>
              
              {/* Inner wrapper for safe CSS scaling that doesn't conflict with GSAP */}
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-85 lg:scale-100">
                
                {/* The iPhone Bezel */}
                <div
                  ref={mockupRef}
                  className="relative w-[280px] h-[580px] rounded-[3rem] iphone-bezel flex flex-col will-change-transform transform-style-3d"
                >
                  {/* Physical Hardware Buttons */}
                  <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[170px] -right-[3px] w-[3px] h-[70px] hardware-btn rounded-r-md z-0 scale-x-[-1]" aria-hidden="true" />

                  {/* Inner Screen Container */}
                  <div className="absolute inset-[7px] bg-[#050914] rounded-[2.5rem] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,1)] text-white z-10">
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                    </div>

                    {/* App Interface */}
                    <div className="relative w-full h-full pt-12 px-5 pb-8 flex flex-col">
                      <div className="phone-widget flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Today</span>
                          <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">Journey</span>
                        </div>
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/15 shadow-lg shadow-black/50 shrink-0 bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/logo/kaizen-logo.png" alt="Kaizen" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="phone-widget relative w-44 h-44 mx-auto flex items-center justify-center mb-8 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]">
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                          <circle className="progress-ring" cx="88" cy="88" r="64" fill="none" stroke="#bbf246" strokeWidth="12" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="counter-val text-4xl font-extrabold tracking-tighter text-white">0</span>
                          <span className="text-[8px] text-[#bbf246]/70 uppercase tracking-[0.1em] font-bold mt-0.5">{metricLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#bbf246]/20 to-[#bbf246]/5 flex items-center justify-center mr-3 border border-[#bbf246]/30 shadow-inner">
                            <svg className="w-4 h-4 text-[#bbf246] drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-20 bg-neutral-300 rounded-full mb-2 shadow-inner" />
                            <div className="h-1.5 w-12 bg-neutral-600 rounded-full shadow-inner" />
                          </div>
                        </div>
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mr-3 border border-emerald-400/20 shadow-inner">
                            <svg className="w-4 h-4 text-emerald-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-16 bg-neutral-300 rounded-full mb-2 shadow-inner" />
                            <div className="h-1.5 w-24 bg-neutral-600 rounded-full shadow-inner" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-white/20 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                  </div>
                </div>

                {/* Floating Glass Badges */}
                <div className="floating-badge absolute flex top-6 lg:top-12 left-[-15px] lg:left-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-b from-blue-500/20 to-blue-900/10 flex items-center justify-center border border-blue-400/30 shadow-inner">
                    <span className="text-base lg:text-xl drop-shadow-lg" aria-hidden="true">🔥</span>
                  </div>
                  <div>
                    <p className="text-foreground dark:text-white text-xs lg:text-sm font-bold tracking-tight">1 Year Streak</p>
                    <p className="text-muted-foreground dark:text-blue-200/50 text-[10px] lg:text-xs font-medium">Milestone unlocked</p>
                  </div>
                </div>

                <div className="floating-badge absolute flex bottom-12 lg:bottom-20 right-[-15px] lg:right-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-b from-indigo-500/20 to-indigo-900/10 flex items-center justify-center border border-indigo-400/30 shadow-inner">
                    <span className="text-base lg:text-lg drop-shadow-lg" aria-hidden="true">🤝</span>
                  </div>
                  <div>
                    <p className="text-foreground dark:text-white text-xs lg:text-sm font-bold tracking-tight">Sponsor Update</p>
                    <p className="text-muted-foreground dark:text-blue-200/50 text-[10px] lg:text-xs font-medium">Shared successfully</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. BOTTOM (Mobile) / LEFT (Desktop): ACCOUNTABILITY TEXT */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0">
              <h3 className="text-foreground dark:text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-0 lg:mb-5 tracking-tight">
                {cardHeading}
              </h3>
              {/* HIDDEN ON MOBILE (added hidden md:block) */}
              <div className="hidden md:block text-muted-foreground dark:text-zinc-300 text-sm md:text-base lg:text-lg font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none">
                {cardDescription}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FEATURES CARD — Perfectly proportioned, zero vertical clipping */}
      <div 
        className="features-card absolute z-20 overflow-y-auto overflow-x-hidden pointer-events-auto rounded-[28px] md:rounded-[36px] w-[94vw] md:w-[88vw] lg:w-[85vw] max-w-7xl h-[88vh] md:h-[86vh] max-h-[820px] flex flex-col justify-start md:justify-center items-center will-change-transform border border-border dark:border-white/10 bg-card/95 dark:bg-[#10101b]/95 backdrop-blur-xl shadow-2xl transition-colors duration-300 p-3 sm:p-5 md:p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(187,242,70,0.06),transparent_70%)] pointer-events-none" />
        <div className="max-w-6xl w-full mx-auto relative z-10 py-1 sm:py-2">
          <div className="mb-3 sm:mb-4 md:mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground dark:text-white flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>SYSTEM</span>
                <span className="text-muted-foreground dark:text-[#a1a1aa]">MODULES</span>
              </h2>
              <p className="max-w-xl text-muted-foreground dark:text-[#a1a1aa] text-xs sm:text-sm font-normal mt-0.5 sm:mt-1">
                A suite of deterministic tools designed to quantify every aspect of student life.
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border dark:border-white/10 bg-muted/60 dark:bg-white/5 rounded-lg text-[10px] sm:text-xs font-mono text-muted-foreground dark:text-[#a1a1aa]">
                <span>POWERED BY</span>
                <span className="text-primary dark:text-[#bbf246] font-bold">GEMINI 3 FLASH</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div 
                  key={f.title} 
                  className="group relative p-3.5 sm:p-4 md:p-4.5 border rounded-2xl md:rounded-3xl min-h-[110px] sm:min-h-[120px] md:min-h-[125px] flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-xl bg-background/90 dark:bg-[#141422]/90 border-border dark:border-white/10 hover:border-primary/60 dark:hover:border-[#bbf246]/40 transition-all duration-300"
                >
                  {f.isNew && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 text-black text-[9px] font-bold uppercase tracking-widest rounded-full bg-[#bbf246] shadow-sm">
                      New
                    </div>
                  )}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2 shadow-inner bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 group-hover:scale-105 transition-transform duration-300">
                    <Icon size={16} style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold mb-0.5 text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-[#bbf246] transition-colors">{f.title}</h3>
                    <p className="text-muted-foreground dark:text-[#a1a1aa] font-light leading-snug text-xs sm:text-[13px] line-clamp-2">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Demo ---
export default function CinematicHeroDemo() {
  return (
    <div className="overflow-x-hidden w-[100%] min-h-screen">
      <CinematicHero />
    </div>
  );
}
