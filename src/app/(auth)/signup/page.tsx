'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, AlertCircle, MailCheck } from 'lucide-react';
import { signupAction } from '../actions';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [companyName, setCompanyName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('email', email);
    formData.append('password', password);

    try {
      const res = await signupAction(formData);
      if (res.success) {
        if (res.requiresConfirmation) {
          setConfirmationSent(true);
          toast({
            title: 'Confirmation Email Sent',
            description: `A verification link has been sent to ${email}.`,
            variant: 'info',
          });
        } else {
          toast({
            title: 'Organization Account Created',
            description: 'Welcome to SMS Billing SaaS! Setting up your workspace.',
            variant: 'success',
          });
          router.push('/app/home');
          router.refresh();
        }
      } else {
        const msg = res.error || 'Failed to create account.';
        setErrorMsg(msg);
        toast({ title: 'Registration Error', description: msg, variant: 'destructive' });
      }
    } catch {
      setErrorMsg('An unexpected error occurred during account creation.');
      toast({ title: 'Error', description: 'Could not connect to service.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 font-extrabold text-2xl text-white shadow-lg mb-2">
              <MailCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Check Your Email</h1>
            <p className="text-xs text-slate-400">Enterprise Commercial Billing Foundation</p>
          </div>

          <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-base text-white">Confirmation Link Sent</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                We sent a verification link to <span className="font-bold text-indigo-400">{email}</span>. Please click the link to confirm your account and launch <strong className="text-slate-200">{companyName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full h-10 text-xs font-bold border-slate-700 text-slate-300 hover:bg-slate-800">
                  Return to Sign In
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-extrabold text-2xl text-white shadow-lg mb-2">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SMS Billing SaaS</h1>
          <p className="text-xs text-slate-400">Enterprise Commercial Billing Foundation</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-base text-white">Create Organization Account</CardTitle>
            <CardDescription className="text-slate-400">Setup your company account and primary administrator profile.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Systems Ltd"
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Work Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" disabled={submitting} variant="accent" className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? 'Setting Up Account...' : 'Get Started'} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <div className="text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300 font-semibold">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
