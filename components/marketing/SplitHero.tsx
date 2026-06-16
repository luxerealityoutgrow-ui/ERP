"use client";

import { ArrowRight, Play } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import Image from "next/image";

export function SplitHero() {
  return (
    <section className="bg-primary py-16 md:py-24 overflow-hidden border-b border-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Content */}
        <div className="space-y-6 flex flex-col items-start text-left">
          
          {/* 1. Badge Group */}
          <BadgeGroup addonText="New launch" color="brand">
            <span className="text-xs font-semibold text-brand-secondary ml-1">
              View the new listings catalog
            </span>
          </BadgeGroup>

          {/* 2. Headline */}
          <h1 className="text-display-md md:text-display-lg font-semibold tracking-tight text-primary">
            Supercharge your <span className="text-brand-secondary">Sales Pipeline</span> today
          </h1>

          {/* 3. Subtitle */}
          <p className="text-lg text-tertiary max-w-lg">
            Track leads, schedule meetings, match client budgets, and finalize property deal contracts faster.
          </p>

          {/* 4. Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button color="primary" size="lg" href="/login">
              Start Free Trial
            </Button>
            <Button color="secondary" size="lg" iconLeading={Play} href="/dashboard">
              View Dashboard
            </Button>
          </div>

          {/* 5. Social Proof / Logos */}
          <div className="pt-8 space-y-3 border-t border-secondary w-full">
            <p className="text-xs font-semibold text-quaternary uppercase tracking-wider">
              Trusted by leading developers
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-4 items-center opacity-65">
              <span className="text-md font-bold text-quaternary">Outgrow Realty</span>
              <span className="text-md font-bold text-quaternary">Intelligence Studios</span>
              <span className="text-md font-bold text-quaternary">Luxe Realty Pune</span>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Mockup */}
        <div className="relative aspect-[4/3] lg:aspect-square rounded-2xl border border-secondary shadow-lg bg-primary overflow-hidden w-full max-w-xl lg:max-w-none mx-auto">
          <Image 
            src="/images/hero-mockup.png" 
            alt="Feature Preview" 
            fill
            className="object-cover"
            priority
          />
        </div>

      </div>
    </section>
  );
}
