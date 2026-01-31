
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Course, AuthState, PlatformSettings } from './types.ts';
import * as db from './services/db.ts';

// Components
import Header from './components/Header.tsx';
import CourseCard from './components/CourseCard.tsx';
import CourseModal from './components/CourseModal.tsx';
import AuthModal from './components/AuthModal.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import Footer from './components/Footer.tsx';
import InfoView, { InfoTopic } from './components/InfoView.tsx';
import HeroCarousel from './components/HeroCarousel.tsx';

type AppView = 'home' | 'admin' | 'info';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeInfoTopic, setActiveInfoTopic] = useState<InfoTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const coursesRef = useRef<HTMLDivElement>(null);

  const refreshCourseData = useCallback(async () => {
    const courseData = await db.getCourses();
    setCourses(courseData);
  }, []);

  const refreshSettings = useCallback(async () => {
    const settingsData = await db.getPlatformSettings();
    setSettings(settingsData);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      
      // Load session
      const saved = localStorage.getItem('active_session');
      if (saved) {
        try {
          const user = JSON.parse(saved) as User;
          const users = await db.getStoredUsers();
          const freshUser = users.find(u => u.id === user.id);
          if (freshUser) {
            setAuth({ user: freshUser, isAuthenticated: true });
          }
        } catch (e) {
          console.error("Session recovery failed", e);
        }
      }

      await refreshCourseData();
      await refreshSettings();
      setIsLoading(false);
    };
    initApp();
  }, [refreshCourseData, refreshSettings]);

  // Re-fetch courses whenever we navigate back to home to ensure admin changes are visible
  useEffect(() => {
    if (currentView === 'home') {
      refreshCourseData();
      refreshSettings();
    }
  }, [currentView, refreshCourseData, refreshSettings]);

  const handleLogin = (user: User) => {
    setAuth({ user, isAuthenticated: true });
    localStorage.setItem('active_session', JSON.stringify(user));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('active_session');
    setCurrentView('home');
  };

  const navigateToInfo = (topic: InfoTopic) => {
    setActiveInfoTopic(topic);
    setCurrentView('info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCourses = () => {
    coursesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartLearning = () => {
    if (auth.isAuthenticated) {
      scrollToCourses();
    } else {
      setShowAuthModal(true);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const refreshUserData = useCallback(async () => {
    if (auth.user) {
      const users = await db.getStoredUsers();
      const freshUser = users.find(u => u.id === auth.user?.id);
      if (freshUser) {
        setAuth(prev => ({ ...prev, user: freshUser }));
      }
    }
  }, [auth.user]);

  // Derive categories for filter bar (Always include 'All')
  const availableCategories = ['All', ...(settings?.categories || [])];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        auth={auth} 
        onLoginClick={() => setShowAuthModal(true)} 
        onLogout={handleLogout}
        onAdminClick={() => setCurrentView('admin')}
        onHomeClick={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigate={navigateToInfo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        flashNews={settings?.flashNews}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {currentView === 'admin' && auth.user?.role === 'ADMIN' ? (
          <AdminDashboard />
        ) : currentView === 'info' && activeInfoTopic ? (
          <InfoView topic={activeInfoTopic} onBack={() => setCurrentView('home')} />
        ) : (
          <>
            {!searchQuery && (
              <HeroCarousel 
                onStartLearning={handleStartLearning} 
                onBrowseCourses={scrollToCourses} 
              />
            )}

            <div ref={coursesRef} className="scroll-mt-24">
              <div className="flex flex-wrap gap-3 mb-10 justify-center sm:justify-start">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                      selectedCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="py-20 text-center">
                   <i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-600"></i>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        user={auth.user}
                        onClick={() => setActiveCourse(course)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <i className="fa-solid fa-face-frown text-5xl text-gray-200 mb-4"></i>
                      <h3 className="text-xl font-bold text-gray-400">No courses found matching your quest.</h3>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer onNavigate={navigateToInfo} />

      {activeCourse && (
        <CourseModal 
          course={activeCourse} 
          user={auth.user}
          onClose={() => setActiveCourse(null)}
          onAuthRequired={() => {
            setActiveCourse(null);
            setShowAuthModal(true);
          }}
          onRefreshUser={refreshUserData}
        />
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;
