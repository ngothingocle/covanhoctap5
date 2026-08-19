import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ClassGroup, Course, Student } from '../types';
import {
  parseGradesFromFile,
  downloadGradeImportTemplate,
  ParsedGradeRow,
} from '../utils/importUtils';

interface ImportGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classGroup: ClassGroup;
  courses: Course[];
  students: Student[];
  initialCourseId?: string;
  onBulkUpdateGrades: (courseId: string, updates: { studentId: string; grade: number; absentPeriods?: number }[]) => void;
}

export const ImportGradeModal: React.FC<ImportGradeModalProps> = ({
  isOpen,
  onClose,
  classGroup,
  courses,
  students,
  initialCourseId,
  onBulkUpdateGrades,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || (courses[0]?.id || '')
  );
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedGradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  };

  const processFile = async (f: File) => {
    setFile(f);
    setLoading(true);
    setError(null);
    setParsedRows([]);
    setIsSuccess(false);

    try {
      const results = await parseGradesFromFile(f, selectedCourseId, students);
      if (results.length === 0) {
        setError('Không tìm thấy thông tin sinh viên hoặc điểm số hợp lệ trong file!');
      } else {
        setParsedRows(results);
      }
    } catch (err: any) {
      console.error('Error parsing grade file:', err);
      setError(err.message || 'Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra định dạng!');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGrades = () => {
    if (!currentCourse) return;

    const validUpdates = parsedRows
      .filter((r) => r.matchStatus === 'matched' && r.matchedStudent && r.grade !== null)
      .map((r) => ({
        studentId: r.matchedStudent!.id,
        grade: r.grade as number,
        absentPeriods: r.absentPeriods,
      }));

    if (validUpdates.length === 0) {
      setError('Không có sinh viên hợp lệ nào để cập nhật điểm!');
      return;
    }

    onBulkUpdateGrades(currentCourse.id, validUpdates);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const validCount = parsedRows.filter((r) => r.matchStatus === 'matched' && r.grade !== null).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                Nhập Điểm Môn học từ File (Excel / Word / PDF)
              </h3>
              <p className="text-xs text-blue-200">
                Lớp: <span className="font-bold text-white">{classGroup.name}</span> ({classGroup.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Select Course & Template Download */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn môn học cần nhập điểm (*):
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  if (file) {
                    // Re-run parsing if file already chosen
                    processFile(file);
                  }
                }}
                className="w-full md:max-w-md px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName} ({course.credits} TC)
                  </option>
                ))}
              </select>
            </div>

            {currentCourse && (
              <button
                type="button"
                onClick={() => downloadGradeImportTemplate(currentCourse, students)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-xs transition shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Tải Mẫu Excel có sẵn DSSV</span>
              </button>
            )}
          </div>

          {/* Step 2: Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              2. Chọn hoặc kéo thả file bảng điểm (Excel .xlsx/.xls, Word .docx/.doc, PDF .pdf):
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .docx, .doc, .pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-105 transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="p-3 bg-red-100 text-red-700 rounded-xl group-hover:scale-105 transition">
                  <FileCheck2 className="w-6 h-6" />
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Nhấp vào đây để chọn file hoặc kéo thả file vào khung'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hỗ trợ định dạng <b>Excel (.xlsx, .xls, .csv)</b>, <b>Word (.docx, .doc)</b> và <b>PDF (.pdf)</b>
                </p>
              </div>

              {file && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mt-1">
                  <span>Dung lượng: {(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-700">
                Đang đọc và phân tích dữ liệu điểm từ file...
              </span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <b className="block">Lỗi xử lý file:</b>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">
                Cập nhật điểm thành công cho {validCount} sinh viên! Đang lưu vào hệ thống...
              </span>
            </div>
          )}

          {/* Step 3: Parsed Data Preview */}
          {parsedRows.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    3. Kết quả đọc dữ liệu ({parsedRows.length} dòng)
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                    {validCount} hợp lệ
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                      {invalidCount} cần lưu ý
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">STT</th>
                      <th className="py-2.5 px-3">Mã SV</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3 text-center">Điểm đọc được</th>
                      <th className="py-2.5 px-3 text-center">Điểm hiện tại</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedRows.map((row, idx) => {
                      const currentGrade =
                        row.matchedStudent && currentCourse
                          ? row.matchedStudent.grades?.[currentCourse.id]?.finalGrade
                          : undefined;

                      const isOwed = row.grade !== null && row.grade < 4.0;

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition ${
                            row.matchStatus !== 'matched'
                              ? 'bg-amber-50/50'
                              : isOwed
                              ? 'bg-red-50/40'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">
                            {row.studentCode}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {row.fullName || row.matchedStudent?.fullName || 'Chưa rõ'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.grade !== null ? (
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-xs ${
                                  isOwed
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {row.grade.toFixed(1)} {isOwed && '(Nợ môn)'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa có</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500">
                            {currentGrade !== null && currentGrade !== undefined
                              ? currentGrade
                              : '-'}
                          </td>
                          <td className="py-2 px-3">
                            {row.matchStatus === 'matched' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {row.errorMessage || 'Lỗi dữ liệu'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Đóng / Hủy
          </button>

          <button
            type="button"
            disabled={validCount === 0 || loading || isSuccess}
            onClick={handleApplyGrades}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận & Cập nhật Điểm ({validCount} SV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
