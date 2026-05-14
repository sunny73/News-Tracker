import { Metadata } from "next";
import { HotListClient } from "@/components/hot-list-client";

export const metadata: Metadata = {
  title: "热榜聚合 - News Tracker",
  description: "知乎/微博/百度/头条等全网热榜一站式聚合",
};

export default function HomePage() {
  return <HotListClient />;
}
