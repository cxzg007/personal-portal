import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { BrandMark } from "./brand-mark";
import { EngineeringJourney } from "./engineering-journey";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("brand primitives", () => {
  it("renders the brand mark as an image with local source and exact alt text", () => {
    render(<BrandMark asset={{ src: "/brands/jd.png", alt: "京东官方 Logo", theme: "jd" }} />);
    expect(screen.getByRole("img", { name: "京东官方 Logo" })).toHaveAttribute(
      "src",
      expect.stringContaining("jd.png"),
    );
  });

  it("renders the engineering journey as a named list with exactly three steps", () => {
    render(<EngineeringJourney label="京东工程链路" nodes={internships[0].journey} />);
    expect(
      within(screen.getByRole("list", { name: "京东工程链路" })).getAllByRole("listitem"),
    ).toHaveLength(3);
  });
});