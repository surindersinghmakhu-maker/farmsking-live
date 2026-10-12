import { Platform } from 'react-native';

/**
 * Universal Excel CSV Exporter with UTF-8 BOM (\uFEFF)
 * Ensures Punjabi, Hindi, currency symbols, and multi-line addresses open cleanly in Excel without gibberish.
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const sanitizeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(sanitizeCell).join(','),
    ...rows.map((row) => row.map(sanitizeCell).join(',')),
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Web platform is primary for Admin, fallback log for native
    console.log('[exportToExcel] Generated CSV content length:', csvContent.length);
  }
}

/** Export Users/Farmers directory to Excel */
export function exportUsersToExcel(users: any[], customFilename?: string) {
  const filename = customFilename || `FarmsKing_Users_${new Date().toISOString().slice(0, 10)}.csv`;
  const headers = [
    'King ID',
    'Full Name',
    'Mobile Number',
    'Active Role',
    'All Roles',
    'Village',
    'District',
    'State',
    'PIN Code',
    'Email Address',
    'UPI ID',
    'Registration Date',
    'Status',
  ];

  const rows = users.map((u) => [
    u.kingId || '',
    u.name || '',
    u.mobile || '',
    u.role || '',
    (u.roles || []).join(', '),
    u.village || '',
    u.district || '',
    u.state || '',
    u.pincode || '',
    u.email || '',
    u.upiId || '',
    u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '',
    u.isPermanentlyBlocked ? 'Blocked' : u.deletedAt ? 'Deactivated' : 'Active',
  ]);

  exportToExcel(filename, headers, rows);
}

/** Export Orders list to Excel */
export function exportOrdersToExcel(orders: any[], customFilename?: string) {
  const filename = customFilename || `FarmsKing_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
  const headers = [
    'Order ID',
    'Customer Name',
    'Customer Mobile',
    'Total Items',
    'Order Total (₹)',
    'Payment Status',
    'Order Status',
    'Delivery Address',
    'Order Date',
  ];

  const rows = orders.map((o) => [
    o.id || '',
    o.user?.name || o.customer?.name || 'Customer',
    o.user?.mobile || o.customer?.mobile || '',
    Array.isArray(o.items) ? o.items.length : 1,
    o.totalAmount || 0,
    o.paymentStatus || 'COMPLETED',
    o.status || 'PLACED',
    o.shippingAddress || o.address || '',
    o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '',
  ]);

  exportToExcel(filename, headers, rows);
}

/** Export Accounts & Ledger list to Excel */
export function exportAccountsToExcel(accounts: any[], customFilename?: string) {
  const filename = customFilename || `FarmsKing_Accounts_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  const headers = [
    'Account / Party Name',
    'Party Type',
    'Mobile Number',
    'Village / City',
    'Current Balance (₹)',
    'Total Inflow (₹)',
    'Total Outflow (₹)',
    'Last Transaction Date',
    'Status',
  ];

  const rows = accounts.map((a) => [
    a.name || a.title || 'Party Account',
    a.type || a.partyType || 'General',
    a.mobile || '',
    a.village || a.city || '',
    a.balance ?? a.currentBalance ?? 0,
    a.totalInflow ?? a.totalCredit ?? 0,
    a.totalOutflow ?? a.totalDebit ?? 0,
    a.lastActivity ? new Date(a.lastActivity).toLocaleDateString('en-IN') : '',
    a.status || 'Active',
  ]);

  exportToExcel(filename, headers, rows);
}

/** Export Sellers & Stores directory to Excel */
export function exportSellersToExcel(stores: any[], customFilename?: string) {
  const filename = customFilename || `FarmsKing_Sellers_${new Date().toISOString().slice(0, 10)}.csv`;
  const headers = [
    'Store Name',
    'Seller Name',
    'Mobile Number',
    'Email Address',
    'KYC Status',
    'Base Commission (%)',
    'Fertilizer Comm (%)',
    'Seeds Comm (%)',
    'Spray Comm (%)',
    'GSTIN',
    'PAN Number',
    'Bank A/c No',
    'Bank IFSC',
    'Warehouse Address',
    'Rating',
    'Registered Date',
  ];

  const rows = stores.map((s) => {
    const cats = s.categoryCommissions || {};
    return [
      s.storeName || '',
      s.seller?.name || '',
      s.seller?.mobile || '',
      s.seller?.email || '',
      s.kycStatus || 'PENDING',
      s.commissionRate || 5.0,
      cats['Fertilizer'] ?? 'Default',
      cats['Seeds'] ?? 'Default',
      cats['Pesticides'] ?? 'Default',
      s.gstin || '',
      s.panNumber || '',
      s.bankAccountNo || '',
      s.bankIfsc || '',
      s.pickupAddress ? `${s.pickupAddress}, ${s.pickupCity || ''} - ${s.pickupPincode || ''}` : '',
      s.rating || 4.8,
      s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '',
    ];
  });

  exportToExcel(filename, headers, rows);
}
