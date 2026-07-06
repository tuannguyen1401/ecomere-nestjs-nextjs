"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  badge: string;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: "🔥 Best Seller",
    title: "Premium Audio Gear",
    subtitle: "Immerse in pure acoustic performance",
    description: "Discover our premium selection of studio-grade headphones, wireless audio systems, and gaming headsets.",
    buttonText: "Shop Audio Gear",
    buttonLink: "/product",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    badge: "✨ Minimalist Workspace",
    title: "Sleek Desk Accessories",
    subtitle: "Upgrade your productivity station",
    description: "Handcrafted mechanical keyboards, ergonomic desk pads, and smart organizer tools designed for creators.",
    buttonText: "Explore Keyboards",
    buttonLink: "/product",
    imageUrl: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=1600&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    badge: "🚀 High-End Computing",
    title: "Next-Gen Tech Workstations",
    subtitle: "Built for developers & designers",
    description: "Find the perfect monitor, laptop, and processing power required to bring your most ambitious projects to life.",
    buttonText: "Browse Workstations",
    buttonLink: "/product",
    imageUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=1600&auto=format&fit=crop&q=80",
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[500px] md:h-[580px] bg-zinc-950 overflow-hidden group/hero border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                priority={index === 0}
                className="object-cover brightness-[0.4]"
                sizes="100vw"
              />
              {/* Vibrant Ambient Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto w-full px-12 md:px-16 flex justify-start">
                <div className="max-w-2xl text-left space-y-6 animate-fadeIn">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {slide.badge}
                  </span>

                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                    {slide.title}
                    <span className="block text-xl sm:text-2xl font-medium text-zinc-300 mt-2 font-sans font-normal tracking-wide">
                      {slide.subtitle}
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg text-zinc-300 max-w-lg leading-relaxed">
                    {slide.description}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={slide.buttonLink}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 hover:scale-105 active:scale-95 shadow-lg shadow-white/5 hover:shadow-white/10 transition-all cursor-pointer"
                    >
                      {slide.buttonText}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border border-white/10 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
        aria-label="Previous Slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border border-white/10 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
        aria-label="Next Slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
}
