import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { profile, role, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!role) return '/';
    switch (role) {
      case 'student': return '/student/dashboard';
      case 'lecturer': return '/lecturer/dashboard';
      case 'counselor': return '/counselor/dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">EDU-PREDICT</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" size="sm" className="text-sm font-medium">Dashboard</Button>
                </Link>
                <Link to="/tests">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">Tests</Button>
                </Link>
                {role === 'lecturer' && (
                  <Link to="/manage-subjects">
                    <Button variant="ghost" size="sm" className="text-sm font-medium">Subjects</Button>
                  </Link>
                )}
                <div className="mx-3 h-6 w-px bg-border" />
                <span className="mr-2 text-sm text-muted-foreground">
                  {profile?.full_name || profile?.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login/student">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">Student</Button>
                </Link>
                <Link to="/login/lecturer">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">Professor</Button>
                </Link>
                <Link to="/login/counselor">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">Counselor</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted/50 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border/60 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Dashboard</Button>
                  </Link>
                  <Link to="/tests" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Tests</Button>
                  </Link>
                  {role === 'lecturer' && (
                    <Link to="/manage-subjects" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start font-medium">Subjects</Button>
                    </Link>
                  )}
                  <div className="my-2 h-px bg-border" />
                  <p className="px-4 py-2 text-sm text-muted-foreground">{profile?.full_name || profile?.email}</p>
                  <Button
                    variant="outline"
                    className="mt-1 gap-2"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login/student" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Student Login</Button>
                  </Link>
                  <Link to="/login/lecturer" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Professor Login</Button>
                  </Link>
                  <Link to="/login/counselor" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Counselor Login</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
