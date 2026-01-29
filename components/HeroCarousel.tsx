import React, { useState, useEffect, useCallback } from 'react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  icon: string;
  highlightColor: string;
}

interface HeroCarouselProps {
  onStartLearning: () => void;
  onBrowseCourses: () => void;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "Master Your Future.",
    subtitle: "High-quality curriculum designed for modern software engineers.",
    gradient: "linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)",
    icon: "fa-graduation-cap",
    highlightColor: "text-amber-400"
  },
  {
    id: 2,
    title: "Expert-Led Curriculum.",
    subtitle: "Learn directly from Shamanth and industry experts in React and Java.",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #2e1065 100%)",
    icon: "fa-laptop-code",
    highlightColor: "text-cyan-400"
  },
  {
    id: 3,
    title: "Scale Your Cloud Skills.",
    subtitle: "Navigate AWS and modern architecture with our structured paths.",
    gradient: "linear-gradient(135deg, #0891b2 0%, #164e63 100%)",
    icon: "fa-cloud-arrow-up",
    highlightColor: "text-emerald-400"
  },
  {
    id: 4,
    title: "Data Science Mastery.",
    subtitle: "Turn information into insights with Python and Machine Learning.",
    gradient: "linear-gradient(135deg, #be185d 0%, #500724 100%)",
    icon: "fa-brain",
    highlightColor: "text-rose-300"
  }
];

const HeroCarousel: React.FC<HeroCarouselProps> = ({ onStartLearning, onBrowseCourses }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <div 
      className="relative mb-8 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[280px] md:h-[380px] w-full overflow-hidden rounded-2xl md:rounded-[2.5rem] shadow-xl">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center p-6 md:p-12 text-center text-white ${
              index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
            }`}
            style={{ background: slide.gradient }}
          >
            {/* Decorative Background Icon - Scaled Down */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
              <i className={`fa-solid ${slide.icon} text-[10rem] md:text-[18rem]`}></i>
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className={`transition-all duration-700 delay-300 transform ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <h1 className="text-2xl md:text-5xl font-black mb-3 md:mb-5 tracking-tighter leading-tight">
                  {slide.title}
                </h1>
                <p className="text-sm md:text-lg text-indigo-100 max-w-xl mx-auto px-4 font-medium opacity-90 leading-snug mb-6 md:mb-8">
                  <span className={`${slide.highlightColor} font-bold`}>Shamanth Academy</span>: {slide.subtitle}
                </p>
                
                <div className="flex flex-row gap-3 justify-center items-center">
                  <button 
                    onClick={onStartLearning}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 md:px-8 py-2 md:py-3.5 rounded-full font-bold shadow-lg shadow-black/10 transition-all text-xs md:text-sm active:scale-95"
                  >
                    Enroll Now
                  </button>
                  <button 
                    onClick={onBrowseCourses}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 md:px-8 py-2 md:py-3.5 rounded-full font-bold transition-all text-xs md:text-sm active:scale-95"
                  >
                    Curriculum
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Compact Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 text-xs"
          aria-label="Previous slide"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 text-xs"
          aria-label="Next slide"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>

        {/* Slim Progress Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                index === currentSlide ? 'w-6 md:w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;