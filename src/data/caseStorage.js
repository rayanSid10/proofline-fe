import { mockCases } from '@/data/mockCases';

const IMPORTED_CASES_STORAGE_KEY = 'proofline.importedCases';
const ROUND_ROBIN_IO_INDEX_KEY = 'proofline.ioRoundRobinIndex';

const INVESTIGATOR_POOL = [
  { id: 2, name: 'Ali Raza' },
  { id: 3, name: 'Fatima Zahra' },
  { id: 4, name: 'Usman Tariq' },
];

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

function getRoundRobinIndex() {
  if (!isBrowser()) return 0;
  const raw = window.localStorage.getItem(ROUND_ROBIN_IO_INDEX_KEY);
  const idx = Number(raw);
  return Number.isFinite(idx) && idx >= 0 ? idx : 0;
}

function setRoundRobinIndex(index) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ROUND_ROBIN_IO_INDEX_KEY, String(index));
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

export function getInvestigatorPool() {
  return [...INVESTIGATOR_POOL];
}

export function assignNextInvestigator() {
  const pool = getInvestigatorPool();
  if (pool.length === 0) return null;

  const index = getRoundRobinIndex() % pool.length;
  const investigator = pool[index];
  setRoundRobinIndex((index + 1) % pool.length);
  return investigator;
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

export function upsertCase(updatedCase) {
  if (!updatedCase) return;

  const normalized = normalizeCaseShape(updatedCase);
  const existing = getImportedCases();
  const targetId = Number(normalized.id);

  const idx = existing.findIndex((c) => Number(c.id) === targetId);
  if (idx >= 0) {
    const next = [...existing];
    next[idx] = normalized;
    saveImportedCases(next);
    return;
  }

  saveImportedCases([...existing, normalized]);
}

export function getAllCases() {
  const mergedById = new Map(mockCases.map((c) => [Number(c.id), c]));
  getImportedCases().forEach((c) => {
    mergedById.set(Number(c.id), c);
  });

  return [...mergedById.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

export function clearImportedCases() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(IMPORTED_CASES_STORAGE_KEY);
}
