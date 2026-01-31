
import React, { useState, useEffect, useCallback } from 'react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  icon: string;
}

interface HeroCarouselProps {
  onStartLearning: () => void;
  onBrowseCourses: () => void;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "Scale Your Career.",
    subtitle: "Advanced curriculum for modern software engineers.",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    icon: "fa-graduation-cap"
  },
  {
    id: 2,
    title: "Master Java & Spring.",
    subtitle: "End-to-end microservices architecture training.",
    gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
    icon: "fa-mug-hot"
  },
  {
    id: 3,
    title: "React & Cloud Expert.",
    subtitle: "Build scalable web apps and deploy to AWS.",
    gradient: "linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)",
    icon: "fa-atom"
  }
];

const HeroCarousel: React.FC<HeroCarouselProps> = ({ onStartLearning, onBrowseCourses }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl shadow-xl">
      <div className="relative h-[250px] md:h-[320px] w-full">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out flex items-center justify-center px-6 md:px-12 text-center text-white ${
              index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'
            }`}
            style={{ background: slide.gradient }}
          >
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
              <i className={`fa-solid ${slide.icon} text-[15rem]`}></i>
            </div>

            <div className="relative z-10 max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter">
                {slide.title}
              </h1>
              <p className="text-sm md:text-lg text-indigo-100/80 mb-6 font-medium max-w-xl mx-auto">
                {slide.subtitle}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={onStartLearning}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                >
                  Join Course
                </button>
                <button 
                  onClick={onBrowseCourses}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                >
                  View Batches
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all duration-300 rounded-full ${
              index === currentSlide ? 'w-8 bg-amber-400' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
