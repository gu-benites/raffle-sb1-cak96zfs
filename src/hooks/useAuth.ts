import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useRequireAuth(requireAdmin = false) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      if (requireAdmin) {
        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
          navigate('/dashboard');
        }
      }
    };

    checkAuth();
  }, [navigate, requireAdmin]);
}

export function useRedirectIfAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };

    checkAuth();
  }, [navigate]);
} 