import { mockCases } from '@/data/mockCases';

const IMPORTED_CASES_STORAGE_KEY = 'proofline.importedCases';

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeCaseShape(item) {
  return {
    ...item,
    customer: {
      id: item?.customer?.id ?? null,
      name: item?.customer?.name ?? 'Unknown Customer',
      cnic: item?.customer?.cnic ?? '',
      account_number: item?.customer?.account_number ?? '',
      card_number: item?.customer?.card_number ?? '',
      city: item?.customer?.city ?? 'N/A',
      region: item?.customer?.region ?? 'N/A',
      mobile: item?.customer?.mobile ?? '',
    },
    transactions: Array.isArray(item?.transactions) ? item.transactions : [],
    actions: Array.isArray(item?.actions) ? item.actions : [],
  };
}

export function getImportedCases() {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(IMPORTED_CASES_STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeCaseShape);
}

export function saveImportedCases(cases) {
  if (!isBrowser()) return;
  const normalized = Array.isArray(cases) ? cases.map(normalizeCaseShape) : [];
  window.localStorage.setItem(IMPORTED_CASES_STORAGE_KEY, JSON.stringify(normalized));
}

export function addImportedCases(newCases) {
  const existing = getImportedCases();
  const incoming = Array.isArray(newCases) ? newCases : [];
  const existingRefs = new Set(existing.map((c) => c.reference_number));

  const filteredIncoming = incoming.filter((c) => !existingRefs.has(c.reference_number));
  const merged = [...existing, ...filteredIncoming];
  saveImportedCases(merged);

  return {
    addedCases: filteredIncoming.length,
    totalImportedCases: merged.length,
  };
}

export function getAllCases() {
  return [...mockCases, ...getImportedCases()];
}

export function clearImportedCases() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(IMPORTED_CASES_STORAGE_KEY);
}
