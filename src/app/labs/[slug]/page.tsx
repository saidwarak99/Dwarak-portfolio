import { notFound } from "next/navigation";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Satisfies build-time prerender validation for dynamic segment.
export async function generateStaticParams() {
  return [{ slug: "_" }];
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;

  // Real build logs will be fetched from database in Phase 5.
  // Any requested slug strictly returns 404 Not Found since no articles are published yet.
  notFound();
}
