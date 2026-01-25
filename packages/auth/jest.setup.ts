import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

// Mock Next.js navigation with default implementations
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockPathname = jest.fn(() => "/");
const mockSearchParams = jest.fn(() => new URLSearchParams());

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  usePathname: mockPathname,
  useSearchParams: mockSearchParams,
  useParams: jest.fn(() => ({})),
  useSelectedLayoutSegment: jest.fn(),
  useSelectedLayoutSegments: jest.fn(() => []),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Export mocks for use in tests
export { mockPush, mockReplace, mockRefresh, mockPathname, mockSearchParams };
