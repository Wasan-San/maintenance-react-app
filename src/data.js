export const NORMAL_STATUSES = [
  'New Request', 'Inform Contractor', 'Site Inspection', 'Quotation & Comparison',
  'Quotation Approval', 'Work Confirmation', 'Work Scheduling', 'On-Site Work',
  'Invoice', 'Completed'
];

export const SPECIAL_STATUSES = ['Hold', 'Cancelled', 'Invalid Request'];
export const ALL_STATUSES = [...NORMAL_STATUSES, ...SPECIAL_STATUSES];
export const CATEGORIES = ['Lighting & Logo', 'Building & Interior', 'AC System', 'Fixture', 'CCTV', 'EAS', 'LED Screen', 'Other'];
