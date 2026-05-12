import React, { useEffect, useMemo, useState } from 'react'
import LandingNav from '../components/LandingNav'
import { Plus, ArrowRight, Github, Linkedin, Mail, Phone, MapPin, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase'

const features = [
  {
    title: 'Demographic Insights',
    description: <>Foodbanks can view aggregated barangay <span className="text-[#FE9800] font-semibold">demographic data</span> to better understand community needs.</>,
    icon: 'angay-demo-img.png'
  },
  {
    title: 'Interactive Barangay Map',
    description: <>A <span className="text-[#FE9800] font-semibold">visual map</span> helps foodbanks identify where assistance is needed most.</>,
    icon: 'angay-interactive-img.png'
  },
  {
    title: 'Distribution Coordination',
    description: <>Foodbanks propose <span className="text-[#FE9800] font-semibold">distribution schedules</span> while barangays review and approve them.</>,
    icon: 'angay-distribution-img.png'
  },
  {
    title: 'Transparent Reporting',
    description: <><span className="text-[#FE9800] font-semibold">Distribution history</span> is digitally recorded to improve accountability and transparency.</>,
    icon: 'angay-transparent-img.png'
  }
]

const team = [
  { name: 'Allyssa Faith Ejares', role: 'Team Lead', motto: 'all or nothing at all there\'s no where left to fall', image: 'images/founders/Ejares.png', github: 'https://github.com/notyurally' },
  { name: 'Christo Rey Espina', role: 'Documentation', motto: 'knowledge is power', image: 'images/founders/Espina.png', github: 'https://github.com/spinach-clone' },
  { name: 'Miguel Diano', role: 'Solution Architect', motto: 'innovation drives progress', image: 'images/founders/Diano.jpg', github: 'https://github.com/iggyboi2x' },
  { name: 'Kaycee Roamar', role: 'Business Analyst', motto: 'data speaks louder than words', image: 'images/founders/Roamar.jpg', github: 'https://github.com/kakeeroams' }
]

const faqsData = [
  { q: 'What does ANGAY really do?', a: 'ANGAY connects foodbanks and barangays through a digital system ensuring aid reaches communities efficiently.' },
  { q: 'Who can use the platform?', a: 'Foodbanks, barangay officials, and partnered organizations can use ANGAY.' },
  { q: 'Does ANGAY deliver food directly?', a: 'ANGAY coordinates distribution; physical delivery is done via partner foodbanks and local volunteers.' },
  { q: 'How does ANGAY help communities?', a: 'By enabling planable distribution paths, tracking transparency, and reducing waste across supply chains.' },
  { q: 'Can organizations partner with ANGAY?', a: 'Yes, organizations can register and join to share resources, volunteers, and distribution efforts.' }
]

const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState(null)
  const [wordIndex, setWordIndex] = useState(0)
  const heroWords = ["World Hunger", "Food Waste", "Inequality"]

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    organization: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
      .revealed { opacity: 1; transform: translateY(0); }
      .pop-in { opacity: 0; animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
      .animate-word { animation: slideLeftFade 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      @keyframes slideLeftFade { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
    `
    document.head.appendChild(style)

    const revealEls = document.querySelectorAll('.reveal')
    if (!revealEls.length) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })

    revealEls.forEach((el) => observer.observe(el))

    const wordInterval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % 3)
    }, 3000)

    return () => {
      observer.disconnect()
      clearInterval(wordInterval)
    }
  }, [])

  const stats = useMemo(() => [
    { value: '120+', label: 'Community Partners' },
    { value: '45+', label: 'Foodbank Partners' },
    { value: '25,000+', label: 'Food Packs Distributed' }
  ], [])

  const handleContactChange = (e) => {
    const { name, value } = e.target
    setContactForm(prev => ({ ...prev, [name]: value }))
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('')

    try {
      const { error } = await supabase.from('contact_inquiries').insert([
        {
          full_name: contactForm.name,
          email: contactForm.email,
          organization: contactForm.organization,
          message: contactForm.message
        }
      ]);

      if (error) throw error;

      setSubmitStatus('success')
      setContactForm({ name: '', email: '', organization: '', message: '' })
      setTimeout(() => setSubmitStatus(''), 5000)
    } catch (err) {
      console.error('Contact form error:', err);
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="font-fredoka bg-[#fffaf1] text-slate-800 overflow-x-hidden">
      <LandingNav />

      <main className='mt-15'>

        {/* ── Hero ── */}
        <section id="home" className=" overflow-hidden">
          <div className=" bg-white mx-auto px-8 sm:px-12 lg:px-24 xl:px-32 lg:py-10 flex flex-col lg:flex-row gap-10 lg:gap-12">

            {/* Left */}
            <div className="w-full lg:w-7/12 flex flex-col items-start justify-center   -mt-15 lg:pt-0">

              <h1 className="reveal text-5xl sm:text-6xl md:text-[4rem] lg:text-[4.5rem] font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Let's End <br />
                <span className="text-[#FE9800] relative inline-block min-w-[280px] sm:min-w-[340px] md:min-w-[380px] lg:min-w-[420px]">
                  <span key={wordIndex} className="animate-word inline-block">
                    {heroWords[wordIndex]}
                  </span>
                  <svg className="absolute w-full h-4 -bottom-1.5 left-0 text-orange-200 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                  </svg>
                </span>
              </h1>
              <p className="reveal mt-6 max-w-lg text-lg sm:text-xl text-slate-500 leading-relaxed font-medium">
                Connecting foodbanks and barangays through a transparent digital system that ensures food assistance reaches the communities that need it most.
              </p>
              <div className="reveal mt-10 flex flex-wrap gap-4">
                <a href="/login" className="rounded-2xl bg-[#FE9800] px-7 py-3 text-lg font-semibold text-white shadow-[0px_6px_0px_#CB8927] hover:-translate-y-1 hover:shadow-[0px_8px_0px_#CB8927] active:translate-y-1 active:shadow-[0px_2px_0px_#CB8927] transition-all duration-500 ease-out flex items-center gap-2">
                  Get Started
                </a>
                <a href="#faqs" className="rounded-2xl border-2 border-[#FE9800] px-7 py-3 text-lg font-semibold shadow-[0px_6px_0px_#FE9800] text-[#FE9800] hover:-translate-y-1 hover:shadow-[0px_8px_0px_#FE9800] active:translate-y-1 active:shadow-[0px_2px_0px_#FE9800] hover:bg-orange-50 transition-all duration-500 ease-out flex items-center gap-2 bg-white">
                  Learn More <ArrowRight size={20} />
                </a>
              </div>
            </div>

            {/* Right */}
            <div className="reveal w-full lg:w-5/12 flex justify-center lg:justify-end items-center relative pb-10 lg:pb-0 min-h-[400px] sm:min-h-[500px]">

              {/* Floating Diamonds */}
              <div className="absolute top-10 right-20 w-5 h-5 bg-orange-300 rounded-[4px] rotate-45 animate-[float_4s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-20 left-10 w-3 h-3 bg-blue-300 rounded-[2px] rotate-45 animate-[float_5s_ease-in-out_infinite_1s]"></div>
              <div className="absolute top-40 left-0 w-8 h-8 bg-orange-400 rounded-[6px] rotate-45 opacity-40 animate-[float_6s_ease-in-out_infinite_2s]"></div>
              <div className="absolute bottom-10 right-32 w-4 h-4 bg-[#FE9800] rounded-[3px] rotate-45 opacity-60 animate-[float_3.5s_ease-in-out_infinite_0.5s]"></div>

              {/* Vegetable Transmission Simulation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-20 pointer-events-none">
                <svg viewBox="0 0 500 500" className="w-[120%] h-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <path id="veg-path-1" d="M 120,350 Q 250,120 380,220" fill="none" stroke="none" />
                  <path id="veg-path-2" d="M 380,180 Q 250,100 120,280" fill="none" stroke="none" />
                  <path id="veg-path-3" d="M 150,200 Q 250,380 350,300" fill="none" stroke="none" />

                  <text fontSize="28" dominantBaseline="middle">
                    <textPath href="#veg-path-1" startOffset="0%">
                      <animate attributeName="startOffset" from="-20%" to="120%" dur="4s" repeatCount="indefinite" />
                      <tspan fill="rgba(254,152,0,0.5)" fontSize="18" dy="-4" letterSpacing="4">- - - - - </tspan>🥕
                    </textPath>
                  </text>
                  <text fontSize="28" dominantBaseline="middle">
                    <textPath href="#veg-path-2" startOffset="0%">
                      <animate attributeName="startOffset" from="-20%" to="120%" dur="5s" repeatCount="indefinite" />
                      <tspan fill="rgba(59,130,246,0.5)" fontSize="18" dy="-4" letterSpacing="4">- - - - - </tspan>🥦
                    </textPath>
                  </text>
                  <text fontSize="28" dominantBaseline="middle">
                    <textPath href="#veg-path-3" startOffset="0%">
                      <animate attributeName="startOffset" from="-20%" to="120%" dur="4.5s" repeatCount="indefinite" />
                      <tspan fill="rgba(16,185,129,0.5)" fontSize="18" dy="-4" letterSpacing="4">- - - - - </tspan>🍅
                    </textPath>
                  </text>
                  <text fontSize="28" dominantBaseline="middle">
                    <textPath href="#veg-path-1" startOffset="50%">
                      <animate attributeName="startOffset" from="30%" to="170%" dur="4s" repeatCount="indefinite" />
                      <tspan fill="rgba(254,152,0,0.5)" fontSize="18" dy="-4" letterSpacing="4">- - - - - </tspan>🥬
                    </textPath>
                  </text>
                </svg>
              </div>

              {/* Floating Stats Cards with Pop-In */}
              <div className="absolute top-16 -left-4 sm:left-4 z-30 pop-in" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-[float_5s_ease-in-out_infinite_0.5s] border border-orange-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#FE9800]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800 leading-tight">120+</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Partners</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-12 -right-4 sm:right-4 z-30 pop-in" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-[float_6s_ease-in-out_infinite_1.5s] border border-orange-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800 leading-tight">25k+</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Meals Shared</p>
                  </div>
                </div>
              </div>

              <img
                src="/images/angay-hero-img.png"
                alt="ANGAY hero"
                className="w-[65%] sm:w-[55%] lg:w-[75%] max-w-[400px] z-10 animate-[float_6s_ease-in-out_infinite] object-contain relative"
              />
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="relative z-20 -mt-[4%] mb-10 bg-[#FE9800] w-full border-0">
          <div className="reveal pt-12 pb-10 sm:pt-16 sm:pb-12 shadow-lg text-white text-center min-h-[5%]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h3 className="text-3xl font-semibold">Our growing impact</h3>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/95 py-6 px-4 shadow-md transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-2 hover:bg-white cursor-pointer">
                    <p className="text-4xl font-semibold text-[#FE9800]">{stat.value}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="reveal rounded-3xl p-8 sm:p-12">
            <h2 className="text-4xl font-semibold text-center tracking-tight">
              What is <span className="text-[#FE9800]">Angay</span>?
            </h2>
            <p className="mt-4 text-center text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              ANGAY (Accessible Nutrition and Goods Assistance for You) connects foodbanks and communities through a digital platform that ensures efficient food distribution.
            </p>
            <div className="mt-10 flex justify-center">
              <img
                src="/images/angay-desc-img.png"
                alt="What is ANGAY"
                className="w-2/3 rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="reveal text-4xl sm:text-5xl font-extrabold text-center tracking-tight text-[#FE9800] leading-tight">
            Innovative Features <br className="hidden sm:block" /> Powering ANGAY
          </h2>
          <div className="mt-20 flex flex-col gap-24 lg:gap-32">
            {features.map((feature, idx) => {
              const isImageRight = idx % 2 === 0;
              return (
                <div
                  key={feature.title}
                  className={`reveal flex flex-col gap-10 lg:gap-16 items-center ${isImageRight ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`w-full lg:w-1/2 flex flex-col justify-center ${!isImageRight ? 'lg:items-end lg:text-right' : 'lg:items-start lg:text-left'} text-center`}>
                    <h3 className="text-3xl sm:text-[2.5rem] font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">{feature.title}</h3>
                    <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-[420px]">
                      {feature.description}
                    </p>
                  </div>
                  <div className={`w-full lg:w-1/2 flex justify-center ${isImageRight ? 'lg:justify-end' : 'lg:justify-start'}`}>
                    <img
                      src={`/images/${feature.icon}`}
                      alt={feature.title}
                      className="w-[85%] sm:w-[65%] lg:w-[85%] max-w-[400px] object-contain animate-[float_6s_ease-in-out_infinite]"
                      style={{ animationDelay: `${idx * 0.5}s` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 relative overflow-hidden">
          <h2 className="reveal text-4xl sm:text-5xl font-extrabold text-center tracking-tight text-[#FE9800] mb-20">
            How FoodBanks works
          </h2>
          <div className="relative flex flex-col gap-16 lg:gap-0 mt-10 pb-20">
            {[
              { img: 'first-step-img.png', alt: 'Collect', step: '01', text: 'Foodbanks collect surplus or donated food from factories. This helps prevent waste while securing resources for communities.' },
              { img: 'second-step-img.png', alt: 'Sort', step: '02', text: 'The collected goods are brought back to foodbanks for sorting and storage. They are carefully organized to ensure safe and efficient distribution.' },
              { img: 'barangay-img.png', alt: 'Coordinate', step: '03', text: 'Foodbanks coordinate with barangay officials to share information about available supplies. This ensures proper planning and fair allocation of resources.' },
              { img: 'family-img.png', alt: 'Distribute', step: '04', text: 'Barangay officials distribute the food to families in need. They make sure the aid reaches the right households in an organized and timely manner.' },
            ].map((item, idx, arr) => {
              const isImageLeft = idx % 2 === 0;
              return (
                <div key={item.step} className={`relative flex flex-col lg:flex-row items-center justify-center min-h-[300px] sm:min-h-[350px] ${isImageLeft ? '' : 'lg:flex-row-reverse'} mb-12 lg:mb-0`}>

                  {/* Connector Line */}
                  {idx < arr.length - 1 && (
                    <div className="hidden lg:block absolute top-[50%] left-[25%] w-[50%] h-[100%] z-0 pointer-events-none">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {isImageLeft ? (
                          <path d="M 85,0 C 85,60 15,40 15,100" fill="none" stroke="#FE9800" strokeWidth="9" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" opacity="0.6" />
                        ) : (
                          <path d="M 15,0 C 15,60 85,40 85,100" fill="none" stroke="#FE9800" strokeWidth="9" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" opacity="0.6" />
                        )}
                      </svg>
                    </div>
                  )}

                  {/* Text Outside */}
                  <div className="reveal w-full lg:w-1/2 flex justify-center z-10 p-4 lg:p-8">
                    <div className={`w-[95%] max-w-[480px] flex items-center justify-center text-center ${!isImageLeft ? 'lg:text-right' : 'lg:text-left'}`}>
                      <p className="text-lg sm:text-2xl font-medium text-slate-800 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                  
                  {/* Image Bubble */}
                  <div className="reveal w-full lg:w-1/2 flex justify-center z-10 p-4">
                    <div className="w-[85%] sm:w-[70%] lg:w-[80%] max-w-[420px] aspect-[1.4] border-[9px] border-dashed border-[#FE9800]/50 rounded-[50%] flex items-center justify-center p-6 sm:p-10 bg-white">
                      <img src={`/images/${item.img}`} alt={item.alt} className="w-[90%] h-[90%] object-contain animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: `${idx * 0.5}s` }} />
                    </div>
                  </div>


                </div>
              );
            })}

            {/* Final Heart Path */}
            <div className="hidden lg:block absolute bottom-4 left-0 w-full h-[120px] z-0 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 25,0 C 25,50 50,50 50,75" fill="none" stroke="#FE9800" strokeWidth="9" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" opacity="0.6" />
              </svg>
              {/* Heart icon at bottom center */}
              <div className="absolute bottom-0 top-[60%] left-1/2 -translate-x-1/2 text-[#FE9800] opacity-60">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <path d="M 50,35 C 20,0 0,40 50,90 C 100,40 80,0 50,35 Z" fill="none" stroke="currentColor" strokeWidth="9" strokeDasharray="8 8" />
                </svg> 
              </div>
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="reveal text-4xl font-semibold text-center tracking-tight text-slate-900">
            The Team Behind ANGAY
          </h2>
          <p className="reveal mt-4 text-center text-slate-500 max-w-xl mx-auto">
            ANGAY is built by passionate developers and advocates dedicated to using technology to fight hunger and strengthen communities.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {team.map((person) => (
              <article
                key={person.name}
                className="reveal rounded-3xl border border-orange-100 bg-white p-6 shadow-md text-center flex flex-col items-center transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:border-orange-200 cursor-pointer"
              >
                <div className="h-24 w-24 rounded-full bg-orange-100 border-4 border-orange-200 mb-4 overflow-hidden">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{person.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#FE9800]">{person.role}</p>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  {person.motto}
                </p>
                <div className="mt-4 flex justify-center gap-3 text-slate-400">
                  <a href={person.github} aria-label="Github" target="_blank" className="hover:text-slate-700 transition">
                    <Github size={16} />
                  </a>
                  <a href="#" aria-label="LinkedIn" className="hover:text-[#0077b5] transition">
                    <Linkedin size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── FAQs ── */}
        <section id="faqs" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="reveal text-4xl font-semibold text-center tracking-tight text-slate-900">FAQs</h2>
          <p className="reveal mt-3 text-center text-slate-500">
            Still curious? These might help quench your interests.
          </p>
          <div className="mt-8 max-w-3xl mx-auto space-y-3">
            {faqsData.map((item, idx) => (
              <div
                key={idx}
                className="reveal rounded-2xl border border-orange-100 bg-white shadow-sm overflow-hidden transition-all"
              >
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-slate-800 hover:bg-orange-50 transition"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  <span>{item.q}</span>
                  <Plus
                    size={18}
                    className={`flex-none text-[#FE9800] transition-transform duration-300 ${activeFaq === idx ? 'rotate-45' : 'rotate-0'}`}
                  />
                </button>
                {activeFaq === idx && (
                  <p className="px-5 pb-4 text-slate-500 text-sm leading-relaxed border-t border-orange-50 pt-3">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="reveal rounded-3xl bg-white p-8 sm:p-12 shadow-md">
            <h2 className="text-4xl font-semibold text-center tracking-tight text-slate-900">
              Get in <span className="text-[#FE9800]">Touch</span>
            </h2>
            <p className="mt-4 text-center text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {/* Contact Info */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <div className="flex-none w-12 h-12 rounded-xl bg-[#FE9800] flex items-center justify-center text-white">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Email Us</h3>
                    <p className="mt-1 text-sm text-slate-500">contact@angay.ph</p>
                    <p className="text-sm text-slate-500">support@angay.ph</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <div className="flex-none w-12 h-12 rounded-xl bg-[#FE9800] flex items-center justify-center text-white">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Call Us</h3>
                    <p className="mt-1 text-sm text-slate-500">+63 123 456 7890</p>
                    <p className="text-sm text-slate-500">Mon-Fri, 9AM-5PM PHT</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <div className="flex-none w-12 h-12 rounded-xl bg-[#FE9800] flex items-center justify-center text-white">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Visit Us</h3>
                    <p className="mt-1 text-sm text-slate-500">123 Barangay Hall Street</p>
                    <p className="text-sm text-slate-500">Manila, Philippines</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:border-[#FE9800] focus:outline-none transition"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:border-[#FE9800] focus:outline-none transition"
                    placeholder="juan@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold text-slate-700 mb-2">
                    Organization (Optional)
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={contactForm.organization}
                    onChange={handleContactChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:border-[#FE9800] focus:outline-none transition"
                    placeholder="Your Foodbank or Barangay"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:border-[#FE9800] focus:outline-none transition resize-none"
                    placeholder="Tell us how we can help..."
                  ></textarea>
                </div>

                {submitStatus === 'success' && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-sm font-semibold text-green-800">
                      ✓ Message sent successfully! We'll get back to you soon.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-sm font-semibold text-red-800">
                      ✕ Failed to send message. Please ensure the database migration is applied.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#FE9800] px-8 py-3 font-semibold text-white shadow-md hover:bg-[#e58a00] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="reveal bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-5xl font-semibold tracking-tight text-[#FE9800]">Be Part of the Solution</h2>
            <p className="mt-3 text-lg font-semibold text-slate-800">Together, We Can Fight Hunger</p>
            <div className="mt-8">
              <Link to="/login" className="inline-flex items-center rounded-full border-2 border-[#FE9800] bg-white px-8 py-3 text-lg font-semibold text-[#FE9800] shadow-md transition hover:bg-[#ffe9c9]">Join now</Link>
            </div>
            <img src="/images/angay-footer-img.png" alt="Join ANGAY" className="mx-auto mt-12 w-1/4 rounded-2xl object-cover" />
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative bg-[#FE9800] text-white">
          <div className="absolute inset-x-0 -top-10 h-20 bg-white rounded-b-[50%]" aria-hidden="true"></div>
          <div className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
            <div className="pt-20 grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="text-2xl font-semibold">ANGAY</h3>
                <p className="mt-3 text-sm text-white/90 leading-relaxed max-w-xs">Connecting foodbanks and barangays through a transparent digital system that ensures food assistance reaches the communities that need it most.</p>
              </div>
              <div>
                <h4 className="font-semibold">Product</h4>
                <ul className="mt-3 space-y-2 text-sm text-white/90">
                  <li className="hover:text-white transition cursor-pointer">Features</li>
                  <li className="hover:text-white transition cursor-pointer">Pricing</li>
                  <li className="hover:text-white transition cursor-pointer">Download Desktop</li>
                  <li className="hover:text-white transition cursor-pointer">Download Mobile</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-white/90">
                  <li className="hover:text-white transition cursor-pointer">About Us</li>
                  <li className="hover:text-white transition cursor-pointer">Careers</li>
                  <li className="hover:text-white transition cursor-pointer">Blog</li>
                  <li className="hover:text-white transition cursor-pointer">Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Legal</h4>
                <ul className="mt-3 space-y-2 text-sm text-white/90">
                  <li className="hover:text-white transition cursor-pointer">Privacy Policy</li>
                  <li className="hover:text-white transition cursor-pointer">Terms of Service</li>
                  <li className="hover:text-white transition cursor-pointer">Cookie Policy</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-white/30 pt-6 text-center text-sm text-white/80">
              © Copyright Team IntelleX. All rights reserved.
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}

export default LandingPage