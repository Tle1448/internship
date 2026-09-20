"use client";

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useAdvisorProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  return { profile, loading };
}