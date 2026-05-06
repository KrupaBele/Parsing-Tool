/**
 * CSV column names expected by ssa-compliance-backend bulk uploads
 * (see controllers/client/client.controller.js — csv().fromFile keys).
 */

export const TARGET_TYPES = {
  employee: 'employee',
  payRegister: 'payRegister',
  attendance: 'attendance',
};

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
  'arrear',
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
];

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
    department: ['department', 'dept', 'location'],
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
    arrear: ['arrear', 'arrears'],
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
    specialBasic: ['specialbasic', 'special basic', 'basic arrear'],
    compensatoryHolidyay: ['compensatoryholidyay', 'compensatory holiday'],
    spreadoverFrom: ['spreadoverfrom', 'spreadover from'],
    spreadoverTo: ['spreadoverto', 'spreadover to'],
    relay: ['relay'],
  },
  [TARGET_TYPES.attendance]: {
    branchcode: ['branchcode', 'branch code', 'branch'],
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

/**
 * Guess target from raw headers (normalized tokens).
 * @param {string[]} rawHeaders
 */
export function guessTargetFromHeaders(rawHeaders) {
  const norm = rawHeaders.map(normalizeHeader).filter(Boolean);
  const set = new Set(norm);

  const hasDayNumbers =
    ['1', '2', '3', '4', '5'].every(d => set.has(d)) ||
    norm.some(h => /^day\s*\d+$/.test(h));

  const grossish = norm.some(n => n.includes('gross'));
  const basicish = norm.some(n => n.includes('basic'));
  const payableDaysish = norm.some(n => n.includes('payable') && n.includes('day'));

  const employeeHints =
    norm.some(n => n.includes('annual') && n.includes('ctc')) ||
    norm.some(n => n.includes('aadhaar') || n.includes('aadhar')) ||
    norm.some(n => n.includes('ifsc')) ||
    norm.some(n => n.includes('employee') && n.includes('code')) ||
    norm.some(n => n.includes('date of joining') && n.includes('dd/mm'));

  /** Leave-style registers use day columns 1–31; payroll sheets rarely use those headers together with salary bands. */
  if (hasDayNumbers && !(grossish && basicish)) {
    return TARGET_TYPES.attendance;
  }

  if ((grossish && basicish) || (payableDaysish && basicish) || payHintsCount(norm) >= 3) {
    return TARGET_TYPES.payRegister;
  }
  if (employeeHints) {
    return TARGET_TYPES.employee;
  }
  if (basicish && norm.some(n => n.includes('employee') && (n.includes('id') || n.includes('code')))) {
    return TARGET_TYPES.payRegister;
  }
  return TARGET_TYPES.employee;
}

/** @param {string[]} norm */
function payHintsCount(norm) {
  const keys = ['gross', 'basic', 'payable', 'provident', 'deduction', 'allowance', 'net pay', 'tds', 'esi'];
  return keys.reduce((n, k) => n + (norm.some(h => h.includes(k)) ? 1 : 0), 0);
}
