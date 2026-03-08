import { AuthForm } from '@/components/auth/AuthForm';
import { HeartHandshake } from 'lucide-react';

const CounselorLogin = () => {
  return (
    <AuthForm
      role="counselor"
      title="Counselor Portal"
      description="Access counseling dashboard and student risk monitoring"
      icon={HeartHandshake}
      iconClassName="bg-primary/10"
      dashboardPath="/counselor/dashboard"
      emailPlaceholder="counselor@school.edu"
      namePlaceholder="Counselor Name"
    />
  );
};

export default CounselorLogin;
