import { Course, Student } from '../types';

/**
 * Quy đổi Điểm hệ 10 sang Thang điểm chữ:
 * - 8.5 - 10.0: A
 * - 7.0 - 8.4:  B
 * - 5.5 - 6.9:  C
 * - 4.0 - 5.4:  D
 * - Dưới 4.0:   F (Nợ môn)
 */
export function convertScale10ToLetter(grade10: number | null | undefined): string {
  if (grade10 === null || grade10 === undefined || isNaN(grade10)) {
    return '-';
  }
  if (grade10 >= 8.5) return 'A';
  if (grade10 >= 7.0) return 'B';
  if (grade10 >= 5.5) return 'C';
  if (grade10 >= 4.0) return 'D';
  return 'F';
}

/**
 * Quy đổi Thang điểm chữ sang Thang điểm 4:
 * - A: 4 (hoặc 4.0)
 * - B: 3 (hoặc 3.0)
 * - C: 2 (hoặc 2.0)
 * - D: 1 (hoặc 1.0)
 * - F: 0 (hoặc 0.0)
 */
export function convertLetterToScale4(letter: string): number | null {
  switch (letter) {
    case 'A':
      return 4;
    case 'B':
      return 3;
    case 'C':
      return 2;
    case 'D':
      return 1;
    case 'F':
      return 0;
    default:
      return null;
  }
}

/**
 * Quy đổi trực tiếp Điểm hệ 10 sang Thang điểm 4:
 * Điểm 10 -> Điểm Chữ -> Điểm 4
 */
export function convertScale10ToScale4(grade10: number | null | undefined): number | null {
  if (grade10 === null || grade10 === undefined || isNaN(grade10)) {
    return null;
  }
  const letter = convertScale10ToLetter(grade10);
  return convertLetterToScale4(letter);
}

export interface StudentCalculatedGPA {
  gpa: number | null; // Điểm TB hệ 10 (giữ tương thích)
  gpa10: number | null; // Điểm TB hệ 10
  gpa4: number | null; // Điểm TB hệ 4: Tổng (Điểm hệ 4 x Tín chỉ) / Tổng tín chỉ
  totalCredits: number;
  gradedCredits: number;
  owedCoursesCount: number;
  owedCourses: Course[];
  totalAbsentPeriods: number;
  classification10: { rank: string; badgeColor: string };
  classification4: { rank: string; badgeColor: string };
}

/**
 * Tính Điểm trung bình các môn theo cả thang điểm 10 và thang điểm 4:
 * - Thang điểm 4: Lấy (Điểm tổng kết theo thang điểm 4 x Tín chỉ) của từng môn rồi cộng tất cả lại, sau đó chia cho Tổng số tín chỉ.
 * - Thang điểm 10: Lấy (Điểm tổng kết theo thang điểm 10 x Tín chỉ) của từng môn rồi cộng tất cả lại, sau đó chia cho Tổng số tín chỉ.
 * Làm tròn 2 chữ số thập phân.
 */
export function calculateStudentGPA(
  student: Student,
  courses: Course[]
): StudentCalculatedGPA {
  let totalScoreWeight10 = 0;
  let totalScoreWeight4 = 0;
  let gradedCredits = 0;
  let totalCredits = 0;
  const owedCourses: Course[] = [];
  let totalAbsentPeriods = 0;

  courses.forEach((course) => {
    totalCredits += course.credits;
    const gradeInfo = student.grades?.[course.id];

    if (gradeInfo) {
      totalAbsentPeriods += gradeInfo.absentPeriods || 0;

      if (gradeInfo.finalGrade !== null && gradeInfo.finalGrade !== undefined && !isNaN(gradeInfo.finalGrade)) {
        const grade10 = gradeInfo.finalGrade;
        const grade4 = convertScale10ToScale4(grade10);

        totalScoreWeight10 += grade10 * course.credits;
        if (grade4 !== null) {
          totalScoreWeight4 += grade4 * course.credits;
        }

        gradedCredits += course.credits;

        // Điểm < 4.0 (Điểm chữ F) được tính là nợ môn
        if (grade10 < 4.0) {
          owedCourses.push(course);
        }
      }
    }
  });

  const gpa10 = gradedCredits > 0 ? Number((totalScoreWeight10 / gradedCredits).toFixed(2)) : null;
  const gpa4 = gradedCredits > 0 ? Number((totalScoreWeight4 / gradedCredits).toFixed(2)) : null;

  return {
    gpa: gpa10, // tương thích các chỗ dùng .gpa
    gpa10,
    gpa4,
    totalCredits: Number(totalCredits.toFixed(1)),
    gradedCredits: Number(gradedCredits.toFixed(1)),
    owedCoursesCount: owedCourses.length,
    owedCourses,
    totalAbsentPeriods,
    classification10: getAcademicClassification(gpa10),
    classification4: getAcademicClassificationScale4(gpa4),
  };
}

/**
 * Xếp loại học lực theo Thang điểm 4 (Quy chế đào tạo đại học theo tín chỉ):
 * - 3.60 - 4.00: Xuất sắc
 * - 3.20 - 3.59: Giỏi
 * - 2.50 - 3.19: Khá
 * - 2.00 - 2.49: Trung bình
 * - 1.00 - 1.99: Yếu
 * - Dưới 1.00:   Kém (Cảnh báo)
 */
export function getAcademicClassificationScale4(gpa4: number | null): {
  rank: string;
  badgeColor: string;
} {
  if (gpa4 === null || gpa4 === undefined) {
    return { rank: 'Chưa xét', badgeColor: 'bg-slate-100 text-slate-700' };
  }
  if (gpa4 >= 3.60) {
    return { rank: 'Xuất sắc', badgeColor: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' };
  }
  if (gpa4 >= 3.20) {
    return { rank: 'Giỏi', badgeColor: 'bg-blue-100 text-blue-800 font-bold border border-blue-300' };
  }
  if (gpa4 >= 2.50) {
    return { rank: 'Khá', badgeColor: 'bg-teal-100 text-teal-800 font-semibold border border-teal-300' };
  }
  if (gpa4 >= 2.00) {
    return { rank: 'Trung bình', badgeColor: 'bg-amber-100 text-amber-800 font-semibold border border-amber-300' };
  }
  if (gpa4 >= 1.00) {
    return { rank: 'Yếu', badgeColor: 'bg-orange-100 text-orange-800 font-semibold border border-orange-300' };
  }
  return { rank: 'Kém (Nợ nhiều)', badgeColor: 'bg-red-200 text-red-900 font-bold border border-red-400' };
}

/**
 * Tính xếp loại học lực dựa trên điểm hệ 10
 */
export function getAcademicClassification(gpa: number | null): {
  rank: string;
  badgeColor: string;
} {
  if (gpa === null || gpa === undefined) {
    return { rank: 'Chưa xét', badgeColor: 'bg-slate-100 text-slate-700' };
  }
  if (gpa >= 9.0) return { rank: 'Xuất sắc', badgeColor: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' };
  if (gpa >= 8.0) return { rank: 'Giỏi', badgeColor: 'bg-blue-100 text-blue-800 font-bold border border-blue-300' };
  if (gpa >= 6.5) return { rank: 'Khá', badgeColor: 'bg-teal-100 text-teal-800 font-semibold border border-teal-300' };
  if (gpa >= 5.0) return { rank: 'Trung bình', badgeColor: 'bg-amber-100 text-amber-800 font-semibold border border-amber-300' };
  if (gpa >= 4.0) return { rank: 'Yếu', badgeColor: 'bg-orange-100 text-orange-800 font-semibold border border-orange-300' };
  return { rank: 'Kém (Nợ nhiều)', badgeColor: 'bg-red-200 text-red-900 font-bold border border-red-400' };
}

/**
 * Lấy nhãn và màu sắc cho loại hình cư trú
 */
export function getResidenceInfo(type: Student['residenceType']): {
  label: string;
  badgeColor: string;
} {
  switch (type) {
    case 'tro':
      return { label: 'Ở trọ', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'ktx':
      return { label: 'Ký túc xá (KTX)', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'nguoi_than':
      return { label: 'Nhà người thân', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'nha_rieng':
    default:
      return { label: 'Nhà riêng / Gia đình', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
}

