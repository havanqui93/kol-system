import type { Metadata } from "next";
import { prisma } from "@kol/database";

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const project = await prisma.videoProject.findUnique({
    where: { id: params.id },
    select: { title: true, platform: true, videoType: true, thumbnailUrl: true },
  });

  if (!project) return { title: "Project not found — KOL System" };

  const title = project.title ?? `Video ${params.id.slice(-6)}`;
  const description = `${project.videoType.replace(/_/g, " ")} · ${project.platform} · KOL System`;

  return {
    title: `${title} — KOL System`,
    description,
    openGraph: {
      title,
      description,
      images: project.thumbnailUrl ? [project.thumbnailUrl] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: project.thumbnailUrl ? [project.thumbnailUrl] : [],
    },
  };
}

export default function ProjectDetailLayout({ children }: Props) {
  return <>{children}</>;
}
