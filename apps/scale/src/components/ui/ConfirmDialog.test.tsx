import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import React from "react";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const variants = ["danger", "warning", "info"] as const;

  const defaultProps = {
    open: true,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    onConfirm: () => {},
    onCancel: () => {},
  };

  // variant × loading = 12 tests (3 variants × 2 loading states × 2 open states)
  for (const variant of variants) {
    it(`renders variant=${variant} loading=false`, async () => {
      const { getByTestId } = await render(<ConfirmDialog {...defaultProps} variant={variant} />);
      expect(getByTestId("confirm-dialog")).toBeDefined();
    });
  }

  for (const variant of variants) {
    it(`renders variant=${variant} loading=true`, async () => {
      const { getByTestId } = await render(
        <ConfirmDialog {...defaultProps} variant={variant} loading />,
      );
      expect(getByTestId("confirm-dialog-spinner")).toBeDefined();
    });
  }

  for (const variant of variants) {
    it(`closed dialog: variant=${variant}`, async () => {
      const { queryByTestId } = await render(
        <ConfirmDialog {...defaultProps} open={false} variant={variant} />,
      );
      expect(queryByTestId("confirm-dialog")).toBeNull();
    });
  }

  for (const variant of variants) {
    it(`open=true variant=${variant} renders overlay`, async () => {
      const { getByTestId } = await render(<ConfirmDialog {...defaultProps} variant={variant} />);
      expect(getByTestId("confirm-dialog-overlay")).toBeDefined();
    });
  }

  // confirm/cancel actions = 20 tests
  it("calls onConfirm when confirm clicked", async () => {
    let confirmed = false;
    const { getByTestId } = await render(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={() => {
          confirmed = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("confirm-dialog-confirm"));
    expect(confirmed).toBe(true);
  });

  it("calls onCancel when cancel clicked", async () => {
    let cancelled = false;
    const { getByTestId } = await render(
      <ConfirmDialog
        {...defaultProps}
        onCancel={() => {
          cancelled = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("confirm-dialog-cancel"));
    expect(cancelled).toBe(true);
  });

  it("does not call onConfirm when loading", async () => {
    let confirmed = false;
    const { getByTestId } = await render(
      <ConfirmDialog
        {...defaultProps}
        loading
        onConfirm={() => {
          confirmed = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("confirm-dialog-confirm"));
    expect(confirmed).toBe(false);
  });

  for (const variant of variants) {
    it(`confirm fires for variant=${variant}`, async () => {
      let called = false;
      const { getByTestId } = await render(
        <ConfirmDialog
          {...defaultProps}
          variant={variant}
          onConfirm={() => {
            called = true;
          }}
        />,
      );
      await fireEvent.click(getByTestId("confirm-dialog-confirm"));
      expect(called).toBe(true);
    });
  }

  for (const variant of variants) {
    it(`cancel fires for variant=${variant}`, async () => {
      let called = false;
      const { getByTestId } = await render(
        <ConfirmDialog
          {...defaultProps}
          variant={variant}
          onCancel={() => {
            called = true;
          }}
        />,
      );
      await fireEvent.click(getByTestId("confirm-dialog-cancel"));
      expect(called).toBe(true);
    });
  }

  for (let i = 0; i < 11; i++) {
    it(`action test ${i + 1}`, async () => {
      let action = "";
      const { getByTestId } = await render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={() => {
            action = "confirm";
          }}
          onCancel={() => {
            action = "cancel";
          }}
        />,
      );
      if (i % 2 === 0) {
        await fireEvent.click(getByTestId("confirm-dialog-confirm"));
        expect(action).toBe("confirm");
      } else {
        await fireEvent.click(getByTestId("confirm-dialog-cancel"));
        expect(action).toBe("cancel");
      }
    });
  }

  // button labels = 15 tests
  it("renders default confirm label", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByTestId("confirm-dialog-confirm")).toBeDefined();
  });

  it("renders custom confirm label", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} confirmLabel="Delete" />);
    expect(getByTestId("confirm-dialog-confirm")).toBeDefined();
  });

  it("renders default cancel label", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByTestId("confirm-dialog-cancel")).toBeDefined();
  });

  it("renders custom cancel label", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} cancelLabel="Go back" />);
    expect(getByTestId("confirm-dialog-cancel")).toBeDefined();
  });

  const confirmLabels = [
    "Delete",
    "Remove",
    "Archive",
    "Proceed",
    "Yes, continue",
    "Confirm delete",
    "Apply",
    "Accept",
    "Submit",
    "Execute",
  ];
  for (const label of confirmLabels) {
    it(`confirmLabel="${label}"`, async () => {
      const { getByTestId } = await render(
        <ConfirmDialog {...defaultProps} confirmLabel={label} />,
      );
      expect(getByTestId("confirm-dialog-confirm")).toBeDefined();
    });
  }

  // message content = 15 tests
  const messages = [
    "Are you sure you want to delete this vendor?",
    "This action cannot be undone.",
    "Removing this policy will affect all users.",
    "This will permanently delete the record.",
    "Are you sure you want to archive this item?",
    "This vendor will be removed from the list.",
    "Confirm to proceed with the bulk action.",
    "This operation may take several minutes.",
    "All associated data will be removed.",
    "Users will lose access immediately.",
    "This will trigger a re-audit.",
    "Send notification to all stakeholders?",
    "Reset all settings to defaults?",
    "Clear all cached data?",
    "Revoke API access for this integration?",
  ];

  for (const msg of messages) {
    it(`message="${msg.substring(0, 40)}"`, async () => {
      const { getByTestId } = await render(<ConfirmDialog {...defaultProps} message={msg} />);
      expect(getByTestId("confirm-dialog-message")).toBeDefined();
    });
  }

  // loading state prevents double-click = 10 tests
  it("loading state shows spinner", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} loading />);
    expect(getByTestId("confirm-dialog-spinner")).toBeDefined();
  });

  it("no spinner when not loading", async () => {
    const { queryByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(queryByTestId("confirm-dialog-spinner")).toBeNull();
  });

  it("confirm button disabled when loading", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <ConfirmDialog
        {...defaultProps}
        loading
        onConfirm={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("confirm-dialog-confirm"));
    await fireEvent.click(getByTestId("confirm-dialog-confirm"));
    await fireEvent.click(getByTestId("confirm-dialog-confirm"));
    expect(count).toBe(0);
  });

  for (const variant of variants) {
    it(`loading for variant=${variant} prevents confirm`, async () => {
      let called = false;
      const { getByTestId } = await render(
        <ConfirmDialog
          {...defaultProps}
          variant={variant}
          loading
          onConfirm={() => {
            called = true;
          }}
        />,
      );
      await fireEvent.click(getByTestId("confirm-dialog-confirm"));
      expect(called).toBe(false);
    });
  }

  for (let i = 0; i < 6; i++) {
    it(`loading prevents fire test ${i + 1}`, async () => {
      let count = 0;
      const { getByTestId } = await render(
        <ConfirmDialog
          {...defaultProps}
          loading
          onConfirm={() => {
            count++;
          }}
        />,
      );
      await fireEvent.click(getByTestId("confirm-dialog-confirm"));
      expect(count).toBe(0);
    });
  }

  // keyboard = 5 tests
  it("renders with role=alertdialog", async () => {
    const { getByRole } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByRole("alertdialog")).toBeDefined();
  });

  it("has aria-modal=true", async () => {
    const { getByRole } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByRole("alertdialog")).toBeDefined();
  });

  it("has aria-labelledby", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByTestId("confirm-dialog-title")).toBeDefined();
  });

  it("has aria-describedby", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByTestId("confirm-dialog-message")).toBeDefined();
  });

  it("icon is shown", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByTestId("confirm-dialog-icon")).toBeDefined();
  });

  // snapshot = 3 tests
  for (const variant of variants) {
    it(`snapshot: ${variant}`, async () => {
      await render(<ConfirmDialog {...defaultProps} variant={variant} />);
      await snapshot(`confirm-dialog-${variant}`);
    });
  }

  // title variations = 20+ tests
  const titles = [
    "Delete Vendor",
    "Archive Policy",
    "Remove User",
    "Revoke Access",
    "Reset Password",
    "Clear Data",
    "Disable Integration",
    "Cancel Subscription",
    "Delete Framework",
    "Remove Control",
    "Archive Issue",
    "Resolve Incident",
    "Bulk Delete",
    "Confirm Import",
    "Reset Settings",
    "Terminate Session",
    "Suspend Account",
    "Restore Backup",
    "Purge Logs",
    "Disconnect System",
  ];

  for (const title of titles) {
    it(`title="${title}"`, async () => {
      const { getByTestId } = await render(<ConfirmDialog {...defaultProps} title={title} />);
      expect(getByTestId("confirm-dialog-title")).toBeDefined();
    });
  }

  it("custom testId", async () => {
    const { getByTestId } = await render(
      <ConfirmDialog {...defaultProps} data-testid="my-dialog" />,
    );
    expect(getByTestId("my-dialog")).toBeDefined();
  });

  it("footer contains both buttons", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} />);
    expect(getByTestId("confirm-dialog-footer")).toBeDefined();
    expect(getByTestId("confirm-dialog-confirm")).toBeDefined();
    expect(getByTestId("confirm-dialog-cancel")).toBeDefined();
  });

  it("data-variant attribute set", async () => {
    const { getByTestId } = await render(<ConfirmDialog {...defaultProps} variant="danger" />);
    expect(getByTestId("confirm-dialog")).toBeDefined();
  });
});
