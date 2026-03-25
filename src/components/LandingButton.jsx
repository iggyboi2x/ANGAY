import React from 'react'
import { Link } from 'react-router-dom'

const LandingButton = ({className, size, children}) => {
    const sizeClasses = {
        short : 'px-5 py-2 text-sm text-white hover:bg-[#FE9800] transition duration-300',  
        long : 'px-8 py-4 text-lg'
    }

    const baseClass = `${sizeClasses[size]} ${className} rounded-xl hover:opacity-90 cursor-pointer`;
  return (
    <Link to="/login">
    <button className={baseClass}>
            {children}
    </button>
    </Link>
  )
}

export default LandingButton