'use client';

import { redirect } from 'next/navigation';
import * as React from 'react';

export default function SettingsIndexPage() {
  React.useEffect(() => {
    redirect('/app/settings/business');
  }, []);

  return null;
}
