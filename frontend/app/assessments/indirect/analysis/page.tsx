"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  ChartColumnIncreasing,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Pencil,
  Printer,
  Rocket,
  Save,
  Settings,
  Users,
  History,
  BookOpenCheck,
  TableProperties,
  Percent,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type MajorStat = {
  id: number;
  code: string;
  name: string;
  programName?: string | null;
  schoolYear?: string | number | null;
  studentCount?: number | null;
  courseCount?: number | null;
  assessmentCount?: number | null;
  ploCount?: number | null;
  cloCount?: number | null;
  averagePloRate?: number | null;
  status?: string | null;
};

type AnalysisStats = {
  studentCount: number;
  ploCount: number;
  programCount: number;
  matrixCount: number;
  assessmentCount: number;
  averagePloRate: number;
  averageCloRate: number;
  teacherCount?: number;
  evaluatedCourseCount?: number;
  lastUpdated?: string | null;
  resultDistribution: { achieved: number; notAchieved: number };
  majors: MajorStat[];
};

type AnalysisSettings = {
  ploThreshold: number | "";
  cloThreshold: string;
  enableContribution: boolean;
  enableSelfAssessment: boolean;
  contributionLevels: string[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
const emptySettings: AnalysisSettings = {
  ploThreshold: "",
  cloThreshold: "",
  enableContribution: false,
  enableSelfAssessment: false,
  contributionLevels: [],
};

const styles = `
.analysis-page{min-height:100vh;padding:26px 32px 32px;background:radial-gradient(ellipse at 70% 100%,#e5f8f1 0,transparent 42%),linear-gradient(125deg,#edf5ff 0%,#f8fbfd 54%,#f5fbf8 100%);color:#17212b;font-family:Arial,Helvetica,sans-serif}
.analysis-title-row{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:28px}.analysis-title{font-size:25px;font-weight:700;margin:0 0 7px}.analysis-subtitle{margin:0;color:#596575;font-size:14px}.analysis-actions{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #edf0f4;border-radius:18px;padding:8px 12px;box-shadow:0 2px 5px #17212b08}.analysis-icon-btn{border:0;background:transparent;color:#526174;padding:7px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center}.analysis-icon-btn:hover{background:#edf5ff;color:#165aa7}.analysis-main-grid{display:grid;grid-template-columns:minmax(0,1fr) 304px;gap:24px;align-items:start}.analysis-card{background:#fff;border-radius:21px;box-shadow:0 15px 35px #2a4b6810;overflow:hidden}.analysis-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:24px 25px;background:#f8fbfd}.analysis-card-title{display:flex;align-items:center;gap:12px;font-size:16px;font-weight:700;margin:0}.analysis-blue-icon{display:inline-flex;color:#fff;background:#1762a8;border-radius:4px;padding:3px}.analysis-pills{display:flex;gap:8px}.analysis-pill{font-size:11px;font-weight:700;border-radius:99px;padding:6px 13px;background:#e0edf8;color:#165aa7}.analysis-pill.active{background:#dff3ec;color:#08795f}.analysis-table-wrap{overflow-x:auto}.analysis-table{width:100%;border-collapse:collapse;min-width:620px}.analysis-table thead{background:#f3f8fc}.analysis-table th{font-size:12px;font-weight:500;color:#3e4856;text-align:left;padding:17px 16px}.analysis-table td{font-size:14px;padding:21px 16px;border-bottom:1px solid #f0f3f6;vertical-align:middle}.analysis-table tbody tr:last-child td{border-bottom:0}.analysis-table .num{text-align:center}.analysis-table .code{color:#075da9}.analysis-table .strong{font-weight:700}.analysis-launch{border:0;background:#e8f1fa;color:#1762a8;border-radius:50%;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.analysis-empty{padding:36px 18px!important;text-align:center;color:#7a8594!important}.analysis-settings{padding:0 0 24px}.analysis-settings-head{padding:26px 24px 23px;border-bottom:1px solid #f1f3f6;font-size:12px;font-weight:700;color:#424b59;letter-spacing:.15px}.analysis-field{padding:23px 23px 0}.analysis-label{display:block;font-size:11px;font-weight:700;color:#343e4d;margin-bottom:9px}.analysis-input{width:100%;height:47px;box-sizing:border-box;border:1px solid #e1eaf3;border-radius:13px;background:#eaf4ff;padding:0 16px;font-size:14px;color:#17212b;outline:none}.analysis-input:focus{border-color:#77aee4;box-shadow:0 0 0 3px #dceeff}.analysis-input-icon{position:relative}.analysis-input-icon input{padding-right:45px}.analysis-input-icon svg{position:absolute;right:14px;top:14px;color:#8bb6e3}.analysis-toggle-row{margin:31px 23px 0;background:#f1f8fd;border-radius:16px;padding:18px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}.analysis-toggle-title{font-size:13px;font-weight:700;margin:0 0 5px}.analysis-toggle-help{font-size:10px;color:#667386;margin:0}.analysis-switch{width:43px;height:24px;flex-shrink:0;border:0;border-radius:20px;padding:3px;background:#aeb9c7;cursor:pointer;transition:background .15s}.analysis-switch:after{content:"";display:block;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .15s}.analysis-switch.on{background:#18a47a}.analysis-switch.on:after{transform:translateX(19px)}.analysis-levels{padding:34px 23px 0}.analysis-levels-title{font-size:11px;font-weight:700;color:#343e4d;margin:0 0 13px}.analysis-level-pills{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.analysis-level{border:1px solid;border-radius:12px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;background:#fff}.analysis-level.i{color:#075da9;border-color:#b5d2f1;background:#edf5ff}.analysis-level.r{color:#08795f;border-color:#a9e5d2;background:#e1faf1}.analysis-level.m{color:#9a260b;border-color:#f2c5b8;background:#fff2ee}.analysis-level.off{opacity:.42;filter:grayscale(.5)}.analysis-save{display:flex;align-items:center;justify-content:center;gap:10px;width:calc(100% - 46px);margin:48px 23px 0;border:0;border-radius:12px;background:#1762a8;color:#fff;font-size:14px;font-weight:700;padding:17px 12px;box-shadow:0 10px 18px #1762a833;cursor:pointer}.analysis-save:disabled{opacity:.65;cursor:wait}.analysis-message{margin:12px 23px 0;font-size:12px;line-height:1.45}.analysis-message.error{color:#b42318}.analysis-message.success{color:#08795f}.analysis-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:34px}.analysis-kpi{display:flex;align-items:center;gap:16px;background:#e8f4ff;border-radius:21px;padding:22px 20px;min-height:88px;box-sizing:border-box}.analysis-kpi-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:17px;color:#075da9;flex-shrink:0}.analysis-kpi-icon.green{color:#08795f}.analysis-kpi-icon.orange{color:#a52b0b}.analysis-kpi-label{font-size:10px;color:#46515f;margin-bottom:6px;text-transform:uppercase}.analysis-kpi-value{font-size:21px;font-weight:700;line-height:1.15}.analysis-loading,.analysis-error{padding:20px;background:#fff;border-radius:12px;color:#667386;margin-bottom:18px}.analysis-error{color:#b42318}.analysis-refreshing{font-size:12px;color:#64748b;margin-top:8px}
@media(max-width:1100px){.analysis-page{padding:22px}.analysis-main-grid{grid-template-columns:minmax(0,1fr) 290px;gap:16px}.analysis-kpis{gap:14px}.analysis-kpi{padding:17px 14px}}
@media(max-width:850px){.analysis-main-grid{grid-template-columns:1fr}.analysis-settings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.analysis-settings-head{grid-column:1/-1}.analysis-save{margin-top:24px}.analysis-levels{padding-top:24px}.analysis-toggle-row{margin-top:24px}}
@media(max-width:600px){.analysis-page{padding:18px 12px}.analysis-title-row{align-items:flex-start;flex-direction:column}.analysis-title{font-size:22px}.analysis-settings{display:block}.analysis-kpis{grid-template-columns:1fr;gap:12px}.analysis-kpi{min-height:76px}.analysis-card-head{padding:18px}.analysis-table th,.analysis-table td{padding:15px 12px}}
`;

export default function AnalysisPage() {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [settings, setSettings] = useState<AnalysisSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settingsAvailable, setSettingsAvailable] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/statistics/analysis`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Không thể tải dữ liệu phân tích (HTTP ${response.status}).`);
      const data = (await response.json()) as AnalysisStats;
      setStats({
        ...data,
        majors: Array.isArray(data.majors) ? data.majors : [],
        resultDistribution: data.resultDistribution ?? { achieved: 0, notAchieved: 0 },
      });

      // Thiết lập được lấy từ API nếu backend đã triển khai endpoint này.
      const settingsResponse = await fetch(`${API_BASE}/statistics/analysis-settings`, { cache: "no-store" });
      if (settingsResponse.ok) {
        const saved = await settingsResponse.json();
        setSettings({ ...emptySettings, ...saved });
        setSettingsAvailable(true);
      } else {
        setSettingsAvailable(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const majors = useMemo(() => stats?.majors ?? [], [stats]);
  const teacherCount = stats?.teacherCount;
  const evaluatedCourseCount = stats?.evaluatedCourseCount;
  const lastUpdated = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "—";

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/statistics/analysis-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error(response.status === 404
        ? "Backend chưa có API lưu thiết lập. Cần bổ sung endpoint và bảng cấu hình trong MySQL."
        : `Không lưu được thiết lập (HTTP ${response.status}).`);
      const saved = await response.json().catch(() => settings);
      setSettings({ ...settings, ...saved });
      setSettingsAvailable(true);
      setMessage("Đã lưu thiết lập thành công.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không thể lưu thiết lập.");
    } finally {
      setSaving(false);
    }
  }

  function toggleLevel(level: string) {
    setSettings(current => ({
      ...current,
      contributionLevels: current.contributionLevels.includes(level)
        ? current.contributionLevels.filter(item => item !== level)
        : [...current.contributionLevels, level],
    }));
  }

  const achieved = stats?.resultDistribution.achieved ?? 0;
  const notAchieved = stats?.resultDistribution.notAchieved ?? 0;
  const total = achieved + notAchieved;
  const achievedPercent = total ? Math.round((achieved / total) * 100) : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="analysis-page">
        <header className="analysis-title-row">
          <div>
            <h1 className="analysis-title">Phân tích - Đánh giá</h1>
            <p className="analysis-subtitle">Hệ thống quản lý chất lượng đào tạo và đánh giá chuẩn đầu ra chuyên sâu.</p>
          </div>
          <div className="analysis-actions" aria-label="Thao tác trang">
            <Link
              href="/assessments/indirect/results"
              className="analysis-icon-btn"
              style={{ gap: 7, padding: "8px 12px", color: "#165aa7", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              <Users size={16} />
              Kết quả đánh giá SV
            </Link>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", padding: "0 7px" }}>KẾT QUẢ XỬ LÝ</span>
            <button className="analysis-icon-btn" title="In trang" onClick={() => window.print()}><Printer size={18} /></button>
            <button className="analysis-icon-btn" title="Làm mới dữ liệu" onClick={() => void loadData(true)} disabled={refreshing}><ChartColumnIncreasing size={18} /></button>
            <button className="analysis-icon-btn" title="Chỉnh sửa thông số" onClick={() => document.getElementById("analysis-settings")?.scrollIntoView({ behavior: "smooth", block: "start" })}><Pencil size={18} /></button>
          </div>
        </header>

        {loading && <div className="analysis-loading">Đang tải dữ liệu từ hệ thống...</div>}
        {error && <div className="analysis-error" role="alert">{error} <button onClick={() => void loadData(true)} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: 0, cursor: "pointer" }}>Thử lại</button></div>}
        {refreshing && <p className="analysis-refreshing"><RefreshCw size={12} style={{ display: "inline", marginRight: 5 }} />Đang cập nhật dữ liệu...</p>}

        <div className="analysis-main-grid">
          <section className="analysis-card" aria-labelledby="major-list-title">
            <div className="analysis-card-head">
              <h2 id="major-list-title" className="analysis-card-title"><span className="analysis-blue-icon"><TableProperties size={17} /></span>Danh sách ngành đào tạo</h2>
              <div className="analysis-pills"><span className="analysis-pill">{majors.length ? [...new Set(majors.map(m => String(m.schoolYear ?? "")))].filter(Boolean).join(", ") || "—" : "—"}</span><span className="analysis-pill active">{error ? "Offline" : "Active"}</span></div>
            </div>
            <div className="analysis-table-wrap">
              <table className="analysis-table">
                <thead><tr><th>KHOA</th><th>MÃ NGÀNH</th><th>TÊN NGÀNH</th><th className="num">SLMH</th><th className="num" style={{ color: "#075da9" }}>PLO</th><th className="num" style={{ color: "#08795f" }}>CLO</th><th className="num">TOOL</th></tr></thead>
                <tbody>
                  {majors.map((item) => <tr key={item.id}>
                    <td>{item.programName || "—"}</td>
                    <td className="code">{item.code || "—"}</td>
                    <td style={{ maxWidth: 180, fontWeight: 500 }}>{item.name || "—"}</td>
                    <td className="num">{item.courseCount ?? "—"}</td>
                    <td className="num strong">{item.ploCount ?? "—"}</td>
                    <td className="num strong">{item.cloCount ?? "—"}</td>
                    <td className="num"><button className="analysis-launch" title={`Xem phân tích ngành ${item.name}`} onClick={() => window.dispatchEvent(new CustomEvent("analysis:major-selected", { detail: item }))}><Rocket size={16} /></button></td>
                  </tr>)}
                  {!loading && majors.length === 0 && <tr><td colSpan={7} className="analysis-empty">{error ? "Không thể tải danh sách ngành. Hãy kiểm tra Backend/API." : "Chưa có ngành đào tạo trong cơ sở dữ liệu."}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside id="analysis-settings" className="analysis-card analysis-settings">
            <div className="analysis-settings-head">THÔNG SỐ PHÂN TÍCH - ĐÁNH GIÁ</div>
            <div className="analysis-field"><label className="analysis-label" htmlFor="plo-threshold">MỨC ĐẠT PLO (%)</label><div className="analysis-input-icon"><input id="plo-threshold" className="analysis-input" type="number" min={0} max={100} value={settings.ploThreshold} onChange={e => setSettings(s => ({ ...s, ploThreshold: e.target.value === "" ? "" : Math.max(0, Math.min(100, Number(e.target.value))) }))} /><Percent size={22} /></div></div>
            <div className="analysis-field"><label className="analysis-label" htmlFor="clo-threshold">MỨC ĐẠT CLO (điểm)</label><div className="analysis-input-icon"><input id="clo-threshold" className="analysis-input" value={settings.cloThreshold} onChange={e => setSettings(s => ({ ...s, cloThreshold: e.target.value }))} /><Star size={21} /></div></div>
            <div className="analysis-toggle-row"><div><p className="analysis-toggle-title">TĐG: SV TĐG CLO</p><p className="analysis-toggle-help">Kích hoạt chế độ tự đánh giá</p></div><button type="button" role="switch" aria-checked={settings.enableSelfAssessment} className={`analysis-switch ${settings.enableSelfAssessment ? "on" : ""}`} onClick={() => setSettings(s => ({ ...s, enableSelfAssessment: !s.enableSelfAssessment }))} aria-label="Bật/tắt tự đánh giá CLO" /></div>
            <div className="analysis-levels"><p className="analysis-levels-title">MỨC ĐÓNG GÓP CLO/PLO (I, R, M)</p><div className="analysis-level-pills">
              <button type="button" className={`analysis-level i ${settings.contributionLevels.includes("I") ? "" : "off"}`} onClick={() => toggleLevel("I")}>● &nbsp;I (Introduced)</button>
              <button type="button" className={`analysis-level r ${settings.contributionLevels.includes("R") ? "" : "off"}`} onClick={() => toggleLevel("R")}>● &nbsp;R (Reinforced)</button>
              <button type="button" className={`analysis-level m ${settings.contributionLevels.includes("M") ? "" : "off"}`} onClick={() => toggleLevel("M")}>● &nbsp;M (Mastered)</button>
            </div></div>
            <button className="analysis-save" onClick={() => void saveSettings()} disabled={saving}><Save size={19} />{saving ? "Đang lưu..." : "Lưu thiết lập"}</button>
            {message && <p className={`analysis-message ${message.includes("thành công") ? "success" : "error"}`} role="status">{message}</p>}
            {!settingsAvailable && !loading && !error && <p className="analysis-message" style={{ color: "#7b8492" }}>Thiết lập sẽ được đồng bộ với MySQL khi Backend có API cấu hình.</p>}
          </aside>
        </div>

        <section className="analysis-kpis" aria-label="Thống kê tổng quan">
          <div className="analysis-kpi"><div className="analysis-kpi-icon"><Users size={23} /></div><div><div className="analysis-kpi-label">Giảng viên tham gia</div><div className="analysis-kpi-value">{teacherCount == null ? "—" : teacherCount.toLocaleString("vi-VN")}</div></div></div>
          <div className="analysis-kpi"><div className="analysis-kpi-icon green"><BookOpenCheck size={23} /></div><div><div className="analysis-kpi-label">Học phần đã đánh giá</div><div className="analysis-kpi-value">{evaluatedCourseCount == null ? (stats?.assessmentCount == null ? "—" : stats.assessmentCount.toLocaleString("vi-VN")) : `${evaluatedCourseCount.toLocaleString("vi-VN")}`}</div></div></div>
          <div className="analysis-kpi"><div className="analysis-kpi-icon orange"><History size={23} /></div><div><div className="analysis-kpi-label">Cập nhật lần cuối</div><div className="analysis-kpi-value">{lastUpdated}</div></div></div>
        </section>
      </div>
    </>
  );
}
