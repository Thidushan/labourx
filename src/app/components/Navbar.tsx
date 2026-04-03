import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sun,
  Moon,
  Menu,
  X,
  HardHat,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { currentUser, logout, isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Find Professionals', path: '/search' },
    { label: 'Work Posts', path: '/posts' },
  ]

  const authNavLinks = isAuthenticated
    ? [{ label: 'My Projects', path: '/my-projects', icon: FolderOpen }]
    : []

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-maroon rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span
                className="text-maroon"
                style={{ fontWeight: 700, fontSize: '1.1rem' }}
              >
                Labour
              </span>
              <span
                className="text-gold"
                style={{ fontWeight: 700, fontSize: '1.1rem' }}
              >
                X
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive(link.path)
                    ? 'bg-maroon-light text-maroon'
                    : 'text-foreground hover:bg-muted hover:text-maroon'
                }`}
                style={{ fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}

            {authNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive(link.path)
                    ? 'bg-maroon-light text-maroon'
                    : 'text-foreground hover:bg-muted hover:text-maroon'
                }`}
                style={{ fontWeight: 500 }}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gold" />
              ) : (
                <Moon className="w-4 h-4 text-maroon" />
              )}
            </button>

            {isAuthenticated && currentUser ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <img
                    src={
                      currentUser.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        currentUser.name
                      )}&background=8B1A2F&color=fff`
                    }
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          currentUser.name
                        )}&background=8B1A2F&color=fff`
                    }}
                  />
                  <span className="text-sm text-foreground" style={{ fontWeight: 500 }}>
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                      <div className="p-3 border-b border-border">
                        <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {currentUser.role}
                          {currentUser.specialty ? ` · ${currentUser.specialty}` : ''}
                        </p>
                      </div>

                      <div className="p-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-maroon" />
                          Dashboard
                        </Link>

                        <Link
                          to="/my-projects"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <FolderOpen className="w-4 h-4 text-maroon" />
                          My Projects
                        </Link>

                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <User className="w-4 h-4 text-maroon" />
                          My Profile
                        </Link>

                        {currentUser.role === 'user' && (
                          <Link
                            to="/posts/create"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <PlusCircle className="w-4 h-4 text-maroon" />
                            Post a Job
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm rounded-lg border border-maroon text-maroon hover:bg-maroon-light transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm rounded-lg bg-maroon text-white hover:bg-maroon-dark transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Join Free
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors md:hidden"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(link.path)
                    ? 'bg-maroon-light text-maroon'
                    : 'text-foreground hover:bg-muted'
                }`}
                style={{ fontWeight: 500 }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && currentUser ? (
              <>
                <Link
                  to="/my-projects"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  <FolderOpen className="w-4 h-4 text-maroon" />
                  My Projects
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4 text-maroon" />
                  Dashboard
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4 text-maroon" />
                  My Profile
                </Link>

                {currentUser.role === 'user' && (
                  <Link
                    to="/posts/create"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <PlusCircle className="w-4 h-4 text-maroon" />
                    Post a Job
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-muted"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 rounded-lg border border-maroon text-maroon text-sm hover:bg-maroon-light"
                  style={{ fontWeight: 500 }}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-2 rounded-lg bg-maroon text-white text-sm hover:bg-maroon-dark"
                  style={{ fontWeight: 500 }}
                  onClick={() => setMobileOpen(false)}
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}