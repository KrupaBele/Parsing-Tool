/**
 * CSV column names expected by ssa-compliance-backend bulk uploads
 * (see controllers/client/client.controller.js — csv().fromFile keys).
 */

export const TARGET_TYPES = {
  employee: 'employee',
  payRegister: 'payRegister',
  attendance: 'attendance',
};

/**
 * Backend CSV keys that store calendar dates. Used when reading Excel so numeric
 * serials in those columns are formatted as dd-mm-yyyy (not mistaken for IDs).
 */
export const DATE_CSV_FIELD_KEYS = new Set([
  'dateOfBirth',
  'dateOfJoining',
  'dateOfExit',
  'dateOnWhichCompletionOf480DaysService',
  'dateOnWhichMadePermanent',
  'dateOfPayment',
  'periodFrom',
  'periodTo',
  'dateOfRevocation',
  'spreadoverFrom',
  'spreadoverTo',
]);

export const EMPLOYEE_CSV_FIELDS = [
  'branchcode',
  'employeeCode',
  'employeeName',
  'gender',
  'maritalStatus',
  'fatherName',
  'husbandName',
  'spouseName',
  'dateOfBirth',
  'age',
  'adultAdolescentChild',
  'categoryOfWorkman',
  'natureOfWork',
  'shiftNumber',
  'timeOfCommencementOfWork',
  'restInterval',
  'timeWhichWorkEnds',
  'weeklyHoliday',
  'slNoInRegisterOfEmployment',
  'state',
  'nationality',
  'education',
  'dateOfJoining',
  'designation',
  'department',
  'categoryAddress',
  'typeOfEmployment',
  'mobile',
  'email',
  'aadhaar',
  'uan',
  'esicIpNo',
  'pan',
  'bankName',
  'bankAddress',
  'bankAccountNumber',
  'bankIfsc',
  'presentAddress',
  'permanentAddress',
  'servieBookNo',
  'dateOfExit',
  'reasonForExit',
  'markOfIdentification',
  'photo',
  'annualCTC',
  'monthlyCTC',
  'dateOnWhichCompletionOf480DaysService',
  'dateOnWhichMadePermanent',
  'periodOfSuspension',
  'PLBalance',
  'SLBalance',
  'CLBanalce',
  'whetherTemporaryCasualBadliApprentice',
  'hasCompleted15YearsOfAgeAtTheBeginningOfTheYear',
  'basic',
  'DA',
  'HRA',
  'medicalAllowance',
  'Convayance',
  'lta',
  'otherAllowances',
  'othersReason',
  'grossWages',
  'pfDebit',
  'esicDebit',
  'ptax',
  'lwf',
  'OtherSpecify',
  'workHoursDaily',
  'categoryOfWorker',
  'employmentType',
  'replayOrGroupNumber',
  'pfEmployerShare',
  'noOfLeaveGranted',
  'noOfWeeklyOffGranted',
  'nominee',
  'specialBasic',
  'pfNumber',
  'religion',
];

export const PAY_REGISTER_CSV_FIELDS = [
  'branchcode',
  'employeeCode',
  'employeeName',
  /** Present on many client payroll sheets; backend upload ignores extras — kept for clean Excel/CSV output. */
  'aadhaar',
  'uan',
  'pan',
  'fnf',
  'gender',
  'youngPerson',
  'noOfDaysWorked',
  'dateOfPayment',
  'fines',
  'unpaidAccumulations',
  'rateAtWhichSubsistenceAllowanceCalculatedAndAmountPaid',
  'bankTransactionIDAndDate',
  'modeOfPayment',
  'otHours',
  'basic',
  'DA',
  'HRA',
  'NFH',
  'attendanceBonus',
  'medicalAllowances',
  'bonusAllowances',
  'specialAllowances',
  'maternityAllowances',
  'Convayance',
  'subAllowance',
  'otherAllowances',
  'OtherSpecify',
  'otWages',
  'leaveWages',
  'grossPayable',
  'pf',
  'esi',
  'pt',
  'tds',
  'society',
  'insurance',
  'damage',
  'lwf',
  'advancePaid',
  'advanceRecovered',
  'advancePending',
  'deductionImposed',
  'deductionAtBeginningOfMonth',
  'deductionMade',
  'pendingRecovery',
  'otherDeduction',
  'totalDeduction',
  'totalNetPayAmount',
  'arrearsFromLastMonth',
  'compensatoryPay',
  'pensionFund',
  'cityCompensatoryAllowance',
  'remarks',
  'loan',
  'specialBasic',
  'compensatoryHolidyay',
  'spreadoverFrom',
  'spreadoverTo',
  'relay',
  'basicArrear',
  'hraArrear',
  'specialAllowanceArrear',
  'pfArrear',
];

/** Pay amounts that may arrive as Indian-formatted text (e.g. "8,12,013.83") — strip commas on export. */
export const PAY_AMOUNT_CSV_FIELDS = new Set([
  'fines',
  'unpaidAccumulations',
  'rateAtWhichSubsistenceAllowanceCalculatedAndAmountPaid',
  'otHours',
  'basic',
  'DA',
  'HRA',
  'NFH',
  'attendanceBonus',
  'medicalAllowances',
  'bonusAllowances',
  'specialAllowances',
  'maternityAllowances',
  'Convayance',
  'subAllowance',
  'otherAllowances',
  'otWages',
  'leaveWages',
  'grossPayable',
  'pf',
  'esi',
  'pt',
  'tds',
  'society',
  'insurance',
  'damage',
  'lwf',
  'advancePaid',
  'advanceRecovered',
  'advancePending',
  'deductionImposed',
  'deductionAtBeginningOfMonth',
  'deductionMade',
  'pendingRecovery',
  'otherDeduction',
  'totalDeduction',
  'totalNetPayAmount',
  'arrearsFromLastMonth',
  'compensatoryPay',
  'pensionFund',
  'cityCompensatoryAllowance',
  'loan',
  'specialBasic',
  'compensatoryHolidyay',
  'basicArrear',
  'hraArrear',
  'specialAllowanceArrear',
  'pfArrear',
]);

const DAY_FIELDS = Array.from({ length: 31 }, (_, i) => String(i + 1));

export const ATTENDANCE_CSV_FIELDS = [
  'branchcode',
  'employeeCode',
  'employeeName',
  'periodFrom',
  'periodTo',
  'totalDaysWorked',
  'totalPayableLeave',
  'lop',
  'noOfPayableDays',
  'totalOTHoursWorked',
  ...DAY_FIELDS,
  'natureOfOffence',
  'dateOfRevocation',
  'plCredit',
  'clCredit',
  'slCredit',
  'maternityLeave',
];

/** @param {string} s */
export function normalizeHeader(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Multiple raw header forms → backend CSV key
 * Keys: TARGET_TYPES values
 */
export const SYNONYMS = {
  [TARGET_TYPES.employee]: {
    branchcode: ['branchcode', 'branch code', 'branch', 'location code', 'loc code'],
    employeeCode: [
      'employeecode',
      'employee code',
      'employee id',
      'emp id',
      'emp code',
      'emp no',
      'employee no',
      'ecode',
      'staff id',
    ],
    employeeName: ['employeename', 'employee name', 'name', 'emp name', 'staff name'],
    gender: ['gender', 'sex'],
    maritalStatus: ['maritalstatus', 'marital status'],
    fatherName: ['fathername', 'father name', 'fathers name', "father/husband's name", 'father husband name'],
    husbandName: ['husbandname', 'husband name'],
    spouseName: ['spousename', 'spouse name'],
    dateOfBirth: ['dateofbirth', 'date of birth', 'dob', 'birth date'],
    age: ['age'],
    mobile: ['mobile', 'contact number', 'phone', 'mobile no', 'contact no'],
    email: ['email', 'official mail id', 'official email', 'e-mail'],
    aadhaar: ['aadhaar', 'aadhar', 'aadhaar number', 'aadhar number', 'aadhaar no', 'aadhar no', 'uid', 'uid number'],
    uan: ['uan', 'uan number', 'uan no'],
    esicIpNo: ['esicipno', 'esi number', 'esi no', 'esic', 'esic ip no'],
    pan: ['pan', 'pan number', 'pan no', 'pan card', 'pan num'],
    bankName: ['bankname', 'bank name'],
    bankAccountNumber: ['bankaccountnumber', 'account number', 'bank ac no', 'bankacno', 'acct no'],
    bankIfsc: ['bankifsc', 'ifsc', 'ifsc code', 'ifsccode'],
    designation: ['designation', 'job title', 'title'],
    department: ['department', 'dept'],
    /** Mapped from Excel only — used for branch allocation, not exported to CSV */
    location: ['location', 'work location', 'office location', 'site', 'workplace', 'place'],
    dateOfJoining: ['dateofjoining', 'date of joining', 'doj', 'joining date'],
    nationality: ['nationality'],
    annualCTC: ['annualctc', 'annual ctc', 'ctc'],
    education: ['education', 'qualification'],
    state: ['state'],
    presentAddress: ['presentaddress', 'present address', 'address'],
    permanentAddress: ['permanentaddress', 'permanent address'],
    basic: ['basic', 'basic pay'],
    DA: ['da', 'dearness allowance'],
    HRA: ['hra', 'house rent allowance', 'house rent'],
    medicalAllowance: ['medicalallowance', 'medical allowance'],
    Convayance: ['convayance', 'conveyance'],
    lta: ['lta', 'leave travel'],
    otherAllowances: ['otherallowances', 'other allowance', 'other allowances'],
    grossWages: ['grosswages', 'gross wages', 'gross'],
    pfDebit: ['pfdebit', 'pf debit', 'employee pf'],
    esicDebit: ['esicdebit', 'esi debit', 'employee esi'],
    ptax: ['ptax', 'professional tax', 'p tax'],
    pfNumber: ['pfnumber', 'pf number', 'pf no'],
  },
  [TARGET_TYPES.payRegister]: {
    branchcode: ['branchcode', 'branch code', 'branch'],
    employeeCode: ['employeecode', 'employee code', 'employee id', 'emp id', 'emp code'],
    employeeName: ['employeename', 'employee name', 'name'],
    aadhaar: ['aadhaar', 'aadhar', 'aadhaar number', 'aadhar number', 'aadhaar no', 'aadhar no', 'uid', 'uid number'],
    uan: ['uan', 'uan number', 'uan no'],
    pan: ['pan', 'pan number', 'pan no', 'pan card', 'pan num'],
    gender: ['gender'],
    youngPerson: ['youngperson', 'young person'],
    noOfDaysWorked: [
      'noofdaysworked',
      'no of days worked',
      'days worked',
      'payable days',
      'pay days',
      'paid days',
      'paidays',
    ],
    dateOfPayment: ['dateofpayment', 'date of payment', 'pay date'],
    fnf: ['fnf', 'full and final'],
    fines: ['fines'],
    unpaidAccumulations: ['unpaidaccumulations', 'unpaid accumulations'],
    rateAtWhichSubsistenceAllowanceCalculatedAndAmountPaid: [
      'rateatwhichsubsistenceallowancecalculatedandamountpaid',
      'subsistence allowance',
    ],
    bankTransactionIDAndDate: ['banktransactionidanddate', 'bank transaction'],
    modeOfPayment: ['modeofpayment', 'mode of payment'],
    otHours: ['othours', 'ot hours', 'overtime hours'],
    basic: ['basic'],
    DA: ['da'],
    HRA: ['hra', 'house rent allowance', 'house rent'],
    NFH: ['nfh'],
    attendanceBonus: ['attendancebonus', 'attendance bonus'],
    medicalAllowances: ['medicalallowances', 'medical allowance', 'medical allowances'],
    bonusAllowances: ['bonusallowances', 'bonus allowance', 'bonus'],
    specialAllowances: ['specialallowances', 'special allowance', 'spl arrear', 'special'],
    maternityAllowances: ['maternityallowances', 'maternity'],
    Convayance: ['convayance', 'conveyance'],
    subAllowance: ['suballowance', 'sub allowance'],
    otherAllowances: ['otherallowances', 'other earning', 'other allowances', 'referral bonus', 'night shift allowance'],
    OtherSpecify: ['otherspecify', 'other specify'],
    otWages: ['otwages', 'ot wages'],
    leaveWages: ['leavewages', 'leave wages', 'leave encashment'],
    grossPayable: ['grosspayable', 'gross payable', 'grosspay', 'gross pay'],
    pf: ['pf', 'provident fund'],
    esi: ['esi', 'esic'],
    pt: ['pt', 'professional tax', 'profesional tax', 'p tax'],
    tds: ['tds'],
    society: ['society'],
    insurance: ['insurance'],
    damage: ['damage'],
    lwf: ['lwf', 'lwf employee'],
    advancePaid: ['advancepaid', 'advance paid'],
    advanceRecovered: ['advancerecovered', 'advance recovered'],
    advancePending: ['advancepending', 'advance pending'],
    deductionImposed: ['deductionimposed', 'deduction imposed'],
    deductionAtBeginningOfMonth: ['deductionatbeginningofmonth', 'deduction at beginning'],
    deductionMade: ['deductionmade', 'deduction made'],
    pendingRecovery: ['pendingrecovery', 'pending recovery'],
    otherDeduction: ['otherdeduction', 'other deduction'],
    totalDeduction: ['totaldeduction', 'total deduction'],
    totalNetPayAmount: ['totalnetpayamount', 'net pay', 'net salary', 'take home'],
    arrearsFromLastMonth: ['arrearsfromlastmonth', 'arrears from last month'],
    compensatoryPay: ['compensatorypay', 'compensatory pay'],
    pensionFund: ['pensionfund', 'pension fund'],
    cityCompensatoryAllowance: ['citycompensatoryallowance', 'cca'],
    remarks: ['remarks', 'remark'],
    loan: ['loan'],
    specialBasic: ['specialbasic', 'special basic'],
    compensatoryHolidyay: ['compensatoryholidyay', 'compensatory holiday'],
    spreadoverFrom: ['spreadoverfrom', 'spreadover from'],
    spreadoverTo: ['spreadoverto', 'spreadover to'],
    relay: ['relay'],
    basicArrear: ['basicarrear', 'basic arrear', 'basic arrears'],
    hraArrear: ['hraarrear', 'hra arrear', 'hra arrears', 'house rent arrear'],
    specialAllowanceArrear: [
      'specialallowancearrear',
      'special allowance arrear',
      'special allowance arrears',
      'spl allowance arrear',
    ],
    pfArrear: ['pfarrear', 'pf arrear', 'pf arrears', 'provident fund arrear', 'provident fund arrears'],
  },
  [TARGET_TYPES.attendance]: {
    branchcode: ['branchcode', 'branchcod', 'branch code', 'branch'],
    employeeCode: ['employeecode', 'employee code', 'employee id', 'emp id', 'emp code'],
    employeeName: ['employeename', 'employee name', 'name'],
    periodFrom: ['periodfrom', 'period from', 'from date', 'attendance from'],
    periodTo: ['periodto', 'period to', 'to date', 'attendance to'],
    totalDaysWorked: ['totaldaysworked', 'total days worked', 'days present'],
    totalPayableLeave: ['totalpayableleave', 'total payable leave', 'leave balance'],
    lop: ['lop', 'loss of pay', 'lwp'],
    noOfPayableDays: ['noofpayabledays', 'no of payable days', 'payable days'],
    totalOTHoursWorked: ['totalothoursworked', 'total ot hours', 'ot hours'],
    natureOfOffence: ['natureofoffence', 'nature of offence'],
    dateOfRevocation: ['dateofrevocation', 'date of revocation'],
    plCredit: ['plcredit', 'pl credit'],
    clCredit: ['clcredit', 'cl credit'],
    slCredit: ['slcredit', 'sl credit'],
    maternityLeave: ['maternityleave', 'maternity leave'],
    ...Object.fromEntries(DAY_FIELDS.map(d => [d, [d, `day ${d}`, `d${d}`]])),
  },
};

/** @param {string} targetType */
export function fieldsForTarget(targetType) {
  if (targetType === TARGET_TYPES.employee) return EMPLOYEE_CSV_FIELDS;
  if (targetType === TARGET_TYPES.payRegister) return PAY_REGISTER_CSV_FIELDS;
  return ATTENDANCE_CSV_FIELDS;
}

/** Column mapping keys (includes allocation-only fields not in CSV export). */
export function mappingFieldsForTarget(targetType) {
  if (targetType !== TARGET_TYPES.employee) return fieldsForTarget(targetType);
  const fields = [...EMPLOYEE_CSV_FIELDS];
  const stateIdx = fields.indexOf('state');
  if (!fields.includes('location')) {
    fields.splice(stateIdx >= 0 ? stateIdx + 1 : fields.length, 0, 'location');
  }
  return fields;
}

/**
 * @param {string} targetType
 * @returns {Record<string, string>} normalized synonym -> backend key
 */
export function buildSynonymToField(targetType) {
  const map = {};
  const syn = SYNONYMS[targetType] || {};
  for (const [field, list] of Object.entries(syn)) {
    for (const phrase of list) {
      map[normalizeHeader(phrase)] = field;
    }
    map[normalizeHeader(field)] = field;
  }
  return map;
}

/** @param {string[]} norm */
function hasPayableDaysHeader(norm) {
  return norm.some(
    (n) =>
      (n.includes('payable') && n.includes('day')) ||
      n.includes('pay day') ||
      n.includes('paid day') ||
      n === 'pay days' ||
      n === 'paid days' ||
      n.includes('no of payable days'),
  );
}

/** Onboarding-only — rarely the main purpose of a monthly pay sheet */
function scoreEmployeeMaster(norm) {
  let strong = 0;
  const has = (fn) => norm.some(fn);

  if (has((n) => n.includes('date of joining') || n === 'doj' || n.includes('joining date')))
    strong += 10;
  if (has((n) => n.includes('date of birth') || n === 'dob' || n.includes('birth date')))
    strong += 8;
  if (has((n) => n.includes('ifsc'))) strong += 8;
  if (has((n) => n.includes('designation') || n.includes('job title'))) strong += 6;
  if (has((n) => n.includes('father') && n.includes('name'))) strong += 6;
  if (has((n) => n.includes('present address') || n === 'address')) strong += 5;
  if (has((n) => n.includes('annual') && n.includes('ctc'))) strong += 6;
  if (has((n) => n.includes('bank name') || n.includes('bank account'))) strong += 4;
  if (has((n) => n.includes('pf number') || n === 'pf no')) strong += 4;
  if (has((n) => n === 'state' || n === 'location' || n.includes('work location'))) strong += 3;
  if (has((n) => n.includes('nationality') || n.includes('education'))) strong += 3;

  // Weak — common on payslips too; low weight
  let weak = 0;
  if (has((n) => n.includes('aadhaar') || n.includes('aadhar'))) weak += 2;
  if (has((n) => n.includes('uan'))) weak += 1;
  if (has((n) => n.includes('pan'))) weak += 1;
  if (has((n) => n === 'gender' || n === 'sex')) weak += 1;

  return { strong, weak, total: strong + weak };
}

/** Monthly payroll-run columns */
function scorePayRegister(norm) {
  let strong = 0;
  const has = (fn) => norm.some(fn);

  if (has((n) => n.includes('net pay') || n.includes('net salary') || n.includes('take home')))
    strong += 10;
  if (has((n) => n.includes('gross payable') || n.includes('gross pay'))) strong += 9;
  if (hasPayableDaysHeader(norm)) strong += 8;
  if (has((n) => n.includes('no of days worked') || n.includes('days worked'))) strong += 7;
  if (has((n) => n.includes('date of payment') || n.includes('pay date'))) strong += 7;
  if (has((n) => n === 'fnf' || n.includes('full and final'))) strong += 8;
  if (has((n) => n === 'tds')) strong += 6;
  if (has((n) => n.includes('arrear'))) strong += 6;
  if (has((n) => n.includes('total deduction'))) strong += 6;
  if (has((n) => n.includes('ot wages') || n.includes('overtime'))) strong += 4;
  if (has((n) => n.includes('advance paid') || n.includes('advance recovered'))) strong += 4;
  if (has((n) => n.includes('leave wages') || n.includes('leave encashment'))) strong += 4;

  let medium = 0;
  const grossish = has((n) => n.includes('gross'));
  const basicish = has((n) => n.includes('basic'));
  if (grossish && basicish) medium += 5;
  if (has((n) => n === 'pf' || n.includes('provident fund') || n.includes('employee pf')))
    medium += 2;
  if (has((n) => n === 'esi' || n.includes('esic') || n.includes('employee esi'))) medium += 2;
  if (has((n) => n === 'pt' || n.includes('professional tax') || n === 'p tax')) medium += 2;
  if (has((n) => n.includes('deduction'))) medium += 2;
  if (has((n) => n === 'lwf')) medium += 2;

  return { strong, medium, total: strong + medium };
}

/**
 * Guess target from raw headers (normalized tokens).
 * @param {string[]} rawHeaders
 */
export function guessTargetFromHeaders(rawHeaders) {
  const norm = rawHeaders.map(normalizeHeader).filter(Boolean);
  const set = new Set(norm);

  const hasDayNumbers =
    ['1', '2', '3', '4', '5'].every((d) => set.has(d)) ||
    norm.some((h) => /^day\s*\d+$/.test(h));

  const grossish = norm.some((n) => n.includes('gross'));
  const basicish = norm.some((n) => n.includes('basic'));

  if (hasDayNumbers && !(grossish && basicish)) {
    return TARGET_TYPES.attendance;
  }

  const emp = scoreEmployeeMaster(norm);
  const pay = scorePayRegister(norm);

  const hasOnboarding =
    norm.some((n) => n.includes('date of joining') || n === 'doj' || n.includes('joining date')) ||
    norm.some((n) => n.includes('date of birth') || n === 'dob') ||
    norm.some((n) => n.includes('ifsc'));

  // Monthly pay sheet: 2+ payroll-run headers, or gross+basic+deduction without onboarding
  if (
    pay.strong >= 2 ||
    (pay.strong >= 1 && grossish && basicish) ||
    (grossish && basicish && pay.medium >= 4 && !hasOnboarding)
  ) {
    return TARGET_TYPES.payRegister;
  }

  // Employee master: onboarding / identity fields
  if (emp.strong >= 2 || hasOnboarding) {
    return TARGET_TYPES.employee;
  }

  if (pay.strong > emp.strong) return TARGET_TYPES.payRegister;
  if (emp.strong > pay.strong) return TARGET_TYPES.employee;
  if (pay.total > emp.total && pay.total >= 4) return TARGET_TYPES.payRegister;

  return TARGET_TYPES.employee;
}
