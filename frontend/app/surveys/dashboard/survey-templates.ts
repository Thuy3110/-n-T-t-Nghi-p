import { DashboardSurveyForm, SurveyQuestion } from "@/services/surveys.service";

export type SurveyTemplateId = "program" | "teaching";

export interface SurveyTemplate {
  id: SurveyTemplateId;
  code: string;
  title: string;
  description: string;
  isCdr: boolean;
  audience: string;
  summary: string;
  questionCount: number;
  icon: "program" | "teaching";
  questions: SurveyQuestion[];
}

function question(
  questionText: string,
  type: SurveyQuestion["type"],
  groupNo: number,
  groupTitle: string,
  options: string[] = [],
): SurveyQuestion {
  return {
    questionText,
    type,
    required: true,
    options,
    groupNo,
    groupTitle,
    sortOrder: 0,
  };
}

const programScale = [
  "1|Hoàn toàn không đồng ý",
  "2|Không đồng ý",
  "3|Bình thường / Không ý kiến",
  "4|Đồng ý",
  "5|Hoàn toàn đồng ý",
];
const teachingScale = [
  "1|Hoàn toàn không đồng ý",
  "2|Không đồng ý",
  "3|Đồng ý",
  "4|Hoàn toàn đồng ý",
];

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: "program",
    code: "KS-CTDT",
    title: "Phiếu khảo sát học viên về chương trình đào tạo",
    description:
      "Ý kiến của học viên sắp hoặc vừa tốt nghiệp giúp Nhà trường rà soát, cải tiến chương trình đào tạo và chuẩn đầu ra.",
    isCdr: true,
    audience: "Học viên sắp hoặc vừa tốt nghiệp",
    summary:
      "Thông tin người học, khóa học tự điền và đánh giá mục tiêu, chuẩn đầu ra, cấu trúc chương trình.",
    questionCount: 11,
    icon: "program",
    questions: [
      question("Chuyên ngành", "text", 1, "I. THÔNG TIN ĐỊNH DANH"),
      question("Họ và tên", "text", 1, "I. THÔNG TIN ĐỊNH DANH"),
      question("Khóa học", "text", 1, "I. THÔNG TIN ĐỊNH DANH"),
      question(
        "Mục tiêu chương trình đào tạo (CTĐT) được xác định rõ ràng, cụ thể.",
        "rating",
        2,
        "II. MỤC TIÊU VÀ CHUẨN ĐẦU RA (CĐR)",
        programScale,
      ),
      question(
        "CĐR được công bố công khai và dễ dàng tiếp cận.",
        "rating",
        2,
        "II. MỤC TIÊU VÀ CHUẨN ĐẦU RA (CĐR)",
        programScale,
      ),
      question(
        "Người học đạt được các năng lực cốt lõi sau khi tốt nghiệp.",
        "rating",
        2,
        "II. MỤC TIÊU VÀ CHUẨN ĐẦU RA (CĐR)",
        programScale,
      ),
      question(
        "CTĐT đảm bảo tính tương thích với Khung trình độ Quốc gia.",
        "rating",
        2,
        "II. MỤC TIÊU VÀ CHUẨN ĐẦU RA (CĐR)",
        programScale,
      ),
      question(
        "Cấu trúc CTĐT hợp lý, logic và có tính kế thừa.",
        "rating",
        3,
        "III. CẤU TRÚC VÀ NỘI DUNG CHƯƠNG TRÌNH",
        programScale,
      ),
      question(
        "Nội dung học tập cập nhật, đáp ứng tốt nhu cầu của thị trường lao động.",
        "rating",
        3,
        "III. CẤU TRÚC VÀ NỘI DUNG CHƯƠNG TRÌNH",
        programScale,
      ),
      question(
        "Tỷ lệ giữa lý thuyết và thực hành được phân bố cân đối.",
        "rating",
        3,
        "III. CẤU TRÚC VÀ NỘI DUNG CHƯƠNG TRÌNH",
        programScale,
      ),
      question(
        "Chương trình cho phép người học linh hoạt lựa chọn các học phần tự chọn.",
        "rating",
        3,
        "III. CẤU TRÚC VÀ NỘI DUNG CHƯƠNG TRÌNH",
        programScale,
      ),
    ],
  },
  {
    id: "teaching",
    code: "KS-GIANGDAY",
    title: "Khảo sát sinh viên về công tác giảng dạy của giảng viên",
    description:
      "Ý kiến khách quan của sinh viên giúp giảng viên điều chỉnh phương pháp và nâng cao hiệu quả dạy và học.",
    isCdr: false,
    audience: "Sinh viên đang học học phần",
    summary:
      "Đánh giá công tác chuẩn bị, phương pháp giảng dạy và học liệu phục vụ học tập.",
    questionCount: 7,
    icon: "teaching",
    questions: [
      question(
        "Thông báo mục tiêu và yêu cầu học phần/bài học.",
        "rating",
        1,
        "I. CÔNG TÁC CHUẨN BỊ VÀ PHƯƠNG PHÁP",
        teachingScale,
      ),
      question(
        "Tính linh hoạt của thời khóa biểu.",
        "rating",
        1,
        "I. CÔNG TÁC CHUẨN BỊ VÀ PHƯƠNG PHÁP",
        teachingScale,
      ),
      question(
        "Sự đáp ứng của nội dung đối với Chuẩn đầu ra (CĐR).",
        "rating",
        1,
        "I. CÔNG TÁC CHUẨN BỊ VÀ PHƯƠNG PHÁP",
        teachingScale,
      ),
      question(
        "Thông báo yêu cầu bài học rõ ràng.",
        "rating",
        1,
        "I. CÔNG TÁC CHUẨN BỊ VÀ PHƯƠNG PHÁP",
        teachingScale,
      ),
      question(
        "Phương pháp truyền đạt của giảng viên.",
        "rating",
        1,
        "I. CÔNG TÁC CHUẨN BỊ VÀ PHƯƠNG PHÁP",
        teachingScale,
      ),
      question(
        "Tính chính xác của nội dung giảng dạy.",
        "rating",
        1,
        "I. CÔNG TÁC CHUẨN BỊ VÀ PHƯƠNG PHÁP",
        teachingScale,
      ),
      question(
        "Giới thiệu giáo trình, tài liệu học tập đầy đủ và kịp thời.",
        "rating",
        2,
        "II. HỌC LIỆU PHỤC VỤ GIẢNG DẠY",
        teachingScale,
      ),
    ],
  },
];

export function getSurveyTemplate(id: string | null | undefined) {
  return surveyTemplates.find((template) => template.id === id);
}

export function createTemplateSurvey(template: SurveyTemplate): DashboardSurveyForm {
  return {
    id: 0,
    code: template.code,
    title: template.title,
    description: template.description,
    isCdr: template.isCdr,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  };
}

export function createTemplateQuestions(template: SurveyTemplate) {
  return template.questions.map((item, sortOrder) => ({
    ...item,
    options: [...item.options],
    sortOrder,
  }));
}
