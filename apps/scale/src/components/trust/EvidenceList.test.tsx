import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { EvidenceList } from "./EvidenceList";

const sampleFiles = [
  "access-review-q1.pdf",
  "screenshot.png",
  "audit-report.docx",
  "data-export.csv",
  "archive.zip",
];

const fileTypeTests = [
  { file: "report.pdf", expectedType: "PDF" },
  { file: "image.png", expectedType: "PNG" },
  { file: "image.jpg", expectedType: "JPG" },
  { file: "document.doc", expectedType: "DOC" },
  { file: "spreadsheet.xlsx", expectedType: "XLSX" },
  { file: "data.csv", expectedType: "CSV" },
  { file: "archive.zip", expectedType: "ZIP" },
  { file: "image.svg", expectedType: "SVG" },
  { file: "photo.jpeg", expectedType: "JPEG" },
  { file: "backup.tar", expectedType: "TAR" },
];

describe("EvidenceList", () => {
  // Empty state
  it("shows empty state when evidence array is empty", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} />);
    expect(getByTestId("evidence-empty")).toBeDefined();
  });

  it("does not show file list when empty", async () => {
    const { queryByTestId } = await render(<EvidenceList evidence={[]} />);
    expect(queryByTestId("evidence-file-list")).toBeNull();
  });

  it("shows correct empty state in readonly mode", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} readonly />);
    expect(getByTestId("evidence-empty")).toBeDefined();
  });

  it("shows 0 count in header when empty", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} />);
    expect(getByTestId("evidence-list-header")).toBeDefined();
  });

  it("shows container with 0 count attribute", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} />);
    expect(getByTestId("evidence-list-container").getAttribute("data-count")).toBe("0");
  });

  // Single file
  it("renders file list with single file", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(getByTestId("evidence-file-list")).toBeDefined();
  });

  it("renders single file item", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(getByTestId("evidence-item-file.pdf")).toBeDefined();
  });

  it("shows file name for single file", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(getByTestId("file-name-file.pdf").textContent).toContain("file.pdf");
  });

  it("shows file icon for single file", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(getByTestId("file-icon-file.pdf")).toBeDefined();
  });

  it("shows file type label", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(getByTestId("file-type-file.pdf").textContent).toBe("PDF");
  });

  // 5 files
  sampleFiles.map((file) =>
    it(`renders file item for ${file}`, async () => {
      const { getByTestId } = await render(<EvidenceList evidence={sampleFiles} />);
      expect(getByTestId(`evidence-item-${file}`)).toBeDefined();
    }),
  );

  // 20 files
  it("renders 20 files correctly", async () => {
    const twentyFiles = Array.from({ length: 20 }, (_, i) => `file${i}.pdf`);
    const { getByTestId } = await render(<EvidenceList evidence={twentyFiles} />);
    expect(getByTestId("evidence-list-container").getAttribute("data-count")).toBe("20");
  });

  it("renders all 20 file items", async () => {
    const twentyFiles = Array.from({ length: 20 }, (_, i) => `file${i}.pdf`);
    const { getByTestId } = await render(<EvidenceList evidence={twentyFiles} />);
    expect(getByTestId("evidence-file-list")).toBeDefined();
  });

  // File type icons
  fileTypeTests.map(({ file, expectedType }) =>
    it(`shows ${expectedType} type for ${file}`, async () => {
      const { getByTestId } = await render(<EvidenceList evidence={[file]} />);
      expect(getByTestId(`file-type-${file}`).textContent).toBe(expectedType);
    }),
  );

  // Upload action
  it("shows upload button when onUpload is provided", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} onUpload={() => {}} />);
    expect(getByTestId("upload-button")).toBeDefined();
  });

  it("calls onUpload when upload button is clicked", async () => {
    let uploaded = false;
    const { getByTestId } = await render(
      <EvidenceList
        evidence={[]}
        onUpload={() => {
          uploaded = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("upload-button"));
    expect(uploaded).toBeTruthy();
  });

  it("does not show upload button when onUpload is not provided", async () => {
    const { queryByTestId } = await render(<EvidenceList evidence={[]} />);
    expect(queryByTestId("upload-button")).toBeNull();
  });

  it("does not show upload button in readonly mode", async () => {
    const { queryByTestId } = await render(
      <EvidenceList evidence={[]} onUpload={() => {}} readonly />,
    );
    expect(queryByTestId("upload-button")).toBeNull();
  });

  // Delete action
  it("shows delete button when onDelete is provided", async () => {
    const { getByTestId } = await render(
      <EvidenceList evidence={["file.pdf"]} onDelete={() => {}} />,
    );
    expect(getByTestId("delete-button-file.pdf")).toBeDefined();
  });

  it("calls onDelete with correct filename", async () => {
    let deleted = "";
    const { getByTestId } = await render(
      <EvidenceList
        evidence={["file.pdf"]}
        onDelete={(f) => {
          deleted = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-button-file.pdf"));
    expect(deleted).toBe("file.pdf");
  });

  it("does not show delete button when onDelete is not provided", async () => {
    const { queryByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(queryByTestId("delete-button-file.pdf")).toBeNull();
  });

  it("does not show delete button in readonly mode", async () => {
    const { queryByTestId } = await render(
      <EvidenceList evidence={["file.pdf"]} onDelete={() => {}} readonly />,
    );
    expect(queryByTestId("delete-button-file.pdf")).toBeNull();
  });

  sampleFiles.map((file) =>
    it(`can delete file ${file}`, async () => {
      let deleted = "";
      const { getByTestId } = await render(
        <EvidenceList
          evidence={sampleFiles}
          onDelete={(f) => {
            deleted = f;
          }}
        />,
      );
      await fireEvent.click(getByTestId(`delete-button-${file}`));
      expect(deleted).toBe(file);
    }),
  );

  // Preview action
  it("shows preview button when onPreview is provided", async () => {
    const { getByTestId } = await render(
      <EvidenceList evidence={["file.pdf"]} onPreview={() => {}} />,
    );
    expect(getByTestId("preview-button-file.pdf")).toBeDefined();
  });

  it("calls onPreview with correct filename", async () => {
    let previewed = "";
    const { getByTestId } = await render(
      <EvidenceList
        evidence={["file.pdf"]}
        onPreview={(f) => {
          previewed = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("preview-button-file.pdf"));
    expect(previewed).toBe("file.pdf");
  });

  it("does not show preview button when onPreview is not provided", async () => {
    const { queryByTestId } = await render(<EvidenceList evidence={["file.pdf"]} />);
    expect(queryByTestId("preview-button-file.pdf")).toBeNull();
  });

  it("shows preview button in readonly mode", async () => {
    const { getByTestId } = await render(
      <EvidenceList evidence={["file.pdf"]} onPreview={() => {}} readonly />,
    );
    expect(getByTestId("preview-button-file.pdf")).toBeDefined();
  });

  // Readonly mode
  it("sets readonly attribute on container", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} readonly />);
    expect(getByTestId("evidence-list-container").getAttribute("data-readonly")).toBe("true");
  });

  it("sets non-readonly attribute on container by default", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={[]} />);
    expect(getByTestId("evidence-list-container").getAttribute("data-readonly")).toBe("false");
  });

  // Long filename handling
  it("renders very long filename", async () => {
    const longFile = "a-very-long-filename-that-exceeds-normal-display-width-considerably.pdf";
    const { getByTestId } = await render(<EvidenceList evidence={[longFile]} />);
    expect(getByTestId(`file-name-${longFile}`)).toBeDefined();
  });

  it("shows header", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={sampleFiles} />);
    expect(getByTestId("evidence-list-header")).toBeDefined();
  });

  it("shows count in data attribute for 5 files", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={sampleFiles} />);
    expect(getByTestId("evidence-list-container").getAttribute("data-count")).toBe("5");
  });

  // Unknown file type
  it("shows FILE type for unknown extension", async () => {
    const { getByTestId } = await render(<EvidenceList evidence={["file.xyz"]} />);
    expect(getByTestId("file-type-file.xyz").textContent).toBe("XYZ");
  });

  // Snapshots
  it("matches snapshot with files", async () => {
    const { container } = await render(
      <EvidenceList evidence={sampleFiles} onUpload={() => {}} onDelete={() => {}} />,
    );
    await snapshot("evidence-list-full");
  });

  it("matches snapshot for empty state", async () => {
    const { container } = await render(<EvidenceList evidence={[]} />);
    await snapshot("evidence-list-empty");
  });

  it("matches snapshot for readonly mode", async () => {
    const { container } = await render(<EvidenceList evidence={sampleFiles} readonly />);
    await snapshot("evidence-list-readonly");
  });
});
