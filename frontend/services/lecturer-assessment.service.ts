import api from "./api";

export type LecturerCloAssessment = {
  id: number;
  code: string;
  description: string;
  myRate: number | null;
  averageRate: number | null;
  lecturerCount: number;
  lecturerAssessments: Array<{
    lecturerName: string;
    attainmentRate: number;
    updatedAt: string;
  }>;
};

export type LecturerCourseAssessment = {
  id: number;
  code: string;
  name: string;
  semester: number | null;
  clos: LecturerCloAssessment[];
};

export type MajorLecturerAssessments = {
  major: { id: number; code: string; name: string };
  academicYear: number;
  courses: LecturerCourseAssessment[];
};

export type AttainmentStatus = "Đạt" | "Chưa đạt" | "Chưa có dữ liệu";

export type LecturerProgramReport = {
  academicYear: number;
  threshold: number;
  programs: Array<{
    program: {
      id: number;
      code: string;
      name: string;
      description: string | null;
    };
    academicYear: number;
    evaluation: { threshold: number; status: AttainmentStatus };
    majors: Array<{
      id: number;
      code: string;
      name: string;
      evaluation: {
        averagePloRate: number | null;
        threshold: number;
        status: AttainmentStatus;
      };
      plos: Array<{
        id: number;
        code: string;
        description: string;
        parentId: number | null;
        attainmentRate: number | null;
        status: AttainmentStatus;
      }>;
      cloAssessments: Array<{
        courseId: number;
        courseCode: string;
        courseName: string;
        cloId: number;
        cloCode: string;
        cloDescription: string;
        averageRate: number | null;
        lecturerCount: number;
        lecturerAssessments: Array<{
          lecturerName: string;
          attainmentRate: number;
          updatedAt: string;
        }>;
      }>;
      cloPloAssessments: Array<{
        courseId: number;
        courseCode: string;
        courseName: string;
        cloId: number;
        cloCode: string;
        cloDescription: string;
        averageRate: number | null;
        lecturerCount: number;
        lecturerAssessments: Array<{
          lecturerName: string;
          attainmentRate: number;
          updatedAt: string;
        }>;
        ploCode: string;
        ploAttainmentRate: number | null;
        ploStatus: AttainmentStatus;
        contributionLevel: number;
      }>;
    }>;
  }>;
};

export type SaveLecturerAssessmentPayload = {
  majorId: number;
  academicYear: number;
  assessments: Array<{
    courseId: number;
    cloId: number;
    attainmentRate: number | null;
  }>;
};

export type MyAssignedCourse = {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number | null;
  major: { id: number; code: string; name: string };
  isAssigned: boolean;
  evaluatedCloCount: number;
  totalCloCount: number;
  isEvaluated: boolean;
  clos: Array<{
    id: number;
    code: string;
    description: string;
    myRate: number | null;
    averageRate: number | null;
    lecturerCount: number;
  }>;
};

export type MyCoursesResponse = {
  lecturer: {
    id: number;
    fullName: string;
    role: string;
  };
  academicYear: number;
  hasExplicitAssignments: boolean;
  courses: MyAssignedCourse[];
};

export type SaveCourseAssessmentPayload = {
  courseId: number;
  academicYear: number;
  assessments: Array<{
    courseId?: number;
    cloId: number;
    attainmentRate: number | null;
  }>;
};

export async function getLecturerAssessmentYears() {
  const response = await api.get<number[]>("/assessments/lecturer-clo/years");
  return response.data;
}

export async function getLecturerProgramReport(academicYear: number) {
  const response = await api.get<LecturerProgramReport>(
    "/assessments/lecturer-clo/report",
    { params: { academicYear } },
  );
  return response.data;
}

export async function getMajorLecturerAssessments(
  majorId: number,
  academicYear: number,
) {
  const response = await api.get<MajorLecturerAssessments>(
    "/assessments/lecturer-clo",
    { params: { majorId, academicYear } },
  );
  return response.data;
}

export async function saveLecturerAssessments(
  payload: SaveLecturerAssessmentPayload,
) {
  const response = await api.post<{
    message: string;
    academicYear: number;
    savedCount: number;
  }>("/assessments/lecturer-clo", payload);
  return response.data;
}

export async function getMyAssignedCourses(academicYear: number) {
  const response = await api.get<MyCoursesResponse>(
    "/assessments/lecturer-clo/my-courses",
    { params: { academicYear } },
  );
  return response.data;
}

export async function saveCourseAssessments(
  payload: SaveCourseAssessmentPayload,
) {
  const response = await api.post<{
    message: string;
    courseId: number;
    academicYear: number;
    savedCount: number;
  }>("/assessments/lecturer-clo/course", payload);
  return response.data;
}

export async function getCourseAssignments() {
  const response = await api.get<{
    lecturers: Array<{
      id: number;
      fullName: string;
      username: string;
      role: string;
      courses: Array<{
        id: number;
        code: string;
        name: string;
        major: { code: string; name: string };
      }>;
    }>;
    allCourses: Array<{
      id: number;
      code: string;
      name: string;
      major: { id: number; code: string; name: string };
    }>;
  }>("/assessments/lecturer-clo/assignments");
  return response.data;
}

export async function assignCourses(payload: {
  userId: number;
  courseIds: number[];
}) {
  const response = await api.post<{ message: string }>(
    "/assessments/lecturer-clo/assign",
    payload,
  );
  return response.data;
}
