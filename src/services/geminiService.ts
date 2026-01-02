import { GoogleGenAI } from "@google/genai";
import {
  UserInput,
  Subject,
  SchemeOfWork,
  LessonInput,
  LessonPlan,
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
   SCHEME OF WORK GENERATOR
========================= */

export const generateSubjectScheme = async (
  input: UserInput,
  subject: Subject
): Promise<SchemeOfWork> => {
  const syllabusContext = getSyllabusForGrade(input.grade, subject);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
You are a Zimbabwean primary school teacher.

Generate a Scheme of Work for:
Grade: ${input.grade}
Subject: ${subject}
Term: ${input.term}
Year: ${input.year}

Syllabus context:
${syllabusContext}

Return STRICT JSON with:
- aims
- topicsCovered
- crossCuttingIssues
- entries
`,
    config: {
      responseMimeType: "application/json",
    },
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
You are a Zimbabwean primary school teacher.

Create a DETAILED daily lesson plan.

Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}
Context: ${input.context || "General"}

Syllabus context:
${syllabusContext}

Return STRICT JSON with:
- subTopic
- objectives (array)
- materials (array)
- assumedKnowledge
- lessonSteps (Introduction, Step 1, Step 2, Step 3, Conclusion)
- evaluation
`,
    config: {
      responseMimeType: "application/json",
    },
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
