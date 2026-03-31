import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "@/components/events/event-form";

jest.mock("@/components/forms/genre-select", () => ({
  GenreSelect: ({ onChange }: { onChange: (v: unknown) => void }) => (
    <button
      type="button"
      onClick={() => onChange([{ id: "g1", slug: "house", name: "House" }])}
    >
      Pick genre
    </button>
  ),
}));

jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    ensureEventGroupThread: jest.fn().mockResolvedValue("conv-1"),
    syncEventGroupParticipants: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    create: jest.fn().mockResolvedValue({ id: "new-evt" }),
    update: jest.fn().mockResolvedValue({ id: "evt-1" }),
  },
}));

jest.mock("@/lib/services/event-lineup", () => ({
  eventLineupService: { add: jest.fn().mockResolvedValue({}) },
}));

jest.mock("@/lib/services/storage", () => ({
  storageService: {
    uploadEventFlyer: jest.fn(),
    uploadEventFlyerDraft: jest.fn(),
    validateImageFile: jest.fn().mockReturnValue({ valid: true }),
  },
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    search: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
  },
}));

const mockCitySearch = jest.fn().mockResolvedValue([
  {
    id: "city-pdx",
    name: "Portland",
    state_name: "Oregon",
    state_code: "OR",
    created_at: "2025-01-01",
  },
]);

jest.mock("@/lib/services/cities", () => ({
  citiesService: {
    search: (...a: unknown[]) => mockCitySearch(...a),
    getById: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import { conversationsService } from "@/lib/services/conversations";
import { eventsService } from "@/lib/services/events";

async function selectCityWithAutocomplete(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
) {
  const input = await screen.findByLabelText(label);
  await user.type(input, "po");
  await waitFor(() => expect(mockCitySearch).toHaveBeenCalled());
  const option = await screen.findByRole("option", { name: /portland,\s*or/i });
  await user.click(option);
}

describe("EventForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ensures event group thread after publishing a new event", async () => {
    const user = userEvent.setup();
    render(<EventForm mode="create" currentUserId="user-1" />);

    await user.type(screen.getByLabelText(/title/i), "Launch Party");
    await user.type(screen.getByLabelText(/start date/i), "2025-08-01");
    await selectCityWithAutocomplete(user, /event city/i);
    await user.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(conversationsService.ensureEventGroupThread).toHaveBeenCalledWith(
        "new-evt",
      );
    });
    expect(conversationsService.syncEventGroupParticipants).not.toHaveBeenCalled();
  });

  it("renders title and start date fields", () => {
    render(<EventForm mode="create" currentUserId="user-1" />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it("disables publish when title is empty", () => {
    render(<EventForm mode="create" currentUserId="user-1" />);
    const publishBtn = screen.getByRole("button", { name: /publish/i });
    expect(publishBtn).toBeDisabled();
  });

  it("disables publish when start date is empty but title is filled", async () => {
    const user = userEvent.setup();
    render(<EventForm mode="create" currentUserId="user-1" />);

    await user.type(screen.getByLabelText(/title/i), "Test Event");

    const publishBtn = screen.getByRole("button", { name: /publish/i });
    expect(publishBtn).toBeDisabled();
  });

  it("enables publish when title, start date, and city are filled", async () => {
    const user = userEvent.setup();
    render(<EventForm mode="create" currentUserId="user-1" />);

    await user.type(screen.getByLabelText(/title/i), "Test Event");
    await user.type(
      screen.getByLabelText(/start date/i),
      "2025-08-01",
    );
    await selectCityWithAutocomplete(user, /event city/i);

    const publishBtn = screen.getByRole("button", { name: /publish/i });
    expect(publishBtn).toBeEnabled();
  });

  it("shows Save as Draft button", () => {
    render(<EventForm mode="create" currentUserId="user-1" />);
    expect(
      screen.getByRole("button", { name: /save as draft/i }),
    ).toBeInTheDocument();
  });

  it("shows Added DJs cards below lineup when initial lineup has entries", () => {
    render(
      <EventForm
        mode="create"
        currentUserId="user-1"
        initialLineup={[
          {
            tempId: "tmp-1",
            profileId: "dj-1",
            displayName: "DJ Alpha",
            slug: "dj-alpha",
            profileImageUrl: null,
            isHeadliner: true,
            setTime: "22:00",
            sortOrder: 0,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /added djs/i })).toBeInTheDocument();
    expect(screen.getAllByText("DJ Alpha").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /dj alpha/i })).toHaveAttribute(
      "href",
      "/dj/dj-alpha",
    );
  });

  it("includes city_id in create payload when publishing", async () => {
    const user = userEvent.setup();
    render(<EventForm mode="create" currentUserId="user-1" />);

    await user.click(screen.getByRole("button", { name: /pick genre/i }));

    await user.type(screen.getByLabelText(/title/i), "Launch Party");
    await user.type(screen.getByLabelText(/start date/i), "2025-08-01");
    await selectCityWithAutocomplete(user, /event city/i);
    await user.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(eventsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ city_id: "city-pdx", genre_ids: ["g1"] }),
      );
    });
  });

  it("shows Cancel Event button in edit mode", () => {
    render(
      <EventForm
        mode="edit"
        currentUserId="user-1"
        event={{
          id: "evt-1",
          title: "Existing",
          start_date: "2025-08-01",
          status: "published",
          created_by: "user-1",
          deleted_at: null,
          city_id: "city-pdx",
          cities: {
            id: "city-pdx",
            name: "Portland",
            state_name: "Oregon",
            state_code: "OR",
            created_at: "2025-01-01",
          },
          country: null,
          description: null,
          end_date: null,
          start_time: null,
          end_time: null,
          flyer_image_url: null,
          genre_ids: [],
          genres: null,
          google_place_id: null,
          latitude: null,
          longitude: null,
          ticket_url: null,
          venue: null,
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
        }}
      />,
    );
    expect(
      screen.getByRole("button", { name: /cancel event/i }),
    ).toBeInTheDocument();
  });
});
