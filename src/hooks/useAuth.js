// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';
import { loginRequest } from '../authConfig';

export const useAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [graphClient, setGraphClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setIsAuthenticated(true);
      setUser(accounts[0]);
      initializeGraphClient();
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setGraphClient(null);
    }
    setLoading(false);
  }, [accounts]);

  const initializeGraphClient = async () => {
    try {
      const client = Client.init({
        authProvider: async (done) => {
          try {
            const response = await instance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            done(null, response.accessToken);
          } catch (error) {
            console.error('Token acquisition failed:', error);
            done(error, null);
          }
        },
      });
      setGraphClient(client);
    } catch (error) {
      console.error('Graph client initialization failed:', error);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await instance.logoutPopup();
      setGraphClient(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    graphClient,
    loading,
    login,
    logout,
    inProgress: inProgress !== 'none',
  };
};
