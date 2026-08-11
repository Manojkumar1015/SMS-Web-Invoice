'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save, Building2, Percent, Users, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Settings Saved', description: 'Business details updated.', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business & Application Settings"
        subtitle="Manage tax rules, company profile info, bank accounts, and user access permissions."
      />

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="taxes">Taxes & GST Rules</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
        </TabsList>

        {/* Business Profile Tab */}
        <TabsContent value="business" className="pt-4">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Primary organization information for headers and invoices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Company Name</label>
                    <Input defaultValue="Acme Software Solutions Pvt Ltd" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Display / Trade Name</label>
                    <Input defaultValue="Acme Solutions" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Email</label>
                    <Input defaultValue="billing@acmesolutions.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Phone</label>
                    <Input defaultValue="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Website</label>
                    <Input defaultValue="https://acmesolutions.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">GSTIN</label>
                    <Input defaultValue="27AAAAA0000A1Z5" className="font-mono text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">PAN Number</label>
                    <Input defaultValue="AAAAA0000A" className="font-mono text-xs" />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold text-foreground">Bank Account Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Bank Name & Branch</label>
                      <Input defaultValue="HDFC Bank, BKC Branch Mumbai" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Account Number</label>
                      <Input defaultValue="50200019283746" className="font-mono text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">IFSC Code</label>
                      <Input defaultValue="HDFC0000123" className="font-mono text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">UPI Virtual Payment Address</label>
                      <Input defaultValue="acmesoftware@hdfcbank" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border pt-3">
                <Button type="submit" size="sm">
                  <Save className="h-4 w-4 mr-1.5" /> Save Profile
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Taxes & GST Rules Tab */}
        <TabsContent value="taxes" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Tax Configurations</CardTitle>
              <CardDescription>Configure state code, intra-state vs inter-state tax splits (CGST/SGST vs IGST).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 rounded bg-surface-hover border border-border">
                <p className="font-semibold text-foreground">Place of Supply Rule:</p>
                <p className="text-muted-foreground mt-0.5">
                  Same state transactions automatically calculate CGST (9%) + SGST (9%). Cross-state transactions compute IGST (18%).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Roles Tab */}
        <TabsContent value="users" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Users & Team Roles</CardTitle>
              <CardDescription>Manage organization members and role permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
                    AD
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Vikram Malhotra (You)</h4>
                    <p className="text-muted-foreground text-[11px]">admin@company.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Super Admin
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
