import { Users } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

const ParentLogin = () => (
  <AuthForm
    role="parent"
    title="Parent Portal"
    description="Monitor your child's academic progress and achievements"
    icon={Users}
    iconClassName="bg-accent"
    dashboardPath="/parent/dashboard"
    emailPlaceholder="parent@email.com"
    namePlaceholder="John Parent"
  />
);

export default ParentLogin;
