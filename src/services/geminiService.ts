import { GoogleGenAI } from "@google/genai";
import {
  UserInput,
  Subject,
  SchemeOfWork,
} from "../types";
import { getSyllabusForGrade } from "../data/syllabusContext";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });

export const generateSubjectScheme = async (
  input: UserInput,
  subject: Subject
): Promise<SchemeOfWork> => {
  const syllabusContext = getSyllabusForGrade(input.grade, subject);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a scheme for ${input.grade} ${subject}`,
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
