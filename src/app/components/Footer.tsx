import { Link } from 'react-router-dom';
import { HardHat, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-maroon rounded-lg flex items-center justify-center">
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-maroon" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Labour</span>
                <span className="text-gold" style={{ fontWeight: 700, fontSize: '1.1rem' }}>X</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Sri Lanka's premier marketplace connecting homeowners and developers with verified construction professionals.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-lg bg-maroon-light border border-maroon/20 flex items-center justify-center hover:bg-maroon hover:text-white transition-colors text-maroon">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-foreground mb-4" style={{ fontWeight: 600 }}>Platform</h4>
            <ul className="space-y-2">
              {[
                { label: 'Find Professionals', path: '/search' },
                { label: 'Work Posts', path: '/posts' },
                { label: 'Post a Job', path: '/posts/create' },
                { label: 'Join as Technician', path: '/register' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-muted-foreground text-sm hover:text-maroon transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-foreground mb-4" style={{ fontWeight: 600 }}>Specialties</h4>
            <ul className="space-y-2">
              {['Mason', 'Electrician', 'Plumber', 'Interior Designer', 'Architect', 'Carpenter'].map(cat => (
                <li key={cat}>
                  <Link to={`/search?specialty=${cat}`} className="text-muted-foreground text-sm hover:text-maroon transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-foreground mb-4" style={{ fontWeight: 600 }}>Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mt-0.5 text-maroon flex-shrink-0" />
                <span>support@labourx.lk</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mt-0.5 text-maroon flex-shrink-0" />
                <span>1800-LABOURX (toll free)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-maroon flex-shrink-0" />
                <span>LabourX HQ, Colombo 03, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            © 2026 LabourX. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="#" className="text-muted-foreground text-sm hover:text-maroon transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-muted-foreground text-sm hover:text-maroon transition-colors">Terms of Service</Link>
            <Link to="#" className="text-muted-foreground text-sm hover:text-maroon transition-colors">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
