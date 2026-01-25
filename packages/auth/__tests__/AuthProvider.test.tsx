/**
 * Tests unitaires pour @quelyos/auth
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/AuthProvider";
import React from "react";
import {
  mockPush,
  mockReplace,
  mockPathname,
} from "../jest.setup";

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider apiBaseUrl="http://localhost:3004">{children}</AuthProvider>
  );
};

describe("@quelyos/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockPathname.mockReturnValue("/");
  });

  describe("useAuth hook", () => {
    it("devrait initialiser avec user=null et isLoading=true", async () => {
      // Mock initial auth check to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Non authentifié" }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("devrait charger l'utilisateur depuis /me", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
      };

      // Auth check succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: mockUser }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it("devrait gérer l'échec de chargement utilisateur", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          status: 401,
          json: async () => ({ error: "Non authentifié" }),
        } as Response
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("login", () => {
    it("devrait se connecter avec succès", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
      };

      // Initial auth check fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Non authentifié" }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: mockUser }),
      } as Response);

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockUser);
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("devrait gérer l'échec de connexion", async () => {
      // Initial auth check fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Non authentifié" }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Identifiants invalides" }),
      } as Response);

      await expect(
        act(async () => {
          await result.current.login("test@example.com", "wrongpassword");
        })
      ).rejects.toThrow("Identifiants invalides");
    });
  });

  describe("logout", () => {
    it("devrait se déconnecter avec succès", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
      };

      // Auth check succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: mockUser }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Logout succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("refreshToken", () => {
    it("devrait tenter le refresh lors d'une erreur 401", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
      };

      // Initial auth check fails with 401
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: "Token expired" }),
        } as Response)
        // Refresh succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response)
        // Retry auth check succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockUser,
        } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Vérifie que le refresh a été appelé
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/refresh"),
        expect.any(Object)
      );
    });
  });
});
