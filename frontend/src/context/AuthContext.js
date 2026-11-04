import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // 1. Current User Query: Derive the user directly from this query (no duplicate state)
  const {
    data: user = null,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });

  // 2. Login Mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Update the currentUser cache immediately
      queryClient.setQueryData(['currentUser'], data.user);
      // Invalidate tasks query so the user's tasks are fetched
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // 3. Register Mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // 4. Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Reset user to null
      queryClient.setQueryData(['currentUser'], null);
      // Clear tasks from cache to prevent leaking data to another user
      queryClient.removeQueries({ queryKey: ['tasks'] });
    },
  });

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isUserLoading,
    refetchUser,
    login: (credentials) => loginMutation.mutateAsync(credentials),
    register: (userData) => registerMutation.mutateAsync(userData),
    logout: () => logoutMutation.mutateAsync(),
    isAuthActionLoading:
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume AuthContext conveniently
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

