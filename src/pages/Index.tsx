import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen } from 'lucide-react';
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
        parent: '/parent/dashboard',
      };
      if (dashboards[role]) navigate(dashboards[role], { replace: true });
    }
  }, [isAuthenticated, role, loading, navigate]);
  // Admin flag - in production this would come from auth context
  const isAdmin = true;

  const options = [
    {
      title: 'Student Login',
      description: 'Access your grades, assignments, and track your academic journey',
      icon: GraduationCap,
      link: '/login/student',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Lecturer Login',
      description: 'Manage courses, grade assessments, and monitor student performance',
      icon: BookOpen,
      link: '/login/lecturer',
      color: 'bg-secondary/10 text-secondary',
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Start — Homepage — Choose Option
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Student Performance
            <span className="block text-primary">Hub</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Select your role to access the platform
          </p>
        </div>
      </section>

      {/* 2x2 Grid of Options */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {options.map((option) => (
              <Card
                key={option.title}
                className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader>
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${option.color}`}
                  >
                    <option.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription className="min-h-[48px]">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={option.link}>
                    <Button className="w-full">Continue</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Student Performance Hub</span>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin / Database
                </Link>
              )}
              <p className="text-sm text-muted-foreground">
                © 2024 All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Index;
