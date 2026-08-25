import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { HonorGallery } from "./honor-gallery";

const { openSource, academicHonors } = loadSiteContent();

afterEach(cleanup);

describe("HonorGallery", () => {
  it("renders the open-source influence group with preserved rank wording", () => {
    render(<HonorGallery openSourceHonors={openSource.honors} academicHonors={academicHonors} />);

    const openSourceGroup = screen.getByRole("list", { name: "开源影响力" });
    expect(within(openSourceGroup).getAllByRole("listitem")).toHaveLength(2);
    expect(within(openSourceGroup).getByText("GitHub Trending")).toBeVisible();
    expect(within(openSourceGroup).getByText("#1 Repository of the Day")).toBeVisible();
    expect(within(openSourceGroup).getByText("Daily")).toBeVisible();
    expect(within(openSourceGroup).getByText("Trendshift · Python")).toBeVisible();
    expect(within(openSourceGroup).getByText("#3 Repository of the Week")).toBeVisible();
    expect(within(openSourceGroup).getByText("Weekly")).toBeVisible();
  });

  it("renders the education and competition group with all three academic honors", () => {
    render(<HonorGallery openSourceHonors={openSource.honors} academicHonors={academicHonors} />);

    const academicGroup = screen.getByRole("list", { name: "教育与竞赛" });
    expect(within(academicGroup).getAllByRole("listitem")).toHaveLength(3);
    expect(within(academicGroup).getByText("国家励志奖学金")).toBeVisible();
    expect(within(academicGroup).getAllByText("同济大学")).toHaveLength(2);
    expect(within(academicGroup).getByText("大唐杯上海市二等奖")).toBeVisible();
    expect(within(academicGroup).getByText("“大唐杯”竞赛")).toBeVisible();
    expect(within(academicGroup).getByText("本科专业排名 12/62")).toBeVisible();
    expect(within(academicGroup).getAllByText("本科")).toHaveLength(3);
    academicHonors.forEach((honor) => {
      expect(within(academicGroup).getByText(honor.note)).toBeVisible();
    });
  });

  it("shows the visible note that rankings are public trend records", () => {
    render(<HonorGallery openSourceHonors={openSource.honors} academicHonors={academicHonors} />);

    expect(screen.getByText("排名来自公开趋势记录,非 GitHub 官方奖项。")).toBeVisible();
  });
});