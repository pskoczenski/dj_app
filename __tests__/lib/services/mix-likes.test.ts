import { mixLikesService } from "@/lib/services/mix-likes";

describe("mixLikesService.getLikedMixIdsForUser", () => {
  it("returns empty array when mixIds is empty (no request)", async () => {
    const r = await mixLikesService.getLikedMixIdsForUser("user-1", []);
    expect(r).toEqual([]);
  });
});
