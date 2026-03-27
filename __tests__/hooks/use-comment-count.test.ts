import { renderHook, waitFor } from "@testing-library/react";

const mockGetCommentCount = jest.fn();

jest.mock("@/lib/services/comments", () => ({
  commentsService: {
    getCommentCount: (...a: unknown[]) => mockGetCommentCount(...a),
    getComments: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  },
}));

import { useCommentCount } from "@/hooks/use-comment-count";

describe("useCommentCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns count from service", async () => {
    mockGetCommentCount.mockResolvedValueOnce(7);
    const { result } = renderHook(() => useCommentCount("mix", "mix-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(7);
  });
});

