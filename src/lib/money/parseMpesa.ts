import { CATEGORY_META, CARTOON_AVATARS, type MoneyCategory, type MoneyTx } from './types';

const num = (s: string) => {
  const t = (s || '').replace(/,/g, '').trim();
  if (!t || t === '-') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
};

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function classifyDetails(details: string): MoneyCategory {
  const d = details.toLowerCase();
  if (/salary payment/i.test(d)) return 'salary';
  if (/funds received|received from|agent deposit|send money reversal/i.test(d)) return 'salary';
  if (/overdraft of credit/i.test(d)) return 'loan';
  if (/fuliza|od loan|loan repayment|m-pesa overdraw/i.test(d)) return 'loan';
  if (/charge|customer transfer of funds charge|pay bill charge|withdrawal charge/i.test(d)) return 'fees';
  if (/data plans|airtime|bundles/i.test(d)) return 'data';
  if (/kplc|pay bill|paybill|equity|kcb|family bank|mogo|nhif|nssf/i.test(d)) return 'bills';
  if (/withdrawal|agent till/i.test(d)) return 'cash';
  if (/grill|restaurant|cafe|food|butchery|supermarket|naivas|carrefour|java|bakery|hotel|jaza|kitchen/i.test(d)) return 'food';
  if (/uber|bolt|matatu|petrol|fuel|parking|auto|transport|fare/i.test(d)) return 'transport';
  if (/merchant payment|buy goods/i.test(d)) return 'shopping';
  if (/transfer to|send money|customer transfer|payment to small business|customer payment|customer send money/i.test(d)) return 'transfer';
  if (/merchant|lipa na/i.test(d)) return 'shopping';
  return 'other';
}

export function extractMerchant(details: string): string {
  const patterns = [
    /Merchant Payment(?: Online)?(?: Fuliza M-Pesa)? to \d+ - (.+)$/i,
    /Pay Bill(?: Online)? to \d+ - (.+?)(?:\s+Acc\.|$)/i,
    /Customer Withdrawal At Agent Till \d+ - (.+)$/i,
    /Customer Transfer(?: Fuliza MPesa)? to - \S+ (.+)$/i,
    /Customer Payment to Small Business to - \S+ (.+)$/i,
    /Customer Send Money to Micro SME Business\s+with Fuliza MPesa to - \S+ (.+)$/i,
    /Funds received from - \S+ (.+)$/i,
    /Salary Payment from \d+ - (.+?)(?:\s+via|$)/i,
    /OD Loan Repayment to \d+ - (.+)$/i,
  ];
  for (const p of patterns) {
    const m = details.match(p);
    if (m?.[1]) return m[1].replace(/\s+Completed$/i, '').trim();
  }
  return details.slice(0, 48).trim();
}

function makeTx(partial: Omit<MoneyTx, 'category' | 'merchant' | 'emoji' | 'avatar' | 'photo'>): MoneyTx {
  const category = classifyDetails(partial.details);
  const merchant = extractMerchant(partial.details);
  const h = hashStr(partial.id);
  return {
    ...partial,
    category,
    merchant,
    emoji: CATEGORY_META[category].emoji,
    avatar: CARTOON_AVATARS[h % CARTOON_AVATARS.length],
    photo: CATEGORY_META[category].photo,
  };
}

export function parseMpesaText(raw: string) {
  const periodMatch = raw.match(/Statement Period:\s*([0-9]{2} \w+ \d{4}\s*-\s*[0-9]{2} \w+ \d{4})/i);
  const period = periodMatch?.[1]?.replace(/\s+/g, ' ').trim();

  const byType: Record<string, { in: number; out: number }> = {};
  const typeBlock = raw.match(/TRANSACTION TYPE\s+PAID IN\s+PAID OUT([\s\S]*?)TOTAL:/i);
  if (typeBlock) {
    const re = /([A-Z][A-Z0-9 \/\(\)\-]+?):\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
    let tm: RegExpExecArray | null;
    while ((tm = re.exec(typeBlock[1]))) {
      byType[tm[1].trim()] = { in: num(tm[2]), out: num(tm[3]) };
    }
  }
  const totalMatch = raw.match(/TOTAL:\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
  const summary = {
    paidIn: totalMatch ? num(totalMatch[1]) : 0,
    paidOut: totalMatch ? num(totalMatch[2]) : 0,
    byType,
  };

  // Receipt · time · details · Completed · amount · balance
  const rowRe =
    /\b([A-Z0-9]{10})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)\s+Completed\s+(-?[\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;

  const txs: MoneyTx[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(raw))) {
    const receipt = m[1];
    const time = m[2].replace(' ', 'T');
    const details = m[3].replace(/\s+/g, ' ').trim();
    const money = num(m[4]);
    const balance = num(m[5]);
    const key = `${receipt}|${time}|${details}|${money}|${balance}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let paidIn = 0;
    let withdrawn = 0;
    if (money < 0) withdrawn = Math.abs(money);
    else if (/funds received|salary|agent deposit|overdraft of credit|reversal|received from/i.test(details)) paidIn = money;
    else if (/charge|payment|transfer|pay bill|merchant|withdrawal|loan|send money|customer|od loan/i.test(details)) withdrawn = money;
    else paidIn = money;

    txs.push(makeTx({
      id: `${receipt}_${time}_${hashStr(key)}`,
      receipt,
      time,
      details,
      status: 'Completed',
      paidIn,
      withdrawn,
      balance,
    }));
  }

  txs.sort((a, b) => b.time.localeCompare(a.time));
  if (!summary.paidIn && !summary.paidOut) {
    summary.paidIn = txs.reduce((s, t) => s + t.paidIn, 0);
    summary.paidOut = txs.reduce((s, t) => s + t.withdrawn, 0);
  }
  return { txs, period, summary };
}

export async function extractPdfText(file: ArrayBuffer | Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  const data = file instanceof Uint8Array ? file : new Uint8Array(file);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  return parts.join('\n');
}

export async function parseMpesaPdf(file: ArrayBuffer | Uint8Array) {
  const text = await extractPdfText(file);
  return parseMpesaText(text);
}
