
import React from 'react';

export type InfoTopic = 
  | 'vedic-math' | 'react-flux' | 'aws-dharma' | 'ds-guru'
  | 'mission' | 'support' | 'privacy' | 'terms'
  | 'ashram' | 'contact';

interface InfoViewProps {
  topic: InfoTopic;
  onBack: () => void;
}

const GOOGLE_MAP_IFRAME = (
  <iframe 
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.054326123456!2d77.5567543!3d13.0283287!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3d618337a9e3%3A0xbd8450f9fbcb72c5!2s75%2C%2010th%20Main%20Rd%2C%20Gokula%201st%20Stage%2C%20Mathikere%2C%20Bengaluru%2C%20Karnataka%20560054!5e0!3m2!1sen!2sin!4v1715600000000!5m2!1sen!2sin" 
    width="100%" 
    height="100%" 
    style={{ border: 0 }} 
    allowFullScreen={true} 
    loading="lazy" 
    referrerPolicy="no-referrer-when-downgrade"
    className="rounded-3xl shadow-lg"
  ></iframe>
);

const CONTENT_MAP: Record<InfoTopic, { title: string; icon: string; body: React.ReactNode }> = {
  'vedic-math': {
    title: 'Logical Agility',
    icon: 'fa-calculator',
    body: (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed text-gray-600 italic">"The speed of thought combined with the logic of numbers."</p>
        <p className="text-gray-700">Mastering mental arithmetic and logical reasoning is the foundation of any great engineer. Shamanth Academy provides specialized techniques to sharpen your problem-solving speed.</p>
        <h3 className="text-xl font-bold text-indigo-900 mt-8">Core Pillars:</h3>
        <ul className="list-disc pl-6 space-y-3 text-gray-700">
          <li><strong>Pattern Recognition:</strong> Identifying underlying logic in complex data sets.</li>
          <li><strong>Mental Efficiency:</strong> Solving common arithmetic hurdles without a calculator.</li>
          <li><strong>Algorithmic Thinking:</strong> Breaking down big problems into manageable, logical steps.</li>
        </ul>
      </div>
    )
  },
  'react-flux': {
    title: 'Modern React Mastery',
    icon: 'fa-atom',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">React is more than a library; it's a way of thinking about interfaces. We focus on high-performance rendering, sophisticated state management, and professional project structures.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2">Advanced Hooks</h4>
            <p className="text-sm text-gray-600">Deep dive into custom hooks, useMemo, and useCallback for performance.</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2">State Patterns</h4>
            <p className="text-sm text-gray-600">From Context API to external stores, find the right architecture for your app.</p>
          </div>
        </div>
      </div>
    )
  },
  'aws-dharma': {
    title: 'Cloud Infrastructure',
    icon: 'fa-cloud',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">Cloud computing is the backbone of the modern web. This path focuses on building resilient, scalable, and secure systems on Amazon Web Services.</p>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <i className="fa-solid fa-shield-halved text-indigo-600 mt-1"></i>
            <div>
              <span className="font-bold block">Security First</span>
              <span className="text-sm text-gray-600">Master IAM, VPC security groups, and encryption at rest.</span>
            </div>
          </li>
          <li className="flex gap-3">
            <i className="fa-solid fa-server text-indigo-600 mt-1"></i>
            <div>
              <span className="font-bold block">Scaling Strategies</span>
              <span className="text-sm text-gray-600">Auto-scaling, Load Balancing, and Serverless architectures.</span>
            </div>
          </li>
        </ul>
      </div>
    )
  },
  'ds-guru': {
    title: 'Data Intelligence',
    icon: 'fa-brain',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">Data drives decisions. Learn to observe, clean, and model data to predict future trends and automate complex tasks.</p>
        <div className="bg-gray-900 text-green-400 p-6 rounded-2xl font-mono text-sm shadow-inner">
          <p># Python Mastery</p>
          <p>import pandas as pd</p>
          <p>data = pd.read_csv('market_trends.csv')</p>
          <p>model = DataModel(expertise='shamanth')</p>
          <p>insight = model.predict(data)</p>
          <p>print(f"Outcome: {'{'}insight.accuracy(){'}'}")</p>
        </div>
      </div>
    )
  },
  'mission': {
    title: 'About Shamanth Academy',
    icon: 'fa-bullseye',
    body: (
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-indigo-900">Education for the Future.</h3>
        <p className="text-gray-700 leading-relaxed">Shamanth Academy was built on the belief that technical education should be clear, practical, and highly accessible. Our mission is to bridge the gap between academic theory and industry reality.</p>
        <p className="text-gray-700">We aim to empower 100,000 developers by providing the most efficient and structured learning experience available.</p>
      </div>
    )
  },
  'support': {
    title: 'Student Support',
    icon: 'fa-headset',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">Our dedicated team is here to help you through every step of your learning journey.</p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-2xl hover:border-indigo-500 transition-colors cursor-pointer">
            <i className="fa-solid fa-file-invoice text-indigo-600 text-xl"></i>
            <span className="font-bold">Curriculum Access & Billing</span>
          </div>
          <div className="flex items-center gap-4 p-4 border rounded-2xl hover:border-indigo-500 transition-colors cursor-pointer">
            <i className="fa-solid fa-circle-play text-indigo-600 text-xl"></i>
            <span className="font-bold">Academy Video Help</span>
          </div>
        </div>
      </div>
    )
  },
  'privacy': {
    title: 'Privacy Policy',
    icon: 'fa-user-lock',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">Your privacy is paramount. Shamanth Academy only collects data necessary to facilitate your learning and track progress.</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-2">
          <li>Academy completion statistics.</li>
          <li>Authentication and account management.</li>
          <li>Basic preferences for personalized suggestions.</li>
        </ul>
      </div>
    )
  },
  'terms': {
    title: 'Terms of Service',
    icon: 'fa-handshake',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">By using Shamanth Academy, you agree to respect our community and use the resources for your personal professional development.</p>
        <ul className="space-y-4 text-sm text-gray-600">
          <li>1. Account sharing is not permitted.</li>
          <li>2. Commercial redistribution of academy content is prohibited.</li>
          <li>3. Professional conduct is expected in all interactions.</li>
        </ul>
      </div>
    )
  },
  'ashram': {
    title: 'Learning Hub Location',
    icon: 'fa-map-location-dot',
    body: (
      <div className="space-y-6">
        <p className="text-gray-700">Shamanth Academy is headquartered in the serene academic enclave of Mathikere, Bengaluru, specifically in the Gokula 1st Stage area, providing world-class digital education globally.</p>
        <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border border-gray-200">
          {GOOGLE_MAP_IFRAME}
        </div>
      </div>
    )
  },
  'contact': {
    title: 'Get in Touch',
    icon: 'fa-paper-plane',
    body: (
      <div className="space-y-8">
        <p className="text-gray-700 text-lg">Have questions about our curriculum? We'd love to hear from you.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <i className="fa-solid fa-envelope"></i>
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Support</div>
                <span className="font-bold text-gray-800 text-lg sm:text-xl break-all">shamanth.infotech@gmail.com</span>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <i className="fa-solid fa-comments"></i>
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Availability</div>
                <span className="font-bold text-gray-800 text-xl">24/7 Student Assistance</span>
              </div>
            </div>
            <div className="bg-indigo-900 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-4 text-indigo-300">Academy Headquarters</h4>
              <p className="text-indigo-50 font-medium leading-relaxed">
                75, 10th Main Rd<br/>
                Gokula 1st Stage, Mathikere<br/>
                Bengaluru, Karnataka 560054<br/>
                India
              </p>
            </div>
          </div>
          <div className="aspect-square bg-gray-50 rounded-[2.5rem] overflow-hidden shadow-inner border border-gray-100">
            {GOOGLE_MAP_IFRAME}
          </div>
        </div>
      </div>
    )
  }
};

const InfoView: React.FC<InfoViewProps> = ({ topic, onBack }) => {
  const content = CONTENT_MAP[topic];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all"
      >
        <i className="fa-solid fa-arrow-left"></i>
        Back to Academy
      </button>

      <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-indigo-100/50 border border-gray-50 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-700 rounded-3xl flex items-center justify-center text-white text-3xl mb-8 shadow-xl shadow-indigo-200">
            <i className={`fa-solid ${content.icon}`}></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-10 tracking-tighter leading-tight">
            {content.title}
          </h1>
          <div className="prose prose-indigo max-w-none">
            {content.body}
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-gray-400 text-sm italic">
        "Education is the most powerful weapon which you can use to change the world."
      </div>
    </div>
  );
};

export default InfoView;
