import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/messages/MessageBubble";

describe("MessageBubble", () => {
  it("shows placeholder for soft-deleted message", () => {
    render(
      <MessageBubble
        isOwn={false}
        message={{
          id: "m1",
          conversation_id: "c1",
          sender_id: "u1",
          body: "secret",
          created_at: "2026-01-01T00:00:00.000Z",
          deleted_at: "2026-01-01T01:00:00.000Z",
          sender: { id: "u1", display_name: "DJ One", slug: "dj-one", profile_image_url: null },
        }}
      />,
    );

    expect(screen.getByText("This message was deleted")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });
});
