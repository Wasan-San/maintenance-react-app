export const STORAGE_KEY = 'workscapeMaintenanceRequestsFinalV1';
export const DATA_VERSION_KEY = 'workscapeMaintenanceFinalDataVersion';
export const DATA_VERSION = '1';

export const STORE_MASTER = [
  { name: 'Central Rama 9', code: 'ST001' },
  { name: 'Mega Bangna', code: 'ST002' },
  { name: 'Terminal 21', code: 'ST003' },
  { name: 'Central Westgate', code: 'ST004' },
  { name: 'EmQuartier', code: 'ST005' },
  { name: 'Central Ladprao', code: 'ST006' },
  { name: 'Fashion Island', code: 'ST007' },
  { name: 'Seacon Square', code: 'ST008' }
];

export const NORMAL_STATUSES = [
  'New Request', 'Inform Contractor', 'Site Inspection', 'Quotation & Comparison',
  'Quotation Approval', 'Work Confirmation', 'Work Scheduling', 'On-Site Work',
  'Invoice', 'Completed'
];

export const SPECIAL_STATUSES = ['Hold', 'Cancelled', 'Invalid Request'];
export const ALL_STATUSES = [...NORMAL_STATUSES, ...SPECIAL_STATUSES];
export const CATEGORIES = ['Lighting & Logo', 'Building & Interior', 'AC System', 'Fixture', 'CCTV', 'EAS', 'LED Screen', 'Other'];
export const CONTRACTORS = ['ABC Service Co., Ltd.', 'Bright Works Co., Ltd.', 'Cool Air Service', 'FixPro Thailand', 'Metro Facility Service'];

export const SAMPLE_REQUESTS = [
  ['MT-2026-008','2026-09-08','ST001','Central Rama 9','Lighting & Logo','LED screen not working','Site Inspection','Bright Works Co., Ltd.',0],
  ['MT-2026-007','2026-09-07','ST002','Mega Bangna','AC System','AC not cooling','Quotation & Comparison','Cool Air Service',12500],
  ['MT-2026-006','2026-09-06','ST003','Terminal 21','Building & Interior','Drain pipe leaking','Completed','ABC Service Co., Ltd.',0],
  ['MT-2026-005','2026-09-05','ST004','Central Westgate','Fixture','Shelf hinge issue','Inform Contractor','FixPro Thailand',8300],
  ['MT-2026-004','2026-09-04','ST005','EmQuartier','EAS','Power outlet issue','Hold','',0],
  ['MT-2026-003','2026-09-03','ST006','Central Ladprao','CCTV','Camera offline','Cancelled','',0],
  ['MT-2026-002','2026-09-02','ST007','Fashion Island','LED Screen','Logo panel loose','On-Site Work','Metro Facility Service',15200],
  ['MT-2026-001','2026-09-01','ST008','Seacon Square','Other','Ceiling stain','Completed','ABC Service Co., Ltd.',1800]
].map(([workCode,reportedDate,storeCode,storeName,category,issueTitle,status,contractor,actualCost]) => ({
  workCode, reportedDate, storeCode, storeName, category, issueTitle, status, contractor, actualCost,
  email: 'store@company.com', mobile: '', hqSupport: '', details: issueTitle, urgent: false,
  reportedPhotos: [], adminPhotos: [], chargeType: '', costCategory: category, adminNotes: '',
  createdAt: reportedDate + 'T09:00:00', lastUpdate: reportedDate + 'T09:00:00',
  history: [{ status: 'New Request', date: reportedDate + 'T09:00:00', by: 'Store Staff' }]
}));
