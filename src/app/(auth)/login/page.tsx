'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('admin@company.com');
  const [password, setPassword] = React.useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/app/home');
  };

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
            <CardTitle className="text-base text-white">Sign In to Dashboard</CardTitle>
            <CardDescription className="text-slate-400">UI-Only Auth Mode. Click Sign In to enter demo portal.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Work Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white focus:ring-indigo-500"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" variant="accent" className="w-full h-10 text-xs font-bold">
                Sign In to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <div className="text-center text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300 font-semibold">
                  Create Account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
