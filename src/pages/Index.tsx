import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, BarChart3, MessageSquare, Award } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

const Index = () => {
  const roles = [
    {
      title: 'Student',
      description: 'Track your grades, view assignments, and monitor your academic progress',
      icon: GraduationCap,
      link: '/login/student',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Lecturer',
      description: 'Manage courses, grade assessments, and track student performance',
      icon: BookOpen,
      link: '/login/lecturer',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Parent',
      description: "Monitor your child's academic progress and stay connected with educators",
      icon: Users,
      link: '/login/parent',
      color: 'bg-accent-foreground/10 text-accent-foreground',
    },
  ];

  const features = [
    {
      title: 'Performance Analytics',
      description: 'Comprehensive dashboards with visual charts and graphs',
      icon: BarChart3,
    },
    {
      title: 'AI Assistant',
      description: 'Get instant help with our intelligent chatbot',
      icon: MessageSquare,
    },
    {
      title: 'Assessment Engine',
      description: 'Create and take tests with automated scoring',
      icon: Award,
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Student Performance
            <span className="block text-primary">Hub</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            A comprehensive platform for tracking academic performance, managing assessments,
            and fostering communication between students, lecturers, and parents.
          </p>
        </div>
      </section>

      {/* Role Selection */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-2xl font-semibold text-foreground">
            Select Your Role to Get Started
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <Card
                key={role.title}
                className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader>
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${role.color}`}
                  >
                    <role.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={role.link}>
                    <Button className="w-full group-hover:bg-primary">
                      Login as {role.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-foreground">
            Platform Features
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Student Performance Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Student Performance Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Index;
