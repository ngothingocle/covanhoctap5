import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Calculator,
  Upload,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { ClassGroup, Course, Student } from '../types';
import {
  calculateStudentGPA,
  convertScale10ToLetter,
  convertScale10ToScale4,
  getAcademicClassificationScale4,
  getAcademicClassification,
} from '../utils/calculations';
import { exportClassGradesToExcel } from '../utils/exportUtils';

interface CourseGradeListProps {
  classGroup: ClassGroup;
  courses: Course[];
  students: Student[];
  onAddCourse: (course: Partial<Course>) => void;
  onEditCourse: (courseId: string, updated: Partial<Course>) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateGrade: (studentId: string, courseId: string, finalGrade: number | null) => void;
  onSelectStudentForDossier: (student: Student) => void;
  onOpenImportGradesModal?: (courseId?: string) => void;
}

export const CourseGradeList: React.FC<CourseGradeListProps> = ({
  classGroup,
  courses,
  students,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onUpdateGrade,
  onSelectStudentForDossier,
  onOpenImportGradesModal,
}) => {
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showConversionGuide, setShowConversionGuide] = useState(true);
  const [gradeDisplayMode, setGradeDisplayMode] = useState<'both' | 'scale4' | 'scale10'>('both');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState<number | string>(3.0);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Quick inline edit cell
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    courseId: string;
    value: string;
  } | null>(null);

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    const parsedCredits = typeof credits === 'number' ? credits : parseFloat(String(credits).replace(',', '.')) || 1.0;

    if (editingCourse) {
      onEditCourse(editingCourse.id, {
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        credits: parsedCredits,
      });
      setEditingCourse(null);
    } else {
      onAddCourse({
        id: `c-${Date.now()}`,
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        credits: parsedCredits,
        semester: 'Học kỳ 1',
        academicYear: classGroup.academicYear,
        classId: classGroup.id,
      });
    }

    setCourseCode('');
    setCourseName('');
    setCredits(3.0);
    setShowAddCourseModal(false);
  };

  const handleCellBlur = (studentId: string, courseId: string, val: string) => {
    const trimmed = val.trim().replace(',', '.');
    if (trimmed === '' || isNaN(Number(trimmed))) {
      onUpdateGrade(studentId, courseId, null);
    } else {
      let num = parseFloat(trimmed);
      if (num < 0) num = 0;
      if (num > 10) num = 10;
      onUpdateGrade(studentId, courseId, Number(num.toFixed(1)));
    }
    setEditingCell(null);
  };

  // Class analytics
  const totalCreditsSum = courses
    .reduce((sum, c) => sum + c.credits, 0)
    .toFixed(1)
    .replace(/\.0$/, '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Algorithm Explanation & Scale 4 Rules */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400/20 rounded-xl text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Môn học, Bảng điểm Thang 4 & Quản lý Nợ môn</h2>
              <p className="text-xs text-blue-200">
                Hệ thống tự động quy đổi <b>Thang điểm 10 → Thang điểm chữ (A, B, C, D, F) → Thang điểm 4 (4, 3, 2, 1, 0)</b>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowConversionGuide((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl backdrop-blur-md transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>{showConversionGuide ? 'Ẩn quy chế Thang 4' : 'Xem quy chế Thang 4'}</span>
            {showConversionGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onOpenImportGradesModal && (
            <button
              onClick={() => onOpenImportGradesModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập điểm (Excel/Word/PDF)</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingCourse(null);
              setCourseCode('');
              setCourseName('');
              setCredits(3.0);
              setShowAddCourseModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Môn học mới</span>
          </button>

          <button
            onClick={() => exportClassGradesToExcel(classGroup, students, courses)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Collapsible Conversion Guide Banner */}
      {showConversionGuide && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-xs p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Quy chế Chuyển đổi Thang điểm 10 sang Thang điểm Chữ, Thang điểm 4 & Xếp loại học lực
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              Quy chế đào tạo đại học theo tín chỉ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Table 1: Quy đổi điểm môn */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-blue-900">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                1. Quy đổi Điểm môn học
              </div>
              <table className="w-full text-center border-collapse bg-white rounded-lg overflow-hidden border border-slate-200 text-[11px]">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2 border-r border-slate-200">Thang điểm 10</th>
                    <th className="py-1.5 px-2 border-r border-slate-200">Điểm chữ</th>
                    <th className="py-1.5 px-2 border-r border-slate-200">Thang 4</th>
                    <th className="py-1.5 px-2">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr className="bg-emerald-50/50">
                    <td className="py-1 px-2 border-r border-slate-200 font-bold text-emerald-800">8.5 – 10.0</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-black text-emerald-700">A</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-bold">4.0</td>
                    <td className="py-1 px-2 text-emerald-700 font-semibold">Đạt</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="py-1 px-2 border-r border-slate-200 font-bold text-blue-800">7.0 – 8.4</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-black text-blue-700">B</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-bold">3.0</td>
                    <td className="py-1 px-2 text-blue-700 font-semibold">Đạt</td>
                  </tr>
                  <tr className="bg-teal-50/50">
                    <td className="py-1 px-2 border-r border-slate-200 font-bold text-teal-800">5.5 – 6.9</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-black text-teal-700">C</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-bold">2.0</td>
                    <td className="py-1 px-2 text-teal-700 font-semibold">Đạt</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="py-1 px-2 border-r border-slate-200 font-bold text-amber-800">4.0 – 5.4</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-black text-amber-700">D</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-bold">1.0</td>
                    <td className="py-1 px-2 text-amber-700 font-semibold">Đạt</td>
                  </tr>
                  <tr className="bg-red-50 text-red-700 font-bold">
                    <td className="py-1 px-2 border-r border-slate-200">Dưới 4.0</td>
                    <td className="py-1 px-2 border-r border-slate-200 font-black">F</td>
                    <td className="py-1 px-2 border-r border-slate-200">0.0</td>
                    <td className="py-1 px-2 text-red-600 font-black">NỢ MÔN</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 2: Công thức tính GPA 4 */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                  2. Thuật toán Điểm trung bình (GPA Thang 4)
                </div>
                <div className="p-2.5 bg-white border border-indigo-200 rounded-lg text-indigo-900 leading-relaxed font-medium">
                  <code>GPA Thang 4 = ∑(Điểm hệ 4 x Tín chỉ) / ∑(Tín chỉ)</code>
                </div>
                <p className="text-[11px] text-indigo-800 leading-normal">
                  Điểm tổng kết từng môn được quy đổi sang thang điểm 4 (4, 3, 2, 1, 0), sau đó nhân với số tín chỉ của môn, cộng dồn lại và chia cho tổng số tín chỉ đã học.
                </p>
              </div>
              <div className="p-2 bg-emerald-100/60 border border-emerald-300 rounded-lg text-[11px] text-emerald-900 font-semibold">
                ✓ Hỗ trợ đầy đủ số tín chỉ thập phân (ví dụ: 1.5, 2.5, 3.5 TC)
              </div>
            </div>

            {/* Table 3: Xếp loại học lực theo thang 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-orange-900">
                <span className="w-2 h-2 rounded-full bg-orange-600 inline-block" />
                3. Xếp loại Học lực (Thang điểm 4)
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-emerald-700">3.60 – 4.00</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Xuất sắc</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-blue-700">3.20 – 3.59</span>
                  <span className="font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">Giỏi</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-teal-700">2.50 – 3.19</span>
                  <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">Khá</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-amber-700">2.00 – 2.49</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Trung bình</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-orange-700">1.00 – 1.99</span>
                  <span className="font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">Yếu</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200 text-red-700">
                  <span className="font-bold text-red-700">&lt; 1.00</span>
                  <span className="font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded">Kém (Cảnh báo)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Pill List */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Danh sách Môn học trong học kỳ ({courses.length} môn)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Tổng tín chỉ: <b className="text-blue-700">{totalCreditsSum} TC</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition"
            >
              <div>
                <div className="font-mono text-xs font-bold text-blue-700">
                  {course.courseCode} ({course.credits} TC)
                </div>
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[170px]" title={course.courseName}>
                  {course.courseName}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenImportGradesModal && (
                  <button
                    onClick={() => onOpenImportGradesModal(course.id)}
                    title="Nhập điểm môn này từ file"
                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingCourse(course);
                    setCourseCode(course.courseCode);
                    setCourseName(course.courseName);
                    setCredits(course.credits);
                    setShowAddCourseModal(true);
                  }}
                  title="Sửa môn học"
                  className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteCourse(course.id)}
                  title="Xóa môn học"
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grade Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-900">
              Bảng điểm Tổng kết & Thống kê Nợ môn
            </h3>
            <span className="text-xs text-slate-500">
              (Nhấp vào ô điểm để sửa nhanh)
            </span>
          </div>

          {/* View Mode Selector */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs font-semibold">
              <span className="text-slate-500 px-2 text-[11px] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Hiển thị:
              </span>
              <button
                onClick={() => setGradeDisplayMode('both')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                  gradeDisplayMode === 'both'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hệ 10 & Thang 4 (Đầy đủ)
              </button>
              <button
                onClick={() => setGradeDisplayMode('scale4')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                  gradeDisplayMode === 'scale4'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Thang 4 & Điểm chữ
              </button>
              <button
                onClick={() => setGradeDisplayMode('scale10')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                  gradeDisplayMode === 'scale10'
                    ? 'bg-slate-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Điểm Hệ 10
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
                <span className="text-slate-600 font-medium">Nợ môn (F / &lt;4.0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
                <span className="text-slate-600 font-medium">Đạt (A, B, C, D)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 text-center w-10 sticky left-0 bg-slate-100 z-10">STT</th>
                <th className="py-3 px-3 min-w-[100px] sticky left-10 bg-slate-100 z-10">Mã SV</th>
                <th className="py-3 px-3 min-w-[160px] sticky left-36 bg-slate-100 z-10 border-r border-slate-200">
                  Họ và tên
                </th>
                {courses.map((course) => (
                  <th key={course.id} className="py-3 px-3 text-center min-w-[125px]">
                    <div className="font-bold text-blue-900">{course.courseCode}</div>
                    <div className="text-[10px] text-slate-500 font-semibold truncate max-w-[120px]" title={course.courseName}>
                      {course.courseName}
                    </div>
                    <div className="text-[9px] text-slate-400 font-normal">
                      {course.credits} TC
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[115px] bg-indigo-50 text-indigo-900 border-l border-indigo-100">
                  <div className="font-black">GPA Thang 4</div>
                  <div className="text-[9px] text-indigo-600 font-normal">Hệ 4 (A/B/C/D/F)</div>
                </th>
                <th className="py-3 px-3 text-center min-w-[100px] bg-blue-50/60 text-blue-900">
                  <div className="font-bold">GPA Hệ 10</div>
                  <div className="text-[9px] text-blue-600 font-normal">Thang 10</div>
                </th>
                <th className="py-3 px-3 text-center min-w-[110px] bg-slate-50">
                  Xếp loại (Thang 4)
                </th>
                <th className="py-3 px-3 text-center min-w-[95px] bg-red-50/60 text-red-900">
                  Môn nợ (F)
                </th>
                <th className="py-3 px-3 text-center min-w-[85px]">
                  Tổng vắng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7 + courses.length} className="py-8 text-center text-slate-400">
                    Chưa có sinh viên trong lớp này.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const calc = calculateStudentGPA(student, courses);
                  const classification4 = calc.classification4;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition group">
                      {/* STT */}
                      <td className="py-3 px-3 text-center text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                        {idx + 1}
                      </td>

                      {/* Mã SV */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 sticky left-10 bg-white group-hover:bg-slate-50 z-10">
                        <button
                          onClick={() => onSelectStudentForDossier(student)}
                          className="hover:underline text-left"
                        >
                          {student.studentCode}
                        </button>
                      </td>

                      {/* Họ tên */}
                      <td className="py-3 px-3 font-bold text-slate-900 sticky left-36 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {student.fullName}
                      </td>

                      {/* Grades for each course */}
                      {courses.map((course) => {
                        const gradeInfo = student.grades?.[course.id];
                        const grade = gradeInfo?.finalGrade;
                        const letter = convertScale10ToLetter(grade);
                        const scale4 = convertScale10ToScale4(grade);
                        const isEditing =
                          editingCell?.studentId === student.id &&
                          editingCell?.courseId === course.id;
                        const isOwed = grade !== null && grade !== undefined && grade < 4.0;

                        return (
                          <td
                            key={course.id}
                            className={`py-2 px-2 text-center transition ${
                              isOwed ? 'bg-red-50/70 font-bold text-red-700' : ''
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  autoFocus
                                  value={editingCell.value}
                                  onChange={(e) =>
                                    setEditingCell({
                                      ...editingCell,
                                      value: e.target.value,
                                    })
                                  }
                                  onBlur={() =>
                                    handleCellBlur(
                                      student.id,
                                      course.id,
                                      editingCell.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCellBlur(
                                        student.id,
                                        course.id,
                                        editingCell.value
                                      );
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  className="w-16 px-1.5 py-1 text-center bg-white border-2 border-orange-500 rounded font-bold text-xs focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-400 mt-0.5">Nhập 0 - 10</span>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingCell({
                                    studentId: student.id,
                                    courseId: course.id,
                                    value: grade !== null && grade !== undefined ? String(grade) : '',
                                  })
                                }
                                className={`w-full py-1.5 px-2 rounded-xl hover:ring-1 hover:ring-orange-400 transition cursor-pointer ${
                                  grade !== null && grade !== undefined
                                    ? isOwed
                                      ? 'text-red-700 bg-red-100/80 border border-red-300'
                                      : 'text-slate-900 bg-slate-100/70'
                                    : 'text-slate-300 font-normal hover:bg-slate-100'
                                }`}
                                title="Bấm để sửa điểm (Hệ 10)"
                              >
                                {grade !== null && grade !== undefined ? (
                                  gradeDisplayMode === 'both' ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-extrabold text-xs leading-none">{grade}</span>
                                      <span
                                        className={`mt-1 inline-block px-1.5 py-0.2 text-[10px] rounded font-bold leading-tight ${
                                          isOwed
                                            ? 'bg-red-200 text-red-900'
                                            : letter === 'A'
                                            ? 'bg-emerald-200 text-emerald-900'
                                            : letter === 'B'
                                            ? 'bg-blue-200 text-blue-900'
                                            : letter === 'C'
                                            ? 'bg-teal-200 text-teal-900'
                                            : 'bg-amber-200 text-amber-900'
                                        }`}
                                      >
                                        {letter} ({scale4})
                                      </span>
                                    </div>
                                  ) : gradeDisplayMode === 'scale4' ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-black text-xs text-indigo-900">
                                        {letter} ({scale4})
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-normal">{grade} đ</span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-xs">{grade}</span>
                                  )
                                ) : (
                                  '-'
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* GPA Thang 4 */}
                      <td className="py-3 px-3 text-center bg-indigo-50/40 border-l border-indigo-100">
                        <span className="font-black text-sm text-indigo-700">
                          {calc.gpa4 !== null ? calc.gpa4.toFixed(2) : '-'}
                        </span>
                        {calc.gpa4 !== null && (
                          <div className="text-[9px] text-indigo-500 font-medium">/ 4.0</div>
                        )}
                      </td>

                      {/* GPA Hệ 10 */}
                      <td className="py-3 px-3 text-center bg-blue-50/30">
                        <span className="font-bold text-xs text-blue-800">
                          {calc.gpa10 !== null ? calc.gpa10.toFixed(2) : '-'}
                        </span>
                      </td>

                      {/* Xếp loại Thang 4 */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${classification4.badgeColor}`}>
                          {classification4.rank}
                        </span>
                      </td>

                      {/* Môn nợ */}
                      <td className="py-3 px-3 text-center bg-red-50/40">
                        {calc.owedCoursesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                            <AlertTriangle className="w-3 h-3" />
                            {calc.owedCoursesCount} môn
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold">0</span>
                        )}
                      </td>

                      {/* Tổng vắng */}
                      <td className="py-3 px-3 text-center">
                        {calc.totalAbsentPeriods > 0 ? (
                          <span className="font-bold text-orange-700">
                            {calc.totalAbsentPeriods} tiết
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm">
                {editingCourse ? 'Sửa Môn học' : 'Thêm Môn học mới'}
              </h3>
              <button
                onClick={() => setShowAddCourseModal(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã môn học (*):
                </label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Ví dụ: TIN101, TOAN202..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên môn học (*):
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Ví dụ: Cấu trúc dữ liệu và Giải thuật"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tín chỉ (hỗ trợ số thập phân, ví dụ: 2.5, 3.0, 3.5 TC) (*):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="30"
                  required
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="Ví dụ: 2.5 hoặc 3.0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Số tín chỉ dùng để tính điểm trung bình GPA theo trọng số (hỗ trợ số lẻ thập phân).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Môn học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
