import { GoogleGenAI } from "@google/genai";
import {
  UserInput,
  Subject,
  SchemeOfWork,
  LessonInput,
  LessonPlan,
  FlashcardInput,
  FlashcardSet,
  AssessmentInput,
  Assessment,
  AssessmentType,
} from "../types";
import { getSyllabusForGrade } from "../data/syllabusContext";

/* =========================
   ENV + CLIENT
========================= */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });

/* =========================
   SCHEME OF WORK
========================= */

export const generateSubjectScheme = async (
  input: UserInput,
  subject: Subject
): Promise<SchemeOfWork> => {
  const syllabusContext = getSyllabusForGrade(input.grade, subject);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Generate a Scheme of Work.

Grade: ${input.grade}
Subject: ${subject}
Term: ${input.term}
Year: ${input.year}

Syllabus Context:
${syllabusContext}

Return JSON with:
aims, topicsCovered, crossCuttingIssues, entries
`,
    config: { responseMimeType: "application/json" },
  });

  const data = JSON.parse(response.text || "{}");

  return {
    subject,
    grade: input.grade,
    term: input.term,
    year: input.year,
    teacherName: input.teacherName,
    aims: data.aims || [],
    topicsCovered: data.topicsCovered || [],
    crossCuttingIssues: data.crossCuttingIssues || [],
    entries: data.entries || [],
  };
};

/* =========================
   SINGLE LESSON PLAN
========================= */

export const generateSingleLessonPlan = async (
  input: LessonInput
): Promise<LessonPlan> => {
  const syllabusContext = getSyllabusForGrade(input.grade, input.subject);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Create a daily lesson plan.

Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}

Syllabus Context:
${syllabusContext}

Return JSON with:
subTopic, objectives, materials, assumedKnowledge, lessonSteps, evaluation
`,
    config: { responseMimeType: "application/json" },
  });

  const data = JSON.parse(response.text || "{}");

  return {
    grade: input.grade,
    subject: input.subject,
    topic: input.topic,
    subTopic: data.subTopic || input.topic,
    date: input.date,
    duration: input.duration,
    teacherName: input.teacherName,
    objectives: data.objectives || [],
    materials: data.materials || [],
    assumedKnowledge: data.assumedKnowledge || "",
    lessonSteps: data.lessonSteps || [],
    evaluation: data.evaluation || "",
  };
};

/* =========================
   FLASHCARDS
========================= */

export const generateFlashcards = async (
  input: FlashcardInput
): Promise<FlashcardSet> => {
  const syllabusContext = getSyllabusForGrade(input.grade, input.subject);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Create ${input.count} flashcards.

Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}

Syllabus Context:
${syllabusContext}

Return JSON:
{ "cards": [{ "front": "...", "back": "..." }] }
`,
    config: { responseMimeType: "application/json" },
  });

  const data = JSON.parse(response.text || "{}");

  const cards = Array.isArray(data.cards)
    ? data.cards.map((c: any, i: number) => ({
        id: `card-${i + 1}`,
        front: c.front || "",
        back: c.back || "",
      }))
    : [];

  return {
    topic: input.topic,
    grade: input.grade,
    subject: input.subject,
    cards,
  };
};

/* =========================
   ASSESSMENT / TEST
========================= */

export const generateAssessment = async (
  input: AssessmentInput
): Promise<Assessment> => {
  const syllabusContext = getSyllabusForGrade(input.grade, input.subject);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Create an assessment.

Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}
Type: ${input.type}

Syllabus Context:
${syllabusContext}

Rules:
- MCQ: 4 options
- Structured: short answers
- Composition: essay prompts

Return JSON:
{
  title,
  questions: [
    { id, section, type, question, options?, answer, marks }
  ]
}
`,
    config: { responseMimeType: "application/json" },
  });

  const data = JSON.parse(response.text || "{}");

  const questions = Array.isArray(data.questions) ? data.questions : [];
  const totalMarks = questions.reduce(
    (sum: number, q: any) => sum + (q.marks || 1),
    0
  );

  return {
    title: data.title || `${input.topic} Assessment`,
    grade: input.grade,
    subject: input.subject,
    topic: input.topic,
    questions,
    totalMarks,
  };
};
