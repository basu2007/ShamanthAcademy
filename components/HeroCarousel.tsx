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
    title: "Shape Your Tech Career.",
    subtitle: "Industry-standard curriculum designed for modern software engineers.",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    icon: "fa-graduation-cap",
    highlightColor: "text-amber-400"
  },
  {
    id: 2,
    title: "Learn Java & Spring Boot.",
    subtitle: "From fundamentals to advanced microservices architecture.",
    gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
    icon: "fa-mug-hot",
    highlightColor: "text-amber-300"
  },
  {
    id: 3,
    title: "Master React & Cloud.",
    subtitle: "Build scalable web apps and deploy to AWS with confidence.",
    gradient: "linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)",
    icon: "fa-atom",
    highlightColor: "text-cyan-300"
  }
];

const HeroCarousel: React.FC<HeroCarouselProps> = ({ onStartLearning, onBrowseCourses }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative mb-12 group overflow-hidden rounded-3xl shadow-2xl">
      <div className="relative h-[400px] md:h-[500px] w-full">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center p-8 md:p-20 text-center text-white ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{ background: slide.gradient }}
          >
            {/* Decorative background icon */}
            <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none select-none">
              <i className={`fa-solid ${slide.icon} text-[20rem] md:text-[30rem]`}></i>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 animate-bounce">
                New Enrollment Open
              </span>
              <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
                {slide.title}
              </h1>
              <p className="text-base md:text-xl text-indigo-100 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
                {slide.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={onStartLearning}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-black/20 transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                  Join Course Now
                </button>
                <button 
                  onClick={onBrowseCourses}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/30 text-white px-10 py-4 rounded-2xl font-black transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                  View Batches
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 transition-all duration-500 rounded-full ${
              index === currentSlide ? 'w-12 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;