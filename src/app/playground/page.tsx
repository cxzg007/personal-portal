import type { Metadata } from "next";
import { RetroExperience } from "@/components/playground/retro-experience";

export const metadata: Metadata = {
  title: "交互实验室",
  description: "进入江俊杰的复古电脑房间，探索数字桌面、个人项目与互动游戏。",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return <RetroExperience />;
}
