import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, BookOpen, HeartHandshake, BarChart3, Brain, Shield, Zap, ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated && role) {
      const dashboards: Record<string, string> = {
        student: '/student/dashboard',
        lecturer: '/lecturer/dashboard',
        counselor: '/counselor/dashboard',
      };
      if (dashboards[role]) navigate(dashboards[role], { replace: true });
    }
  }, [isAuthenticated, role, loading, navigate]);

  const loginOptions = [
    {
      title: 'Student Portal',
      description: 'Track grades, assignments, view AI-powered insights, and monitor your academic journey in real time.',
      icon: GraduationCap,
      link: '/login/student',
      gradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    },
    {
      title: 'Professor Portal',
      description: 'Manage courses, grade assessments, create tests, and analyze class-wide student performance data.',
      icon: BookOpen,
      link: '/login/lecturer',
      gradient: 'from-secondary/10 to-secondary/5',
      iconBg: 'bg-secondary/15',
      iconColor: 'text-secondary',
    },
    {
      title: 'Counselor Portal',
      description: 'Access academic prediction reports, identify at-risk students, and plan intervention strategies.',
      icon: HeartHandshake,
      link: '/login/counselor',
      gradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    },
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Detailed visualizations of academic progress with SGPA tracking and trend analysis.',
    },
    {
      icon: Brain,
      title: 'AI Prediction & Skills',
      description: 'Smart predictions, skill gap analysis, and personalized study recommendations.',
    },
    {
      icon: Shield,
      title: 'Risk Monitoring',
      description: 'Early dropout detection, behavioral trend analysis, and attendance risk alerts.',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Instant notifications for assignments, test results, and performance milestones.',
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Academic Performance Platform
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            EDU-PREDICT
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Academic & Skills Pathway
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            A comprehensive platform for tracking, analyzing, and improving academic 
            performance with AI-driven insights, skill analysis, and real-time analytics.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/login/student">
              <Button size="lg" className="h-12 gap-2 px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login/lecturer">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
                Professor Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Login Portals */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">Choose Your Portal</h2>
            <p className="text-muted-foreground">Select your role to access the platform features tailored for you.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loginOptions.map((option) => (
              <Link key={option.title} to={option.link} className="group">
                <Card className="relative h-full overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <CardContent className="relative flex flex-col gap-4 p-8">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${option.iconBg} transition-transform group-hover:scale-110`}>
                      <option.icon className={`h-7 w-7 ${option.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold text-foreground">{option.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-all group-hover:opacity-100">
                      Continue to portal
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">Why EDU-PREDICT?</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Everything you need to track, analyze, and improve academic outcomes in one place.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 bg-card transition-all duration-300 hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">EDU-PREDICT</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/admin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Admin Panel
              </Link>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Index;
