import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FollowButton } from "@/components/profile/follow-button";

describe("FollowButton", () => {
  it("shows 'Follow' when not following", () => {
    render(
      <FollowButton isFollowing={false} onFollow={jest.fn()} onUnfollow={jest.fn()} />
    );
    expect(screen.getByRole("button", { name: /follow/i })).toHaveTextContent("Follow");
  });

  it("shows 'Following' when following", () => {
    render(
      <FollowButton isFollowing={true} onFollow={jest.fn()} onUnfollow={jest.fn()} />
    );
    expect(screen.getByRole("button")).toHaveTextContent("Following");
  });

  it("calls onFollow when clicked while not following", async () => {
    const onFollow = jest.fn();
    const user = userEvent.setup();
    render(
      <FollowButton isFollowing={false} onFollow={onFollow} onUnfollow={jest.fn()} />
    );
    await user.click(screen.getByRole("button"));
    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it("calls onUnfollow when clicked while following", async () => {
    const onUnfollow = jest.fn();
    const user = userEvent.setup();
    render(
      <FollowButton isFollowing={true} onFollow={jest.fn()} onUnfollow={onUnfollow} />
    );
    await user.click(screen.getByRole("button"));
    expect(onUnfollow).toHaveBeenCalledTimes(1);
  });
});
