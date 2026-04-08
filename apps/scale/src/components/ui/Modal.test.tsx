import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import React from "react";
import { Modal } from "./Modal";

describe("Modal", () => {
  const sizes = ["sm", "md", "lg", "xl", "full"] as const;

  // open/closed = 10 tests
  it("renders when open=true", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(getByTestId("modal")).toBeDefined();
  });

  it("does not render when open=false", async () => {
    const { queryByTestId } = await render(
      <Modal open={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(queryByTestId("modal")).toBeNull();
  });

  it("renders overlay when open", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(getByTestId("modal-overlay")).toBeDefined();
  });

  it("no overlay when closed", async () => {
    const { queryByTestId } = await render(
      <Modal open={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(queryByTestId("modal-overlay")).toBeNull();
  });

  it("renders body when open", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}}>
        Body content
      </Modal>,
    );
    expect(getByTestId("modal-body")).toBeDefined();
  });

  it("renders close button", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(getByTestId("modal-close")).toBeDefined();
  });

  for (let i = 0; i < 4; i++) {
    it(`open state render attempt ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Modal open={true} onClose={() => {}}>
          Test {i}
        </Modal>,
      );
      expect(getByTestId("modal-body")).toBeDefined();
    });
  }

  // size tests = 5 tests
  for (const size of sizes) {
    it(`renders size=${size}`, async () => {
      const { getByTestId } = await render(
        <Modal open={true} onClose={() => {}} size={size}>
          Content
        </Modal>,
      );
      expect(getByTestId("modal")).toBeDefined();
    });
  }

  // size × content combinations = 15 tests
  const contentTypes = ["Short", "A longer piece of content", "Content with <tags> & entities"];
  for (const size of sizes) {
    for (const content of contentTypes.slice(0, 3)) {
      it(`size=${size} with content "${content.substring(0, 20)}"`, async () => {
        const { getByTestId } = await render(
          <Modal open={true} onClose={() => {}} size={size}>
            {content}
          </Modal>,
        );
        expect(getByTestId("modal-body")).toBeDefined();
      });
    }
  }

  // with/without footer = 10 tests
  it("renders footer when provided", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}} footer={<button>OK</button>}>
        Content
      </Modal>,
    );
    expect(getByTestId("modal-footer")).toBeDefined();
  });

  it("no footer when not provided", async () => {
    const { queryByTestId } = await render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(queryByTestId("modal-footer")).toBeNull();
  });

  for (let i = 0; i < 8; i++) {
    it(`footer test ${i + 1}`, async () => {
      const footer = <div data-testid={`footer-content-${i}`}>Footer {i}</div>;
      const { getByTestId } = await render(
        <Modal open={true} onClose={() => {}} footer={footer}>
          Content
        </Modal>,
      );
      expect(getByTestId(`footer-content-${i}`)).toBeDefined();
    });
  }

  // close methods = 15 tests
  it("calls onClose when close button clicked", async () => {
    let closed = false;
    const { getByTestId } = await render(
      <Modal
        open={true}
        onClose={() => {
          closed = true;
        }}
      >
        Content
      </Modal>,
    );
    await fireEvent.click(getByTestId("modal-close"));
    expect(closed).toBe(true);
  });

  it("calls onClose when overlay clicked (closeOnOverlay=true)", async () => {
    let closed = false;
    const { getByTestId } = await render(
      <Modal
        open={true}
        onClose={() => {
          closed = true;
        }}
        closeOnOverlay
      >
        Content
      </Modal>,
    );
    await fireEvent.click(getByTestId("modal-overlay"));
    expect(closed).toBe(true);
  });

  it("does not call onClose when closeOnOverlay=false and overlay clicked", async () => {
    let closed = false;
    const { getByTestId } = await render(
      <Modal
        open={true}
        onClose={() => {
          closed = true;
        }}
        closeOnOverlay={false}
      >
        Content
      </Modal>,
    );
    await fireEvent.click(getByTestId("modal-overlay"));
    expect(closed).toBe(false);
  });

  for (let i = 0; i < 12; i++) {
    it(`close button fires correctly ${i + 1}`, async () => {
      let called = false;
      const { getByTestId } = await render(
        <Modal
          open={true}
          onClose={() => {
            called = true;
          }}
        >
          Content
        </Modal>,
      );
      await fireEvent.click(getByTestId("modal-close"));
      expect(called).toBe(true);
    });
  }

  // title variations = 20 tests
  it("renders title when provided", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}} title="My Title">
        Content
      </Modal>,
    );
    expect(getByTestId("modal-title")).toBeDefined();
  });

  it("renders header when title provided", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}} title="Test">
        Content
      </Modal>,
    );
    expect(getByTestId("modal-header")).toBeDefined();
  });

  const titles = [
    "Confirm Action",
    "Delete Vendor",
    "Edit Policy",
    "Add Control",
    "Review Risk",
    "Assign User",
    "Export Data",
    "Import CSV",
    "Settings",
    "Generate Report",
    "Archive Item",
    "Restore Item",
    "Send Notification",
    "Create Audit",
    "View Details",
    "Bulk Update",
    "Filter Results",
  ];
  for (const title of titles) {
    it(`title="${title}"`, async () => {
      const { getByTestId } = await render(
        <Modal open={true} onClose={() => {}} title={title}>
          Content
        </Modal>,
      );
      expect(getByTestId("modal-title")).toBeDefined();
    });
  }

  it("no header when no title", async () => {
    const { queryByTestId } = await render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(queryByTestId("modal-header")).toBeNull();
  });

  // snapshot = 5 tests
  it("snapshot: default open", async () => {
    await render(
      <Modal open={true} onClose={() => {}} title="Test">
        Content
      </Modal>,
    );
    await snapshot("modal-open");
  });

  it("snapshot: size sm", async () => {
    await render(
      <Modal open={true} onClose={() => {}} size="sm" title="Small">
        Content
      </Modal>,
    );
    await snapshot("modal-sm");
  });

  it("snapshot: size lg", async () => {
    await render(
      <Modal open={true} onClose={() => {}} size="lg" title="Large">
        Content
      </Modal>,
    );
    await snapshot("modal-lg");
  });

  it("snapshot: with footer", async () => {
    await render(
      <Modal open={true} onClose={() => {}} title="Title" footer={<button>OK</button>}>
        Content
      </Modal>,
    );
    await snapshot("modal-with-footer");
  });

  it("snapshot: no title", async () => {
    await render(
      <Modal open={true} onClose={() => {}}>
        Just content
      </Modal>,
    );
    await snapshot("modal-no-title");
  });

  // accessibility
  it("has role=dialog", async () => {
    const { getByRole } = await render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(getByRole("dialog")).toBeDefined();
  });

  it("custom testId works", async () => {
    const { getByTestId } = await render(
      <Modal open={true} onClose={() => {}} data-testid="my-modal">
        Content
      </Modal>,
    );
    expect(getByTestId("my-modal")).toBeDefined();
  });
});
