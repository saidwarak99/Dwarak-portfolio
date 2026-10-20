import { notFound } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Satisfies build-time prerender validation for dynamic segment.
export async function generateStaticParams() {
  return [{ slug: "_" }];
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  // Real projects will be fetched from database in Phase 2 & 3.
  // Any requested slug strictly returns 404 Not Found since no projects are published yet.
  notFound();
}
