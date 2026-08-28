import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ContactStage } from "./contact-stage";

const { profile } = loadSiteContent();

afterEach(cleanup);

describe("ContactStage", () => {
  it("renders the exact recruiting heading and status", () => {
    render(<ContactStage profile={profile} />);

    expect(
      screen.getByRole("heading", { name: "Build reliable agent systems together." }),
    ).toBeVisible();
    expect(screen.getByText(profile.recruitingStatus)).toBeVisible();
  });

  it("links the email and GitHub profile exactly once each", () => {
    render(<ContactStage profile={profile} />);

    const email = screen.getByRole("link", { name: `发送邮件至 ${profile.email}` });
    expect(email).toHaveAttribute("href", `mailto:${profile.email}`);

    const github = screen.getByRole("link", { name: "GitHub" });
    expect(github).toHaveAttribute("href", profile.github);
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noreferrer");

    expect(screen.queryByRole("link", { name: "下载简历 PDF" })).not.toBeInTheDocument();
  });
});