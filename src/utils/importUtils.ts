import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Student, Gender, ResidenceType, Course } from '../types';

// Configure pdfjs worker if available in browser
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization warning:', e);
}

export interface ParsedStudentRow {
  studentCode: string;
  fullName: string;
  birthYear: string;
  gender: Gender;
  ethnicity: string;
  permanentAddress: string;
  studentPhone: string;
  relativePhone: string;
  residenceType: ResidenceType;
  boardingAddress?: string;
  landlordPhone?: string;
  dormRoom?: string;
  relativeAddress?: string;
  isClassOfficer: boolean;
  officerPosition?: string;
}

export interface ParsedGradeRow {
  studentCode: string;
  fullName?: string;
  grade: number | null;
  absentPeriods?: number;
  matchedStudent?: Student;
  matchStatus: 'matched' | 'not_found' | 'invalid_grade';
  errorMessage?: string;
}

/**
 * Tạo và tải xuống file mẫu Excel để Cố vấn học tập nhập danh sách sinh viên
 */
export function downloadStudentImportTemplate() {
  const headers = [
    'Mã Sinh Viên (*)',
    'Họ Và Tên (*)',
    'Giới Tính (Nam/Nữ)',
    'Năm Sinh',
    'Dân Tộc',
    'Địa Chỉ Thường Trú',
    'Số Điện Thoại SV',
    'SĐT Người Thân',
    'Hình Thức Cư Trú (Ở trọ / KTX / Nhà người thân / Nhà riêng)',
    'Địa Chỉ Nhà Trọ (nếu ở trọ)',
    'SĐT Chủ Trọ (nếu ở trọ)',
    'Số Phòng KTX (nếu ở KTX)',
    'Địa Chỉ Nhà Người Thân (nếu ở nhà người thân)',
    'Cán Bộ Lớp? (Có / Không)',
    'Chức Vụ Cán Bộ (Lớp trưởng / Lớp phó / Bí thư)',
  ];

  const sampleRows = [
    [
      'SV220199',
      'Lê Thị Thu Cúc',
      'Nữ',
      '2004',
      'Kinh',
      'Số 56 Trần Hưng Đạo, P. An Phú, Ninh Kiều, Cần Thơ',
      '0949112233',
      '0913998877 (Bố Lê Văn An)',
      'Ở trọ',
      'Hẻm 12 Đường 30/4, Xuân Khánh',
      '0988776655 (Bác Bảy)',
      '',
      '',
      'Có',
      'Lớp phó Đời sống',
    ],
    [
      'SV220200',
      'Trần Minh Đức',
      'Nam',
      '2004',
      'Kinh',
      'Ấp Bình Thạnh, Huyện Châu Thành, Bến Tre',
      '0938445566',
      '0908112233 (Mẹ Nguyễn Thị Mai)',
      'KTX',
      '',
      '',
      'Phòng A3-205',
      '',
      'Không',
      '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    ['MẪU NHẬP DANH SÁCH SINH VIÊN - CỐ VẤN HỌC TẬP NGỌC LÊ'],
    ['Lưu ý: Các cột có dấu (*) là bắt buộc. Cán bộ lớp ghi "Có" để được cấp quyền đăng nhập.'],
    [],
    headers,
    ...sampleRows,
  ]);

  ws['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
    { wch: 16 },
    { wch: 25 },
    { wch: 22 },
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 16 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_SV');
  XLSX.writeFile(wb, 'Mau_Nhap_Danh_Sach_Sinh_Vien.xlsx');
}

/**
 * Tạo và tải xuống file Excel mẫu nhập điểm theo môn học (có điền sẵn danh sách sinh viên của lớp)
 */
export function downloadGradeImportTemplate(course: Course, students: Student[]) {
  const headers = [
    'STT',
    'Mã Sinh Viên (*)',
    'Họ Và Tên',
    `Điểm Tổng Kết (${course.courseCode}) (*)`,
    'Số Tiết Vắng',
    'Ghi Chú',
  ];

  const studentRows = students.map((st, index) => {
    const currentGrade = st.grades?.[course.id]?.finalGrade;
    const currentAbsent = st.grades?.[course.id]?.absentPeriods || 0;
    return [
      index + 1,
      st.studentCode,
      st.fullName,
      currentGrade !== null && currentGrade !== undefined ? currentGrade : '',
      currentAbsent || 0,
      '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`BẢNG ĐIỂM MÔN HỌC: ${course.courseName.toUpperCase()} (${course.courseCode} - ${course.credits} TÍN CHỈ)`],
    ['Hướng dẫn: Nhập điểm thang 10 (từ 0.0 đến 10.0, dùng dấu chấm hoặc phẩy cho số thập phân). Điểm < 4.0 là nợ môn.'],
    [],
    headers,
    ...studentRows,
  ]);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nhap_Diem_Mon_Hoc');
  XLSX.writeFile(wb, `Mau_Nhap_Diem_${course.courseCode}_${course.courseName.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Đọc file Excel / CSV và chuyển thành danh sách sinh viên
 */
export async function parseFileToStudents(file: File): Promise<ParsedStudentRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rows.length === 0) {
    throw new Error('File trống, vui lòng chọn file có dữ liệu.');
  }

  // Tìm dòng tiêu đề (header row)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (
      row &&
      row.some(
        (cell: any) =>
          typeof cell === 'string' &&
          (cell.toLowerCase().includes('mã sv') ||
            cell.toLowerCase().includes('mã sinh viên') ||
            cell.toLowerCase().includes('họ và tên') ||
            cell.toLowerCase().includes('họ tên') ||
            cell.toLowerCase().includes('student code'))
      )
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headers: string[] = (rows[headerRowIndex] || []).map((h: any) =>
    String(h || '').trim().toLowerCase()
  );

  const findCol = (keywords: string[]) => {
    return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const codeIdx = findCol(['mã sv', 'mã sinh viên', 'masv', 'mssv', 'mã']);
  const nameIdx = findCol(['họ và tên', 'họ tên', 'tên', 'hoten', 'fullname']);
  const genderIdx = findCol(['giới tính', 'gioitinh', 'phái', 'gender']);
  const birthIdx = findCol(['năm sinh', 'ngày sinh', 'namsinh', 'ngaysinh', 'ns', 'dob']);
  const ethnicityIdx = findCol(['dân tộc', 'dantoc', 'ethnic']);
  const addrIdx = findCol(['thường trú', 'địa chỉ', 'diachi', 'hộ khẩu', 'quê quán']);
  const phoneIdx = findCol(['sđt sv', 'sđt sinh viên', 'điện thoại sv', 'sdt sv', 'phone']);
  const relPhoneIdx = findCol(['người thân', 'phụ huynh', 'cha mẹ', 'bố mẹ', 'sđt ph', 'sdt ph']);
  const resIdx = findCol(['cư trú', 'ở trọ', 'chỗ ở', 'hình thức']);
  const boardAddrIdx = findCol(['nhà trọ', 'địa chỉ trọ']);
  const landlordIdx = findCol(['chủ trọ', 'sđt trọ', 'sdt chu tro']);
  const dormIdx = findCol(['ktx', 'ký túc', 'phòng ktx']);
  const relAddrIdx = findCol(['nhà người thân', 'ở nhờ']);
  const officerIdx = findCol(['cán bộ', 'ban cán sự', 'lớp trưởng', 'chức vụ']);

  const parsedStudents: ParsedStudentRow[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const studentCode = codeIdx >= 0 && r[codeIdx] ? String(r[codeIdx]).trim() : '';
    const fullName = nameIdx >= 0 && r[nameIdx] ? String(r[nameIdx]).trim() : '';

    if (!studentCode && !fullName) continue;

    const rawGender = genderIdx >= 0 && r[genderIdx] ? String(r[genderIdx]).trim().toLowerCase() : '';
    const gender: Gender = rawGender.includes('nữ') || rawGender === 'f' ? 'Nữ' : 'Nam';

    const rawRes = resIdx >= 0 && r[resIdx] ? String(r[resIdx]).trim().toLowerCase() : '';
    let residenceType: ResidenceType = 'tro';
    if (rawRes.includes('ktx') || rawRes.includes('ký túc')) {
      residenceType = 'ktx';
    } else if (rawRes.includes('người thân') || rawRes.includes('ở nhờ')) {
      residenceType = 'nguoi_than';
    } else if (rawRes.includes('nhà riêng') || rawRes.includes('gia đình')) {
      residenceType = 'nha_rieng';
    }

    const rawOfficer = officerIdx >= 0 && r[officerIdx] ? String(r[officerIdx]).trim() : '';
    const isOfficer =
      rawOfficer.toLowerCase().includes('có') ||
      rawOfficer.toLowerCase().includes('yes') ||
      rawOfficer.toLowerCase().includes('trưởng') ||
      rawOfficer.toLowerCase().includes('phó') ||
      rawOfficer.toLowerCase().includes('bí thư');

    parsedStudents.push({
      studentCode: studentCode || `SV${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: fullName || 'Chưa rõ họ tên',
      birthYear: birthIdx >= 0 && r[birthIdx] ? String(r[birthIdx]).trim() : '2004',
      gender,
      ethnicity: ethnicityIdx >= 0 && r[ethnicityIdx] ? String(r[ethnicityIdx]).trim() : 'Kinh',
      permanentAddress: addrIdx >= 0 && r[addrIdx] ? String(r[addrIdx]).trim() : 'Chưa cập nhật',
      studentPhone: phoneIdx >= 0 && r[phoneIdx] ? String(r[phoneIdx]).trim() : '',
      relativePhone: relPhoneIdx >= 0 && r[relPhoneIdx] ? String(r[relPhoneIdx]).trim() : '',
      residenceType,
      boardingAddress: boardAddrIdx >= 0 && r[boardAddrIdx] ? String(r[boardAddrIdx]).trim() : '',
      landlordPhone: landlordIdx >= 0 && r[landlordIdx] ? String(r[landlordIdx]).trim() : '',
      dormRoom: dormIdx >= 0 && r[dormIdx] ? String(r[dormIdx]).trim() : '',
      relativeAddress: relAddrIdx >= 0 && r[relAddrIdx] ? String(r[relAddrIdx]).trim() : '',
      isClassOfficer: isOfficer,
      officerPosition: isOfficer ? rawOfficer || 'Cán bộ lớp' : undefined,
    });
  }

  return parsedStudents;
}

/**
 * Chuẩn hóa số điểm (ví dụ: "8.5", "8,5", "9", 8.5) thành số float [0, 10]
 */
function normalizeGradeValue(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  if (num < 0) return 0;
  if (num > 10) return 10;
  return Number(num.toFixed(1));
}

/**
 * Đọc điểm từ file Excel (.xlsx, .xls, .csv)
 */
async function parseGradesFromExcel(file: File, students: Student[]): Promise<ParsedGradeRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rows.length === 0) {
    throw new Error('File Excel không có dữ liệu');
  }

  // Tìm dòng header
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (
      row &&
      row.some(
        (c: any) =>
          typeof c === 'string' &&
          (c.toLowerCase().includes('mã sv') ||
            c.toLowerCase().includes('mã sinh viên') ||
            c.toLowerCase().includes('họ và tên') ||
            c.toLowerCase().includes('điểm'))
      )
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) headerIdx = 0;
  const headers = (rows[headerIdx] || []).map((h: any) => String(h || '').toLowerCase().trim());

  const codeIdx = headers.findIndex((h) => h.includes('mã sv') || h.includes('mã sinh viên') || h.includes('masv') || h.includes('mssv') || h.includes('mã'));
  const nameIdx = headers.findIndex((h) => h.includes('họ và tên') || h.includes('họ tên') || h.includes('tên') || h.includes('fullname'));
  const gradeIdx = headers.findIndex((h) => h.includes('điểm') || h.includes('grade') || h.includes('score') || h.includes('tổng kết') || h.includes('thi'));
  const absentIdx = headers.findIndex((h) => h.includes('vắng') || h.includes('tiết vắng') || h.includes('absent'));

  const parsed: ParsedGradeRow[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const rawCode = codeIdx >= 0 && r[codeIdx] ? String(r[codeIdx]).trim() : '';
    const rawName = nameIdx >= 0 && r[nameIdx] ? String(r[nameIdx]).trim() : '';
    const rawGrade = gradeIdx >= 0 ? r[gradeIdx] : null;
    const rawAbsent = absentIdx >= 0 && r[absentIdx] ? parseInt(String(r[absentIdx]), 10) : undefined;

    if (!rawCode && !rawName) continue;

    const parsedGrade = normalizeGradeValue(rawGrade);

    // Tìm sinh viên trong danh sách lớp
    let matched = students.find((s) => rawCode && s.studentCode.trim().toUpperCase() === rawCode.toUpperCase());
    if (!matched && rawName) {
      matched = students.find((s) => s.fullName.trim().toLowerCase() === rawName.toLowerCase());
    }

    parsed.push({
      studentCode: matched ? matched.studentCode : rawCode || 'Không rõ',
      fullName: matched ? matched.fullName : rawName,
      grade: parsedGrade,
      absentPeriods: !isNaN(Number(rawAbsent)) ? Number(rawAbsent) : undefined,
      matchedStudent: matched,
      matchStatus: matched ? (parsedGrade !== null ? 'matched' : 'invalid_grade') : 'not_found',
      errorMessage: !matched ? 'Không tìm thấy SV trong lớp' : parsedGrade === null ? 'Điểm chưa nhập hoặc không hợp lệ' : undefined,
    });
  }

  return parsed;
}

/**
 * Đọc điểm từ file Word (.docx, .doc)
 */
async function parseGradesFromWord(file: File, students: Student[]): Promise<ParsedGradeRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  let text = '';
  
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value;
  } catch (err) {
    // Fallback: decode text
    const decoder = new TextDecoder('utf-8');
    text = decoder.decode(arrayBuffer);
  }

  if (!text.trim()) {
    throw new Error('Không thể đọc nội dung văn bản từ file Word.');
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsed: ParsedGradeRow[] = [];

  for (const line of lines) {
    // Regex tìm mã sinh viên dạng SV + số hoặc chữ số
    const codeMatch = line.match(/(SV\d+|\b\d{6,10}\b)/i);
    // Regex tìm số điểm (0.0 đến 10.0 hoặc số nguyên)
    const gradeMatches = line.match(/\b(10(\.0+)?|[0-9](\.[0-9]+)?)\b/g);

    if (codeMatch) {
      const code = codeMatch[1].trim();
      const matched = students.find((s) => s.studentCode.toUpperCase() === code.toUpperCase());

      // Lấy số điểm cuối cùng hoặc sau mã SV
      let foundGrade: number | null = null;
      if (gradeMatches) {
        for (const g of gradeMatches) {
          const num = parseFloat(g);
          if (num >= 0 && num <= 10 && g !== code) {
            foundGrade = num;
          }
        }
      }

      parsed.push({
        studentCode: matched ? matched.studentCode : code,
        fullName: matched?.fullName,
        grade: foundGrade,
        matchedStudent: matched,
        matchStatus: matched ? (foundGrade !== null ? 'matched' : 'invalid_grade') : 'not_found',
        errorMessage: !matched ? 'Không tìm thấy SV trong lớp' : foundGrade === null ? 'Không tìm thấy điểm hợp lệ' : undefined,
      });
    } else {
      // Thử tìm theo tên sinh viên trong lớp
      for (const st of students) {
        if (line.toLowerCase().includes(st.fullName.toLowerCase())) {
          const gradeMatches = line.match(/\b(10(\.0+)?|[0-9](\.[0-9]+)?)\b/g);
          let foundGrade: number | null = null;
          if (gradeMatches && gradeMatches.length > 0) {
            const num = parseFloat(gradeMatches[gradeMatches.length - 1]);
            if (num >= 0 && num <= 10) foundGrade = num;
          }

          parsed.push({
            studentCode: st.studentCode,
            fullName: st.fullName,
            grade: foundGrade,
            matchedStudent: st,
            matchStatus: foundGrade !== null ? 'matched' : 'invalid_grade',
            errorMessage: foundGrade === null ? 'Không tìm thấy điểm hợp lệ' : undefined,
          });
          break;
        }
      }
    }
  }

  if (parsed.length === 0) {
    throw new Error('Không nhận diện được dòng điểm hoặc mã SV nào từ file Word. Vui lòng kiểm tra định dạng.');
  }

  return parsed;
}

/**
 * Đọc điểm từ file PDF (.pdf)
 */
async function parseGradesFromPDF(file: File, students: Student[]): Promise<ParsedGradeRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageStrings + '\n';
  }

  if (!fullText.trim()) {
    throw new Error('Không đọc được nội dung chữ từ file PDF (file có thể là bản scan hình ảnh).');
  }

  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsed: ParsedGradeRow[] = [];

  // Match line by line or by student code
  for (const st of students) {
    // Tìm vị trí xuất hiện mã SV hoặc Họ tên
    const regexCode = new RegExp(`\\b${st.studentCode}\\b`, 'i');
    const regexName = new RegExp(st.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const foundLine = lines.find((l) => regexCode.test(l) || regexName.test(l));
    if (foundLine) {
      // Tìm số điểm xung quanh
      const gradeMatches = foundLine.match(/\b(10(\.0+)?|[0-9](\.[0-9]+)?)\b/g);
      let foundGrade: number | null = null;
      if (gradeMatches) {
        // Lấy điểm cuối cùng trong dòng
        for (let i = gradeMatches.length - 1; i >= 0; i--) {
          const num = parseFloat(gradeMatches[i]);
          if (num >= 0 && num <= 10 && gradeMatches[i] !== st.birthYear) {
            foundGrade = num;
            break;
          }
        }
      }

      parsed.push({
        studentCode: st.studentCode,
        fullName: st.fullName,
        grade: foundGrade,
        matchedStudent: st,
        matchStatus: foundGrade !== null ? 'matched' : 'invalid_grade',
        errorMessage: foundGrade === null ? 'Không nhận diện được điểm' : undefined,
      });
    }
  }

  // Nếu không match được qua tên, match theo regex SV
  if (parsed.length === 0) {
    for (const line of lines) {
      const codeMatch = line.match(/(SV\d+|\b\d{6,10}\b)/i);
      if (codeMatch) {
        const code = codeMatch[1].trim();
        const matched = students.find((s) => s.studentCode.toUpperCase() === code.toUpperCase());
        const gradeMatches = line.match(/\b(10(\.0+)?|[0-9](\.[0-9]+)?)\b/g);
        let foundGrade: number | null = null;
        if (gradeMatches && gradeMatches.length > 0) {
          const num = parseFloat(gradeMatches[gradeMatches.length - 1]);
          if (num >= 0 && num <= 10) foundGrade = num;
        }

        parsed.push({
          studentCode: matched ? matched.studentCode : code,
          fullName: matched?.fullName,
          grade: foundGrade,
          matchedStudent: matched,
          matchStatus: matched ? (foundGrade !== null ? 'matched' : 'invalid_grade') : 'not_found',
          errorMessage: !matched ? 'Không tìm thấy SV trong lớp' : foundGrade === null ? 'Không tìm thấy điểm hợp lệ' : undefined,
        });
      }
    }
  }

  if (parsed.length === 0) {
    throw new Error('Không tìm thấy thông tin sinh viên và điểm số trong file PDF.');
  }

  return parsed;
}

/**
 * Hàm điều phối chung: Nhận diện định dạng file (Excel, Word, PDF) và đọc điểm
 */
export async function parseGradesFromFile(
  file: File,
  courseId: string,
  students: Student[]
): Promise<ParsedGradeRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
    return parseGradesFromExcel(file, students);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return parseGradesFromWord(file, students);
  } else if (fileName.endsWith('.pdf')) {
    return parseGradesFromPDF(file, students);
  } else {
    // Thử đọc như Excel trước, nếu lỗi đọc như text
    try {
      return await parseGradesFromExcel(file, students);
    } catch {
      return await parseGradesFromWord(file, students);
    }
  }
}
