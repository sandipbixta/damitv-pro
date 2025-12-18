import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sports-darker text-gray-300 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">DamiTV</h3>
            <p className="text-sm leading-relaxed mb-4">
              Your premier destination for free live sports streaming. Watch football, basketball, 
              tennis, and more in HD quality.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Visit DamiTV on Facebook">
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Visit DamiTV on Twitter">
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Visit DamiTV on Instagram">
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Visit DamiTV on YouTube">
                <Youtube className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-primary transition-colors">Live Matches</Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-primary transition-colors">Schedule</Link>
              </li>
              <li>
                <Link to="/channels" className="hover:text-primary transition-colors">TV Channels</Link>
              </li>
            </ul>
          </div>


          {/* Popular Sports */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Popular Sports</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/live" className="hover:text-primary transition-colors">Football / Soccer</Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-primary transition-colors">Basketball</Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-primary transition-colors">Tennis</Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-primary transition-colors">Baseball</Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-primary transition-colors">Cricket</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left">
              © {currentYear} DamiTV. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 text-center md:text-right">
              DamiTV provides links to third-party streaming sources. We do not host or control any content.
            </p>
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-6 text-xs text-gray-500 leading-relaxed">
          <p>
            DamiTV is a free sports streaming platform offering live coverage of football, basketball, 
            tennis, baseball, and more. Watch Premier League, Champions League, La Liga, NBA, NFL, 
            and other major sports events in HD quality. Our platform provides multiple stream sources 
            for reliability and the best viewing experience. Access live matches, sports news, and 
            TV channels from around the world - completely free, no registration required.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;