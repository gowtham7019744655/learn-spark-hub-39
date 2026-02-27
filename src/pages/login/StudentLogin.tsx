import { GraduationCap } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

const StudentLogin = () => (
  <AuthForm
    role="student"
    title="Student Portal"
    description="Access your academic dashboard and track your progress"
    icon={GraduationCap}
    iconClassName="bg-primary/10"
    dashboardPath="/student/dashboard"
    emailPlaceholder="student@school.edu"
    namePlaceholder="John Doe"
    showUsn
  />
);

export default StudentLogin;
