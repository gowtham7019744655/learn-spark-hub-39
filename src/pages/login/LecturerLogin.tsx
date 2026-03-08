import { BookOpen } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

const LecturerLogin = () => (
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
);

export default LecturerLogin;
