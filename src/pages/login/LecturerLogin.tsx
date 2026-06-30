import { BookOpen } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { SEO } from '@/components/SEO';

const LecturerLogin = () => (
  <>
    <SEO
      title="Professor Login | EDU-PREDICT"
      description="Sign in to your EDU-PREDICT lecturer portal to manage assessments, subjects, and class performance analytics."
      path="/login/lecturer"
    />
    <AuthForm
      role="lecturer"
      title="Lecturer Portal"
      description="Manage your courses and track student performance"
      icon={BookOpen}
      iconClassName="bg-secondary/10"
      dashboardPath="/lecturer/dashboard"
      emailPlaceholder="lecturer@college.ac.in"
      namePlaceholder="Dr. Jane Smith"
      requireCollegeEmail
    />
  </>
);

export default LecturerLogin;
