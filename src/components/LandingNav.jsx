import React from 'react'
import LandingButton from '@/components/LandingButton'
import { Wheat } from "lucide-react";


const WheatIcon = () => <Wheat size={22} color="#FE9800" />;

const links = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Features', href: '#features' },
  { name: 'Contact', href: '#contact' },
]

const LandingNav = () => {
  return (
   <nav className="fixed top-0 left-0 w-full z-50 bg-white px-12 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4">

  <div className='flex items-center gap-1'>
  <span>{ WheatIcon() }</span>
  <span className='system-title text-2xl font-bold'>
    ANGAY
  </span>
  </div>

  <div className='flex flex-col sm:flex-row items-center sm:gap-4 w-full sm:w-auto'>
    {links.map((link) => (
      <a
        key={link.name}
        href={link.href}
        className="text-slate-800 hover:text-[#FE9800] px-3 py-2 rounded-md text-lg font-medium w-full sm:w-auto text-center transition-all duration-300 ease-in-out"
      >
        {link.name}
      </a>
    ))}
  </div>

  <LandingButton
    className="text-white shadow-[0px_5px_0px_#CB8927] bg-[#FE9800] font-semibold w-full sm:w-auto"
    size="short"
  >
    Log in
  </LandingButton>
</nav>
  )
}

export default LandingNav