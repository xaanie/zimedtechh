import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  SchemeOfWork,
  LessonPlan,
  FlashcardSet,
  Assessment,
  ExamPaper,
  Subject
} from '../types';

/* ======================================================
   DEFAULT EXPORT — Scheme of Work PDF
   (Fixes App.tsx import)
====================================================== */

const generatePDF = (schemes: SchemeOfWork[]) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  schemes.forEach((scheme, index) => {
    if (index > 0) doc.addPage();

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(
      `${scheme.grade.toUpperCase()} HBC SCHEME-CUM ${scheme.term.toUpperCase()} ${scheme.year}`,
      pageWidth / 2,
      15,
      { align: 'center' }
    );

    doc.setFontSize(12);
    doc.text(
      `${scheme.grade.toUpperCase()} ${scheme.subject.toUpperCase()} ${scheme.term.toUpperCase()} ${scheme.year}`,
      14,
      25
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Teacher: ${scheme.teacherName}`, pageWidth - 14, 25, { align: 'right' });

    let y = 35;

    doc.setFont('helvetica', 'bold');
    doc.text('TOPICS TO BE COVERED:', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    (scheme.topicsCovered?.length ? scheme.topicsCovered : ['As per syllabus'])
      .forEach((t, i) => {
        doc.text(`${i + 1}. ${t}`, 20, y);
        y += 5;
      });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('AIMS:', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    scheme.aims.forEach(a => {
      const lines = doc.splitTextToSize(`• ${a}`, 270);
      doc.text(lines, 20, y);
      y += lines.length * 4;
    });

    y += 5;

    autoTable(doc, {
      startY: y,
      head: [[
        'WEEK',
        'TOPIC / CONTENT',
        'OBJECTIVES',
        'SKILLS',
        'S.O.M',
        'MEDIA',
        'ACTIVITIES',
        'EVALUATION'
      ]],
      body: scheme.entries.map(e => [
        `Week ${e.week}`,
        e.topic,
        e.objectives.join('\n'),
        e.skills.join('\n'),
        e.som,
        e.media,
        e.activities.join('\n'),
        e.evaluation || ''
      ]),
      theme: 'grid',
      styles: { fontSize: 8, lineWidth: 0.1 }
    });
  });

  doc.save(`${schemes[0].grade}_Scheme_${schemes[0].year}.pdf`);
};

export default generatePDF;

/* ======================================================
   NAMED EXPORTS — used by components
====================================================== */

export const generateLessonPDF = (plan: LessonPlan) => {
  const doc = new jsPDF();
  doc.text('Detailed Lesson Plan', 14, 20);
  doc.save(`${plan.subject}_Lesson_${plan.date}.pdf`);
};

export const generateFlashcardsPDF = (set: FlashcardSet) => {
  const doc = new jsPDF();
  doc.text(`Flashcards: ${set.topic}`, 14, 20);
  doc.save(`${set.topic}_Flashcards.pdf`);
};

export const generateAssessmentPDF = (assessment: Assessment) => {
  const doc = new jsPDF();
  doc.text(assessment.title, 14, 20);
  doc.save(`${assessment.topic}_Assessment.pdf`);
};

export const generateExamPDF = (exam: ExamPaper) => {
  const doc = new jsPDF();
  doc.text(`${exam.subject} ${exam.term} Exam`, 14, 20);
  doc.save(`${exam.subject}_Exam.pdf`);
};
