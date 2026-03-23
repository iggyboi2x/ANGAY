import React from 'react'

const LandingNav = () => {
  return (
    <header className="landing-nav fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur shadow-sm border-b border-orange-100">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="text-xl font-extrabold text-[#FE9800] tracking-tight">ANGAY</a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
          <a href="#home" className="hover:text-[#FE9800] transition text-xl">Home</a>
          <a href="#about" className="hover:text-[#FE9800] transition text-xl">About</a>
          <a href="#faqs" className="hover:text-[#FE9800] transition text-xl">FAQs</a>
          <a href="#contact" className="hover:text-[#FE9800] transition text-xl">Contact us</a>
        </nav>

        <a href="#" className="rounded-full border border-[#FE9800] bg-[#FE9800] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#ffb110]">
          Log in
        </a>
      </div>
    </header>
  )
}

export default LandingNav