
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
    subtitle: "High-quality curriculum designed for modern software engineers and tech enthusiasts.",
    gradient: "linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)",
    icon: "fa-graduation-cap",
    highlightColor: "text-amber-400"
  },
  {
    id: 2,
    title: "Expert-Led Curriculum.",
    subtitle: "Learn directly from Shamanth and top industry experts in React, Java, and Cloud Computing.",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #2e1065 100%)",
    icon: "fa-laptop-code",
    highlightColor: "text-cyan-400"
  },
  {
    id: 3,
    title: "Scale Your Cloud Skills.",
    subtitle: "Navigate the complex landscape of AWS and modern architecture with our structured paths.",
    gradient: "linear-gradient(135deg, #0891b2 0%, #164e63 100%)",
    icon: "fa-cloud-arrow-up",
    highlightColor: "text-emerald-400"
  },
  {
    id: 4,
    title: "Data Science Mastery.",
    subtitle: "Turn information into insights. Comprehensive paths for Python, Pandas, and Machine Learning.",
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
      className="relative mb-12 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden rounded-[2rem] shadow-2xl">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center p-8 md:p-16 text-center text-white ${
              index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
            }`}
            style={{ background: slide.gradient }}
          >
            {/* Decorative Background Icon */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none">
              <i className={`fa-solid ${slide.icon} text-[15rem] md:text-[25rem]`}></i>
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className={`transition-all duration-700 delay-300 transform ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto px-4 font-medium opacity-90 leading-relaxed mb-10">
                  Welcome to <span className={`${slide.highlightColor} font-bold`}>Shamanth Academy</span>. {slide.subtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button 
                    onClick={onStartLearning}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-black/20 transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    Enroll Now
                  </button>
                  <button 
                    onClick={onBrowseCourses}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-full font-bold transition-all active:scale-95"
                  >
                    View Curriculum
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20"
          aria-label="Previous slide"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20"
          aria-label="Next slide"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>

        {/* Progress Indicators (Dots) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 transition-all duration-300 rounded-full ${
                index === currentSlide ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
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
