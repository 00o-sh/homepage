// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";
import { expectBlockValue } from "test-utils/widget-assertions";

const { useWidgetAPI } = vi.hoisted(() => ({ useWidgetAPI: vi.fn() }));
vi.mock("utils/proxy/use-widget-api", () => ({ default: useWidgetAPI }));

import Component from "./component";

describe("widgets/kopia/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders placeholders when status data is missing or source filter finds nothing", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "kopia", snapshotHost: "nope" } }} />,
      { settings: { hideErrors: false } },
    );

    expect(container.querySelectorAll(".service-block")).toHaveLength(4);
    expect(screen.getByText("kopia.status")).toBeInTheDocument();
    expect(screen.getByText("kopia.size")).toBeInTheDocument();
    expect(screen.getByText("kopia.lastrun")).toBeInTheDocument();
    expect(screen.getByText("kopia.nextrun")).toBeInTheDocument();
  });

  it("renders error UI when widget API errors", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: { message: "nope" } });

    renderWithProviders(<Component service={{ widget: { type: "kopia" } }} />, { settings: { hideErrors: false } });

    expect(screen.getAllByText(/widget\.api_error/i).length).toBeGreaterThan(0);
    expect(screen.getByText("nope")).toBeInTheDocument();
  });

  it("renders filtered snapshot status, size, and relative last/next run times", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        sources: [
          {
            source: { host: "hostA", path: "/data" },
            status: "OK",
            lastSnapshot: {
              startTime: "2019-12-31T22:00:00Z", // 2 hours ago
              stats: { errorCount: 0, totalSize: 1024 },
            },
            nextSnapshotTime: "2020-01-01T00:30:00Z", // 30 minutes ahead
          },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "kopia", snapshotHost: "hostA", snapshotPath: "/data" } }} />,
      { settings: { hideErrors: false } },
    );

    expectBlockValue(container, "kopia.status", "OK");
    expectBlockValue(container, "kopia.size", 1024);
    expectBlockValue(container, "kopia.lastrun", "2 h");
    expectBlockValue(container, "kopia.nextrun", "30 m");
  });

  it("aggregates size, max lastrun, and min nextrun across multiple kopia sources", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        sources: [
          {
            source: { host: "hostA", path: "/data" },
            status: "OK",
            lastSnapshot: {
              startTime: "2019-12-31T22:00:00Z", // 2 hours ago
              stats: { errorCount: 0, totalSize: 1024 },
            },
            nextSnapshotTime: "2020-01-01T02:00:00Z", // 2 hours ahead
          },
          {
            source: { host: "hostB", path: "/data" },
            status: "OK",
            lastSnapshot: {
              startTime: "2019-12-31T22:30:00Z", // 1h30m ago (newer)
              stats: { errorCount: 0, totalSize: 2048 },
            },
            nextSnapshotTime: "2020-01-01T00:30:00Z", // 30 minutes ahead (sooner)
          },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "kopia" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "kopia.status", "2 sources");
    expectBlockValue(container, "kopia.size", 3072);
    expectBlockValue(container, "kopia.lastrun", "1 h");
    expectBlockValue(container, "kopia.nextrun", "30 m");
  });

  it("shows kopia.failed for lastrun when no source has a successful snapshot", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        sources: [
          {
            source: { host: "hostA", path: "/data" },
            status: "FAILED",
            lastSnapshot: {
              startTime: "2019-12-31T22:00:00Z",
              stats: { errorCount: 5, totalSize: 1024 },
            },
            nextSnapshotTime: "2020-01-01T00:30:00Z",
          },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "kopia" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "kopia.lastrun", "kopia.failed");
  });
});
