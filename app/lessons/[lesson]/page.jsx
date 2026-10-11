import { notFound } from "next/navigation";
import { lessons } from "../../../lib/data/lessons.js";
import Studio from "../../../components/layout/Studio.jsx";

export default async function LessonPage({ params }) {
  const { lesson } = await params;
  if (!Object.hasOwn(lessons, lesson)) notFound();
  return <Studio lessonId={lesson} />;
}
