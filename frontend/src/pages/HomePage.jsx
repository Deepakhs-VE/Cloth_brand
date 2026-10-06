import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturesBar } from '../components/home/FeaturesBar';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { SpecialOfferBanner } from '../components/home/SpecialOfferBanner';
import { AboutPreviewSection } from '../components/home/AboutPreviewSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';

export const HomePage = () => {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturesBar />
      <CategoriesSection />
      <FeaturedProductsSection />
      <SpecialOfferBanner />
      <AboutPreviewSection />
      <TestimonialsSection />
    </div>
  );
};
