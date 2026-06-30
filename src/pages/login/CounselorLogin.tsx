import { AuthForm } from '@/components/auth/AuthForm';
import { HeartHandshake } from 'lucide-react';
import { SEO } from '@/components/SEO';

const CounselorLogin = () => {
  return (
    <>
      <SEO
        title="Counselor Login | EDU-PREDICT"
        description="Sign in to the EDU-PREDICT counselor portal to monitor at-risk students and respond to counseling requests."
        path="/login/counselor"
      />
      <AuthForm
        role="counselor"
        title="Counselor Portal"
        description="Access counseling dashboard and student risk monitoring"
        icon={HeartHandshake}
        iconClassName="bg-primary/10"
        dashboardPath="/counselor/dashboard"
        emailPlaceholder="counselor@college.ac.in"
        namePlaceholder="Counselor Name"
        requireCollegeEmail
      />
    </>
  );
};

export default CounselorLogin;
