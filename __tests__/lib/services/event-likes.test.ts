import { eventLikesService } from "@/lib/services/event-likes";

describe("eventLikesService.getLikedEventIdsForUser", () => {
  it("returns empty array when eventIds is empty (no request)", async () => {
    const r = await eventLikesService.getLikedEventIdsForUser("user-1", []);
    expect(r).toEqual([]);
  });
});
