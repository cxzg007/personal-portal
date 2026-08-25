import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ProfileInfo } from "./profile-info";

const { profile, about } = loadSiteContent();

afterEach(cleanup);

describe("profile info", () => {
  it("renders every about paragraph", () => {
    render(<ProfileInfo about={about} profile={profile} />);

    about.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeVisible();
    });
  });

  it("renders the seven structured profile facts", () => {
    render(<ProfileInfo about={about} profile={profile} />);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
      "姓名",
      "技术身份",
      "学校",
      "学位",
      "毕业年份",
      "目标角色",
      "技术方向",
    ]);
    expect(screen.getAllByRole("definition").map((definition) => definition.textContent)).toEqual([
      profile.name,
      "cxzg007",
      profile.education[0].school,
      profile.education[0].degree,
      String(profile.education[0].graduationYear),
      profile.targetRole,
      "可靠 AI 应用 / 后端系统",
    ]);
  });
});