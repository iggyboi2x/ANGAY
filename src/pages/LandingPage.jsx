import React, { useEffect, useMemo, useState } from 'react'
import LandingNav from '../components/LandingNav'
import { Plus, ArrowRight, Github, Linkedin } from 'lucide-react'

const features = [
  { title: 'Demographic Insights', description: 'Foodbanks can view aggregated barangay demographic data to better understand community needs.', icon: 'angay-desc-img.png' },
  { title: 'Interactive Barangay Map', description: 'A visual map helps foodbanks identify where assistance is needed most.', icon: 'angay-interactive-img.png' },
  { title: 'Distribution Coordination', description: 'Foodbanks propose distribution schedules while barangays review and approve them.', icon: 'angay-distribution-img.png' },
  { title: 'Transparent Reporting', description: 'Distribution history is digitally recorded to improve accountability and transparency.', icon: 'angay-transparent-img.png' }
]

const team = [
  { name: 'Allyssa Faith Ejares', role: 'Team Lead' },
  { name: 'Christo Rey Espina', role: 'Documentation' },
  { name: 'Miguel Diano', role: 'Solution Architect' },
  { name: 'Kaycee Roamar', role: 'Business Analyst' }
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

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
      .revealed { opacity: 1; transform: translateY(0); }
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
    return () => observer.disconnect()
  }, [])

  const stats = useMemo(() => [
    { value: '120+', label: 'Community Partners' },
    { value: '45+', label: 'Foodbank Partners' },
    { value: '25,000+', label: 'Food Packs Distributed' }
  ], [])

  return (
    <div className="font-fredoka bg-[#fffaf1] text-slate-800">
      <LandingNav />

      <main className="mt-20">

        {/* ── Hero ── */}
        <section id="home" className="bg-white overflow-hidden">
          <div className="  mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 lg:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left */}
            <div className="w-full  lg:w-1/2  flex flex-col items-start">
              <h1 className="reveal text-5xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Let's End <br />
                <span className="text-[#FE9800]">World Hunger</span>
              </h1>
              <p className="reveal mt-5 max-w-lg text-lg text-slate-500 leading-relaxed">
                Connecting foodbanks and barangays through a transparent digital system that ensures food assistance reaches the communities that need it most.
              </p>
              <div className="reveal mt-8 flex flex-wrap gap-3">
                <a href="#about" className="rounded-2xl bg-[#FE9800] px-7 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#e58a00]">
                  Get Started
                </a>
                <a href="#faqs" className="rounded-2xl border-2 border-[#FE9800] px-7 py-3 text-base font-bold text-[#FE9800] transition hover:bg-orange-50 flex items-center gap-2">
                  Learn More <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Right */}
            <div className="reveal w-full lg:w-1/2 flex justify-center">
              <img
                src="/images/angay-hero-img.png"
                alt="ANGAY hero"
                className="w-full max-w-lg rounded-3xl"
              />
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="reveal rounded-3xl bg-[#FE9800] px-8 py-10 shadow-lg text-white text-center">
            <h3 className="text-3xl font-bold">Our growing impact</h3>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/95 py-6 px-4 shadow-md">
                  <p className="text-4xl font-black text-[#FE9800]">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="reveal rounded-3xl bg-white p-8 sm:p-12 shadow-md">
            <h2 className="text-4xl font-black text-center tracking-tight">
              What is <span className="text-[#FE9800]">Angay</span>?
            </h2>
            <p className="mt-4 text-center text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              ANGAY (Accessible Nutrition and Goods Assistance for You) connects foodbanks and communities through a digital platform that ensures efficient food distribution.
            </p>
            <div className="mt-10 flex flex-col lg:flex-row items-center gap-6">
              <img
                src="/images/barangay-img.png"
                alt="What is ANGAY"
                className="w-full lg:w-1/2 rounded-2xl shadow-md object-cover"
              />
              <img
                src="/images/family-img.png"
                alt="Community"
                className="w-full lg:w-1/2 rounded-2xl shadow-md object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="reveal text-4xl font-black text-center tracking-tight text-slate-900">
            Innovative Features Powering ANGAY
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="reveal flex items-start gap-5 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <img
                  className="h-20 w-20 flex-none rounded-2xl object-cover shadow-sm"
                  src={`/images/${feature.icon}`}
                  alt={feature.title}
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{feature.title}</h3>
                  <p className="mt-2 text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="reveal text-4xl font-black text-center tracking-tight text-slate-900">
            How FoodBanks Works
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              { img: 'first-step-img.png', alt: 'Collect', step: '01', text: 'Foodbanks collect surplus or donated food from factories. This helps prevent waste while securing resources for communities.' },
              { img: 'second-step-img.png', alt: 'Sort', step: '02', text: 'The collected goods are brought back to foodbanks for sorting and storage. They are carefully organized to ensure safe and efficient distribution.' },
              { img: 'angay-distribution-img.png', alt: 'Coordinate', step: '03', text: 'Foodbanks coordinate with barangay officials to share information about available supplies. This ensures proper planning and fair allocation of resources.' },
              { img: 'angay-footer-img.png', alt: 'Distribute', step: '04', text: 'Barangay officials distribute the food to families in need, making sure the aid reaches the right households in an organized and timely manner.' },
            ].map((item) => (
              <div key={item.step} className="reveal rounded-3xl bg-white p-6 shadow-md flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-2xl bg-orange-50">
                  <span className="absolute top-3 left-3 rounded-full bg-[#FE9800] px-3 py-1 text-xs font-black text-white shadow">
                    {item.step}
                  </span>
                  <img src={`/images/${item.img}`} alt={item.alt} className="w-full object-cover h-48" />
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="reveal text-4xl font-black text-center tracking-tight text-slate-900">
            The Team Behind ANGAY
          </h2>
          <p className="reveal mt-4 text-center text-slate-500 max-w-xl mx-auto">
            ANGAY is built by passionate developers and advocates dedicated to using technology to fight hunger and strengthen communities.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {team.map((person) => (
              <article
                key={person.name}
                className="reveal rounded-3xl border border-orange-100 bg-white p-6 shadow-md text-center flex flex-col items-center"
              >
                <div className="h-24 w-24 rounded-full bg-orange-100 border-4 border-orange-200 mb-4 overflow-hidden">
                  <img
                    src={`/images/avatar-placeholder.png`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{person.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#FE9800]">{person.role}</p>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  all or nothing at all there's no where left to fall
                </p>
                <div className="mt-4 flex justify-center gap-3 text-slate-400">
                  <a href="#" aria-label="Github" className="hover:text-slate-700 transition">
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
          <h2 className="reveal text-4xl font-black text-center tracking-tight text-slate-900">FAQs</h2>
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
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#FE9800] px-8 py-3 font-bold text-white shadow-md hover:bg-[#e58a00] transition"
            >
              Send an inquiry <ArrowRight size={16} />
            </a>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="reveal relative overflow-hidden bg-[#FE9800] text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl font-black">Be Part of the Solution</h2>
              <p className="mt-2 text-lg text-white/85">Together, We Can Fight Hunger</p>
            </div>
            <a
              href="#"
              className="flex-none rounded-full bg-white px-8 py-3 font-bold text-[#FE9800] shadow-lg transition hover:bg-orange-50"
            >
              Join now
            </a>
          </div>
          <img
            src="/images/angay-footer-img.png"
            alt="footer illustration"
            className="pointer-events-none absolute bottom-0 right-0 h-56 opacity-75 lg:h-72"
          />
        </section>

        {/* ── Footer ── */}
        <footer className="bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="text-xl font-bold text-[#FE9800]">ANGAY</h3>
                <p className="mt-3 max-w-xs text-sm text-slate-400 leading-relaxed">
                  Connecting foodbanks and barangays through a transparent digital system that ensures food assistance reaches the communities that need it most.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Product</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li className="hover:text-white cursor-pointer transition">Features</li>
                  <li className="hover:text-white cursor-pointer transition">Pricing</li>
                  <li className="hover:text-white cursor-pointer transition">Download Desktop</li>
                  <li className="hover:text-white cursor-pointer transition">Download Mobile</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li className="hover:text-white cursor-pointer transition">About Us</li>
                  <li className="hover:text-white cursor-pointer transition">Careers</li>
                  <li className="hover:text-white cursor-pointer transition">Blog</li>
                  <li className="hover:text-white cursor-pointer transition">Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white">Legal</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li className="hover:text-white cursor-pointer transition">Privacy Policy</li>
                  <li className="hover:text-white cursor-pointer transition">Terms of Service</li>
                  <li className="hover:text-white cursor-pointer transition">Cookie Policy</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
              © Copyright Team IntelleX. All rights reserved.
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}

export default LandingPage