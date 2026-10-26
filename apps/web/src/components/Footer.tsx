import React from 'react'

const Footer = () => {
    return (
        <footer className='footer py-4'>
            <div className='container-main flex items-center justify-between'>
                <div className='text-sm font-semibold text-white'>Powered by Nazarii Marchyshyn</div>
                <div className='social'>
                    <ul className='flex gap-1'>
                        <li><a href="mailto:nazarmarchyshyn@gmail.com" target='_blank'><i className="fa-regular fa-envelope"></i></a></li>
                        <li><a href="https://www.instagram.com/naz__mrn?mdxt=MW9uOTR6cXdwMWhwZg==" target='_blank'><i className="fa-brands fa-instagram"></i></a></li>
                    </ul>
                </div>
            </div>
        </footer>
    )
}

export default Footer;