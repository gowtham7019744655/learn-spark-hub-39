import { GraduationCap } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { SEO } from '@/components/SEO';

const StudentLogin = () => (
  <>
    <SEO
      title="Student Login | EDU-PREDICT"
      description="Sign in to your EDU-PREDICT student portal to track grades, take tests, and access counseling support."
      path="/login/student"
    />
    <AuthForm
      role="student"
      title="Student Portal"
      description="Access your academic dashboard and track your progress"
      icon={GraduationCap}
      iconClassName="bg-primary/10"
      dashboardPath="/student/dashboard"
      emailPlaceholder="hiteshbalaji24csds@rnsit.ac.in"
      namePlaceholder="John Doe"
      showUsn
    />
  </>
);

export default StudentLogin;
