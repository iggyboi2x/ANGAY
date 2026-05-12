import React, { useState } from 'react'
import LandingButton from '@/components/LandingButton'
import { Wheat, Menu, X } from "lucide-react";

const WheatIcon = () => <Wheat size={22} color="#FE9800" />;

const links = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Features', href: '#features' },
  { name: 'Contact', href: '#contact' },
]

const LandingNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden p-2 text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className='flex items-center gap-1'>
            <span>{WheatIcon()}</span>
            <span className='system-title text-2xl font-bold'>
              ANGAY
            </span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className='hidden sm:flex items-center gap-4'>
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-slate-800 hover:text-[#FE9800] px-3 py-2 rounded-md text-lg font-medium transition-all duration-300 ease-in-out"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden sm:block">
          <LandingButton
            className="text-white shadow-[0px_5px_0px_#CB8927] bg-[#FE9800] font-semibold"
            size="short"
          >
            Log in
          </LandingButton>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`sm:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="p-6 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-slate-800 hover:text-[#FE9800] text-lg font-medium py-2 border-b border-slate-50 last:border-0"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-2">
            <LandingButton
              className="text-white shadow-[0px_5px_0px_#CB8927] bg-[#FE9800] font-semibold w-full"
              size="short"
            >
              Log in
            </LandingButton>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default LandingNav