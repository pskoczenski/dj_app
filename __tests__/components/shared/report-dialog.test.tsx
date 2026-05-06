import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockCreateReport = jest.fn();
jest.mock("@/lib/services/reports", () => ({
  reportsService: {
    createReport: (...args: unknown[]) => mockCreateReport(...args),
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { ReportDialog } from "@/components/shared/report-dialog";

describe("ReportDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits a report", async () => {
    mockCreateReport.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(
      <ReportDialog
        subjectType="profile"
        subjectId="00000000-0000-0000-0000-000000000000"
        trigger={<button type="button">Report</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /report/i }));
    await user.click(await screen.findByRole("button", { name: /submit report/i }));

    expect(mockCreateReport).toHaveBeenCalledWith(
      expect.objectContaining({ subjectType: "profile", reason: "spam" }),
    );
  });
});

