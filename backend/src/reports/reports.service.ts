import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSurveyReport() {
    const forms = await this.prisma.surveyForm.findMany({
      orderBy: [{ year: 'desc' }, { id: 'desc' }],
      include: {
        questions: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        responses: { orderBy: { submittedAt: 'desc' } },
      },
    });

    const reports = forms.map((form) => {
      const questionSummaries = form.questions.map((question) => {
        const counts: Record<string, number> = {};
        let numericTotal = 0;
        let numericCount = 0;
        for (const response of form.responses) {
          try {
            const answers = JSON.parse(response.answers) as Record<string, unknown>;
            const value = answers[String(question.id)];
            if (Array.isArray(value)) value.forEach((item) => { counts[String(item)] = (counts[String(item)] || 0) + 1; });
            else if (value !== undefined && value !== null && String(value) !== '') {
              counts[String(value)] = (counts[String(value)] || 0) + 1;
              const number = Number(value);
              if (Number.isFinite(number)) { numericTotal += number; numericCount += 1; }
            }
          } catch { /* Bỏ qua phản hồi JSON cũ không hợp lệ. */ }
        }
        return { id: question.id, questionText: question.questionText, type: question.type, responseCount: Object.values(counts).reduce((sum, count) => sum + count, 0), average: numericCount ? Number((numericTotal / numericCount).toFixed(2)) : null, counts };
      });
      return { id: form.id, code: form.code, year: form.year, title: form.title, enabled: form.enabled, questionCount: form.questions.length, responseCount: form.responses.length, lastSubmittedAt: form.responses[0]?.submittedAt ?? null, questions: questionSummaries };
    });
    return {
      totalForms: reports.length,
      activeForms: reports.filter((form) => form.enabled).length,
      totalResponses: reports.reduce((sum, form) => sum + form.responseCount, 0),
      totalQuestions: reports.reduce((sum, form) => sum + form.questionCount, 0),
      forms: reports,
    };
  }
}
