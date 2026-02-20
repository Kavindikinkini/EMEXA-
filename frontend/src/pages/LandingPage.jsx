import React from "react";
import { Brain, Smile, TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// import assets (Vite-friendly)
import logo from "../assets/headerlogo.png";
import footerLogo from "../assets/footerlogo.png";
import heroImage from "../assets/2.png";
import howImage from "../assets/1.jpg";

/* -------------------------
   Navbar Component
   ------------------------- */
function Navbar({ onGetStarted }) {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="shadow-sm fixed top-0 w-full bg-white z-10">
      <div className="mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="EMEXA Logo"
              style={{ width: "180px", height: "auto" }}
              className="object-contain"
            />
          </div>

          <div className="flex items-center gap-12">
            <div className="hidden md:flex items-center gap-10">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-700 hover:text-gray-900 text-base font-normal transition-colors cursor-pointer bg-transparent border-none"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-gray-700 hover:text-gray-900 text-base font-normal transition-colors cursor-pointer bg-transparent border-none"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-gray-700 hover:text-gray-900 text-base font-normal transition-colors cursor-pointer bg-transparent border-none"
              >
                Testimonials
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onGetStarted}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-base font-medium transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* -------------------------
   Footer Component
   ------------------------- */
function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={footerLogo}
              alt="EMEXA Logo"
              style={{
                width: "107px",
                height: "100px",
                marginTop: "0.5px",
                marginLeft: "1px",
              }}
              className="object-contain"
            />
          </div>

          <p className="text-gray-400 max-w-md mb-6">
            Making learning more human with emotion-aware technology.
          </p>

          <div className="flex gap-4">
            <a
              href="#"
              aria-label="Twitter"
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Email"
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800">
          <p className="text-gray-400 text-sm">
            © 2025 EMEXA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------
   Landing Page (main)
   ------------------------- */
export default function LandingPage() {
  const navigate = useNavigate();

  // Set 'seenLanding' and navigate to the supplied target
  const handleContinue = () => {
    try {
      localStorage.setItem("seenLanding", "true");
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      console.error("Failed to set seenLanding:", e);
    }
    navigate("/login");
  };

  const features = [
    {
      icon: Smile,
      title: "Emotion Detection",
      description:
        "Recognize your learner's mood in real-time so you can support their mental and emotional well-being.",
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description:
        "Everything is insights into how well your learners are performing and their emotional state overall throughout.",
    },
    {
      icon: Brain,
      title: "Personalized Learning",
      description:
        "Tailor the user's recommendations and learning activities based on their emotional state.",
    },
    {
      icon: Zap,
      title: "Engagement Analytics",
      description:
        "Track user activity and what they're doing during a learning activity and course completion.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Your learners' data and information is safe with us. We're transparent on what we do.",
    },
    {
      icon: BarChart3,
      title: "Performance Boost",
      description:
        "Analyze your learner's overall engagement and performance and how it will help them.",
    },
  ];

  const howItWorks = [
    {
      number: "01",
      title: "Emotion Detection",
      description:
        "Once you enable this, our AI will capture, identify and predict emotions out of a camera to see whether the learner is engaged or not.",
    },
    {
      number: "02",
      title: "Smart Analysis",
      description:
        "A dashboard that will help you see the emotions of every single learner. It can display their engagement and how you should go back to improve and simplify your study.",
    },
    {
      number: "03",
      title: "Analytics Overview",
      description:
        "You will see a complete analysis of your learners during your quiz. Track the content emotions, insights and patterns to give actionable feedback.",
    },
    {
      number: "04",
      title: "AI Support",
      description:
        "Learners get insights and recommendations to improve their learning.",
    },
  ];

  const testimonials = [
    {
      initial: "S",
      name: "Sarah Johnson",
      role: "High School Teacher",
      text: "I've been amazed at what EMEXA does — it understands how my students are feeling and helps me support them.",
    },
    {
      initial: "D",
      name: "David Patterson",
      role: "University Lecturer",
      text: "This system gives real-time feedback so I can react quickly to students who are struggling.",
    },
    {
      initial: "E",
      name: "Emily Rodriguez",
      role: "Corporate L&D Manager",
      text: "A game-changer: real emotional insights during training let me adapt and improve outcomes.",
    },
  ];

  return (
    <>
      <Navbar onGetStarted={handleContinue} />

      <main className="bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex items-center">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
            <div className="max-w-2xl">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Quizzes that
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                  understand emotions
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                EMEXA is the first quiz platform that adapts to your emotional
                state in real-time, creating a more effective and personalized
                learning experience.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleContinue}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Try it free
                </button>
                <button
                  onClick={() =>
                    document.getElementById("features") &&
                    window.scrollTo({
                      top: document.getElementById("features").offsetTop - 80,
                      behavior: "smooth",
                    })
                  }
                  className="bg-transparent hover:bg-white/50 text-green-700 px-8 py-3 rounded-lg font-medium transition-colors border border-gray-300"
                >
                  Learn more →
                </button>
              </div>
            </div>

            <div className="mt-10 w-full max-w-[1140px] bg-violet-50 py-10 px-7 shadow-lg rounded-2xl">
              <div className="mt-10 flex justify-center">
                <div className="rounded-3xl flex items-center justify-center overflow-hidden">
                  <img
                    src={heroImage}
                    alt="Team collaboration"
                    className="w-full max-w-[600px] h-auto object-cover rounded-2xl shadow-md"
                  />
                </div>
              </div>

              <div className="mt-16 grid md:grid-cols-1 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-semibold">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">
                      Make quizzes go further
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-semibold">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">
                      Test moods - Get instant emotional insights
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-semibold">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">
                      Student's ability to understand your teaching
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Features that understand you
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our advanced tools analyze your students' emotional state as
                they take quizzes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How Emexa Works
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our AI can detect emotions in images and videos during quizzes.
              </p>
            </div>

            <div className="mb-16 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={howImage}
                alt="Students collaborating on laptops"
                className="w-full object-cover"
              />
            </div>

            <div className="space-y-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                What our users are saying
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Hear how teachers are changing the way they understand students.
              </p>
            </div>

            <div className="space-y-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl border border-gray-100"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {testimonial.initial}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to transform your learning?
            </h2>
            <p className="text-xl text-teal-50 mb-8">
              Start using Emexa today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleContinue}
                className="bg-white hover:bg-gray-100 text-teal-600 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              >
                Get Started
              </button>
              <button
                onClick={() =>
                  document.getElementById("features") &&
                  window.scrollTo({
                    top: document.getElementById("features").offsetTop - 80,
                    behavior: "smooth",
                  })
                }
                className="bg-transparent hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold transition-colors border-2 border-white"
              >
                Learn more →
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
