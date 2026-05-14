import { Metadata } from "next";
import { BriefClient } from "@/components/brief-client";

export const metadata: Metadata = {
  title: "简报追踪 - News Tracker",
  description: "自定义新闻追踪，AI 智能摘要，定时邮件推送",
};

export default function BriefPage() {
  return <BriefClient />;
}
