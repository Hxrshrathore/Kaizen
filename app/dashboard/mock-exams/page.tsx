'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MockExamsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/generator');
  }, [router]);

  return (
    <div className="h-[60vh] flex items-center justify-center">
      <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest animate-pulse">
        Redirecting to AI Paper Generator...
      </p>
    </div>
  );
}