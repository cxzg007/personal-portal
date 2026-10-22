import type { Metadata } from "next";
import { RetroExperience } from "@/components/playground/retro-experience";

export const metadata: Metadata = {
  title: "个人空间",
  description: "进入江俊杰的复古电脑房间，探索数字桌面、个人项目与互动游戏。了解更多，查看我的经历、项目与技术文章。",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <RetroExperience />;
}
