"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Eye,
  FileText,
  LoaderCircle,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import surveysService, {
  DashboardSurveyForm,
  DashboardSurveyFormInput,
  SurveyQuestion,
} from "@/services/surveys.service";
import {
  createTemplateQuestions,
  createTemplateSurvey,
  getSurveyTemplate,
} from "../../survey-templates";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    if (!error.response) return "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }
  return "Đã xảy ra lỗi khi tải hoặc lưu biểu mẫu khảo sát.";
}

function createQuestion(sortOrder: number): SurveyQuestion {
  return {
    questionText: "",
    type: "single",
    required: true,
    options: ["", "", "", "", "", "", "", "", ""],
    groupNo: 1,
    groupTitle: "",
    sortOrder,
  };
}

function ratingParts(option: string) {
  const separator = option.indexOf("|");
  return separator < 0
    ? { value: option, label: "" }
    : {
        value: option.slice(0, separator),
        label: option.slice(separator + 1),
      };
}

export default function SurveyQuestionEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const surveyId = Number(params.id);
  const [survey, setSurvey] = useState<DashboardSurveyForm | null>(null);
  const [surveyForms, setSurveyForms] = useState<DashboardSurveyForm[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const template = isNew
      ? getSurveyTemplate(
          new URLSearchParams(window.location.search).get("template"),
        )
      : undefined;

    if (!isNew && (!Number.isInteger(surveyId) || surveyId <= 0)) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setError("Đường dẫn phiếu khảo sát không hợp lệ.");
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const questionsRequest = isNew
      ? Promise.resolve<SurveyQuestion[]>([])
      : surveysService.getDashboardQuestions(surveyId);

    Promise.all([surveysService.findDashboardForms(), questionsRequest])
      .then(([forms, savedQuestions]) => {
        if (!active) return;
        setSurveyForms(forms);
        if (isNew) {
          setSurvey(
            template
              ? createTemplateSurvey(template)
              : {
                  id: 0,
                  code: "",
                  title: "",
                  description: "",
                  isCdr: false,
                  enabled: true,
                  createdAt: "",
                  updatedAt: "",
                },
          );
          setQuestions(template ? createTemplateQuestions(template) : []);
          return;
        }
        const selected = forms.find((item) => item.id === surveyId);
        if (!selected) {
          setError("Không tìm thấy mã phiếu trong Dashboard.");
          setSurvey(null);
          return;
        }
        setSurvey(selected);
        setQuestions(savedQuestions);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isNew, surveyId]);

  function updateQuestion(
    index: number,
    patch: Partial<SurveyQuestion>,
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
    setNotice("");
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const options = [...questions[questionIndex].options];
    options[optionIndex] = value;
    updateQuestion(questionIndex, { options });
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= questions.length) return;
    setQuestions((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [
        reordered[destination],
        reordered[index],
      ];
      return reordered.map((question, sortOrder) => ({ ...question, sortOrder }));
    });
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion(current.length)]);
    setNotice("");
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, sortOrder) => ({ ...question, sortOrder })),
    );
    setNotice("");
  }

  async function saveForm() {
    if (!survey) return;
    const missingTextIndex = questions.findIndex(
      (question) => !question.questionText.trim(),
    );
    if (missingTextIndex >= 0) {
      setError(`Vui lòng nhập nội dung cho câu hỏi ${missingTextIndex + 1}.`);
      return;
    }

    const formData: DashboardSurveyFormInput = {
      code: survey.code.trim(),
      title: survey.title.trim(),
      description: survey.description.trim(),
      isCdr: survey.isCdr,
      enabled: survey.enabled,
    };
    if (!formData.code || !formData.title) {
      setError("Vui lòng nhập mã phiếu và tên phiếu.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const questionsToSave = questions.map((question, sortOrder) => ({
      ...question,
      questionText: question.questionText.trim(),
      options:
        question.type === "single" ||
        question.type === "multiple" ||
        question.type === "rating"
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : [],
      groupTitle: question.groupTitle.trim(),
      sortOrder,
    }));

    try {
      const savedSurvey = isNew
        ? await surveysService.createDashboardForm(formData)
        : await surveysService.updateDashboardForm(survey.id, formData);
      const updatedQuestions = await surveysService.saveDashboardQuestions(
        savedSurvey.id,
        questionsToSave,
      );
      const updatedSurvey = savedSurvey;
      setSurvey(updatedSurvey);
      setSurveyForms((current) => [
        updatedSurvey,
        ...current.filter((form) => form.id !== updatedSurvey.id),
      ]);
      setQuestions(updatedQuestions);
      setNotice("Đã lưu biểu mẫu Dashboard và câu hỏi.");
      if (isNew) router.replace(`/surveys/dashboard/forms/${updatedSurvey.id}`);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const previewGroups = questions.reduce<
    Array<{ groupNo: number; title: string; questions: SurveyQuestion[] }>
  >((groups, question) => {
    const group = groups.find((item) => item.groupNo === question.groupNo);
    if (group) {
      group.questions.push(question);
    } else {
      groups.push({
        groupNo: question.groupNo,
        title: question.groupTitle,
        questions: [question],
      });
    }
    return groups;
  }, []);
  const ratingScale =
    questions.find((question) => question.type === "rating")?.options ?? [];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/surveys/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#07508d]"
          >
            <ArrowLeft size={16} />
            Dashboard khảo sát
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/surveys/dashboard/forms/new")}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800"
            >
              <Plus size={15} />
              Tạo mới
            </button>
            <button
              type="button"
              onClick={() => setPreview((value) => !value)}
              disabled={!survey || loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <Eye size={15} />
              {preview ? "Đóng xem trước" : "Xem trước"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!survey || loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07508d] px-3 text-xs font-bold text-white hover:bg-[#064374] disabled:opacity-50"
            >
              <Printer size={15} />
              In phiếu
            </button>
            <button
              type="button"
              onClick={() => void saveForm()}
              disabled={!survey || loading || saving}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Đang lưu..." : "Lưu lại"}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <Check size={16} />
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            <LoaderCircle size={22} className="mx-auto mb-3 animate-spin" />
            Đang tải phiếu khảo sát...
          </div>
        ) : survey ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.35fr)]">
            <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h1 className="font-bold text-slate-800">Danh sách Mã phiếu</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Chọn phiếu để soạn nội dung
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#07508d]">
                  {surveyForms.length} phiếu
                </span>
              </div>
              <div className="space-y-2">
                {surveyForms.map((form) => (
                  <Link
                    key={form.id}
                    href={`/surveys/dashboard/forms/${form.id}`}
                    aria-current={form.id === survey.id ? "page" : undefined}
                    className={`block rounded-xl border p-3 transition ${
                      form.id === survey.id
                        ? "border-blue-100 bg-[#eaf4ff]"
                        : "border-slate-100 bg-white hover:border-blue-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#07508d]">
                          {form.code}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                          {form.title}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-medium text-slate-500">
                        {form.questionCount ?? 0} câu hỏi
                      </span>
                    </div>
                  </Link>
                ))}
                {surveyForms.length === 0 && (
                  <div className="space-y-2" aria-label="Gợi ý mã phiếu">
                    {[
                      "Nhập mã phiếu khảo sát",
                      "Mã phiếu sẽ hiển thị tại đây",
                      "Tạo mới để bắt đầu soạn câu hỏi",
                    ].map((suggestion) => (
                      <div
                        key={suggestion}
                        className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <main className="min-w-0 space-y-4">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#07508d]">
                      {survey.code}
                    </p>
                    <h2 className="mt-1 text-base font-bold text-slate-800">
                      Thông tin phiếu khảo sát
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#07508d]">
                    {questions.length} câu hỏi
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Mã phiếu
                    <input
                      value={survey.code}
                      onChange={(event) =>
                        setSurvey({ ...survey, code: event.target.value })
                      }
                      maxLength={100}
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal normal-case text-slate-700 outline-none focus:border-[#07508d]"
                      placeholder="Nhập mã phiếu..."
                    />
                  </label>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Giải thích phiếu
                    <input
                      value={survey.description}
                      onChange={(event) =>
                        setSurvey({ ...survey, description: event.target.value })
                      }
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal normal-case text-slate-700 outline-none focus:border-[#07508d]"
                      placeholder="Mô tả mục đích khảo sát..."
                    />
                  </label>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Tên phiếu
                    <input
                      value={survey.title}
                      onChange={(event) =>
                        setSurvey({ ...survey, title: event.target.value })
                      }
                      maxLength={255}
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal normal-case text-slate-700 outline-none focus:border-[#07508d]"
                      placeholder="Nhập tên phiếu khảo sát..."
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 self-end rounded-xl bg-[#eaf4ff] px-3 py-2.5 text-xs font-medium text-[#07508d]">
                    Phiếu khảo sát CĐR
                    <input
                      type="checkbox"
                      checked={survey.isCdr}
                      onChange={(event) =>
                        setSurvey({ ...survey, isCdr: event.target.checked })
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>
                </div>
              </section>

              {preview ? (
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
                    <div className="border-b border-slate-100 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#07508d]">
                            {survey.code}
                          </p>
                          <h2 className="mt-2 text-xl font-extrabold leading-7 text-slate-800 sm:text-2xl">
                            {survey.title}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          aria-label="In bản xem trước"
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#07508d] hover:bg-blue-100"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                      {survey.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                          {survey.description}
                        </p>
                      )}
                    </div>

                    {ratingScale.length > 0 && (
                      <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-900">
                          Thang đánh giá
                        </p>
                        <div
                          className={`grid gap-2 sm:grid-cols-2 ${
                            ratingScale.length === 4
                              ? "lg:grid-cols-4"
                              : "lg:grid-cols-5"
                          }`}
                        >
                          {ratingScale.map((option, index) => {
                            const rating = ratingParts(option);
                            return (
                              <div
                                key={`${option}-${index}`}
                                className="flex min-h-12 items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-amber-900"
                              >
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-200 font-bold">
                                  {rating.value}
                                </span>
                                {rating.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-7 space-y-8">
                      {previewGroups.map((group) => (
                        <section
                          key={group.groupNo}
                          className="overflow-hidden rounded-xl border border-slate-200"
                        >
                          {group.title && (
                            <h3 className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold leading-5 text-slate-800 sm:px-5">
                              {group.title}
                            </h3>
                          )}
                          <div className="divide-y divide-slate-100">
                            {group.questions.map((question) => {
                              const questionIndex = questions.indexOf(question);
                              return (
                                <div
                                  key={`${question.sortOrder}-${questionIndex}`}
                                  className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                                >
                                  <p className="text-sm font-medium leading-6 text-slate-800">
                                    <span className="mr-1 text-slate-500">
                                      {questionIndex + 1}.
                                    </span>
                                    {question.questionText}
                                    {question.required && (
                                      <span className="ml-1 text-red-500">*</span>
                                    )}
                                  </p>
                                  {question.type === "text" ? (
                                    <input
                                      disabled
                                      placeholder="Nhập câu trả lời"
                                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm md:w-64"
                                    />
                                  ) : question.type === "rating" ? (
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                      {question.options
                                        .filter(Boolean)
                                        .map((option, optionIndex) => {
                                          const rating = ratingParts(option);
                                          return (
                                            <label
                                              key={`${option}-${optionIndex}`}
                                              className="flex min-w-8 flex-col items-center gap-1 text-xs text-slate-600"
                                            >
                                              <input
                                                type="radio"
                                                name={`preview-${questionIndex}`}
                                                disabled
                                                className="h-5 w-5 accent-[#07508d]"
                                              />
                                              <span>{rating.value}</span>
                                            </label>
                                          );
                                        })}
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                      {question.options
                                        .filter(Boolean)
                                        .map((option, optionIndex) => (
                                          <label
                                            key={`${option}-${optionIndex}`}
                                            className="flex items-center gap-2 text-sm text-slate-600"
                                          >
                                            <input
                                              type={
                                                question.type === "multiple"
                                                  ? "checkbox"
                                                  : "radio"
                                              }
                                              name={`preview-${questionIndex}`}
                                              disabled
                                              className="h-4 w-4 accent-[#07508d]"
                                            />
                                            {option}
                                          </label>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                      {questions.length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                          Chưa có câu hỏi để xem trước.
                        </p>
                      )}
                    </div>
                  </div>
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-8">
                    <span className="text-sm text-slate-500">
                      Bản xem trước · {questions.length} câu hỏi
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreview(false)}
                      className="rounded-lg bg-[#07508d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#064374]"
                    >
                      Quay lại chỉnh sửa
                    </button>
                  </footer>
                </section>
              ) : (
                <>
                  {questions.map((question, index) => (
                    <section
                      key={`${question.id ?? "new"}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3 bg-[#e1edf6] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#07508d] text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            Soạn thảo nội dung câu hỏi
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveQuestion(index, -1)}
                            disabled={index === 0}
                            aria-label="Di chuyển câu hỏi lên"
                            className="rounded p-1.5 text-[#07508d] hover:bg-white disabled:opacity-30"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestion(index, 1)}
                            disabled={index === questions.length - 1}
                            aria-label="Di chuyển câu hỏi xuống"
                            className="rounded p-1.5 text-[#07508d] hover:bg-white disabled:opacity-30"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            aria-label="Xóa câu hỏi"
                            className="rounded p-1.5 text-red-600 hover:bg-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-5 p-4 sm:p-6">
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(170px,0.8fr)]">
                          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            Nội dung câu hỏi
                            <textarea
                              value={question.questionText}
                              onChange={(event) =>
                                updateQuestion(index, {
                                  questionText: event.target.value,
                                })
                              }
                              rows={3}
                              className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#07508d]"
                              placeholder="Nhập câu hỏi khảo sát tại đây..."
                            />
                          </label>
                          <div className="space-y-3">
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Kiểu câu trả lời
                              <select
                                value={question.type}
                                onChange={(event) =>
                                  updateQuestion(index, {
                                    type: event.target
                                      .value as SurveyQuestion["type"],
                                  })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal normal-case text-slate-700 outline-none focus:border-[#07508d]"
                              >
                                <option value="single">
                                  Trắc nghiệm (Một lựa chọn)
                                </option>
                                <option value="multiple">
                                  Trắc nghiệm (Nhiều lựa chọn)
                                </option>
                                <option value="text">Câu trả lời tự do</option>
                                <option value="rating">Đánh giá thang điểm</option>
                              </select>
                            </label>
                            <label className="flex items-center justify-between rounded-lg bg-[#eaf4ff] px-3 py-2 text-xs font-semibold text-[#07508d]">
                              Bắt buộc trả lời
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(event) =>
                                  updateQuestion(index, {
                                    required: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-emerald-600"
                              />
                            </label>
                          </div>
                        </div>

                        {(question.type === "single" ||
                          question.type === "multiple" ||
                          question.type === "rating") && (
                          <fieldset>
                            <legend className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              {question.type === "rating"
                                ? "Các mức đánh giá (tối đa 9)"
                                : "Danh sách phương án trả lời (tối đa 9)"}
                            </legend>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {question.options.map((option, optionIndex) => (
                                <label
                                  key={optionIndex}
                                  className="flex items-center gap-1.5"
                                >
                                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#eaf4ff] text-xs font-bold text-[#07508d]">
                                    {optionIndex + 1}
                                  </span>
                                  <input
                                    value={option}
                                    onChange={(event) =>
                                      updateOption(
                                        index,
                                        optionIndex,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={`Phương án ${optionIndex + 1}...`}
                                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#07508d]"
                                  />
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        )}

                        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[110px_minmax(0,1fr)]">
                          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            STT nhóm
                            <input
                              type="number"
                              min={1}
                              value={question.groupNo}
                              onChange={(event) =>
                                updateQuestion(index, {
                                  groupNo: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                })
                              }
                              className="mt-1.5 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#07508d]"
                            />
                          </label>
                          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            Tên nhóm câu hỏi
                            <input
                              value={question.groupTitle}
                              onChange={(event) =>
                                updateQuestion(index, {
                                  groupTitle: event.target.value,
                                })
                              }
                              placeholder="Nhập tên nhóm..."
                              maxLength={255}
                              className="mt-1.5 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal normal-case text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#07508d]"
                            />
                          </label>
                        </div>
                      </div>
                    </section>
                  ))}

                  {questions.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                      <FileText size={30} className="mx-auto text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        Phiếu này chưa có câu hỏi
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Thêm câu hỏi, sau đó lưu để ghi vào MySQL.
                      </p>
                    </section>
                  )}

                  <div className="flex justify-center pb-3">
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={questions.length >= 100}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-700 shadow-md transition hover:text-emerald-700 disabled:opacity-50"
                    >
                      <Plus size={18} className="text-emerald-700" />
                      Thêm câu hỏi mới
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-600">
              Không thể mở biểu mẫu khảo sát.
            </p>
            <Link
              href="/surveys/dashboard"
              className="mt-3 inline-flex text-sm font-semibold text-[#07508d] hover:underline"
            >
              Quay lại Dashboard
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
