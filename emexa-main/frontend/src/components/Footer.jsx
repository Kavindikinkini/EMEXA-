import React from 'react';
import { Twitter, Facebook, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    product: [
      { name: 'Features', href: '#' },
      { name: 'Help Center', href: '#' }
     ],
    support: [
      { name: 'Guides', href: '#' },
      { name: 'Contact Us', href: '#' }
    ],
    company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
    ],
    legal: [
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Section */}
        <div className="mb-12">
          {/* Logo and Tagline */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="5" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="5" strokeWidth="2"/>
                  <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2"/>
                  <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" strokeWidth="2"/>
                  <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" strokeWidth="2"/>
                  <line x1="1" y1="12" x2="5" y2="12" strokeWidth="2"/>
                  <line x1="19" y1="12" x2="23" y2="12" strokeWidth="2"/>
                  <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" strokeWidth="2"/>
                  <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <span className="text-xl font-semibold text-white">EMEXA</span>
          </div>
          
          <p className="text-gray-400 max-w-md mb-6">
            Making learning more human with emotion-aware technology.
          </p>

          {/* Social Links */}
          <div className="flex gap-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-800">
          <p className="text-gray-400 text-sm">
            © 2025 EMEXA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;