import { useState } from 'react';

// PTKP thresholds (2025/2026 values)
const PTKP_VALUES: Record<string, number> = {
  'TK/0': 54000000,
  'TK/1': 58500000,
  'TK/2': 63000000,
  'TK/3': 67500000,
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'pph21' | 'lembur' | 'json_b64'>('pph21');

  // PPh 21 State
  const [gajiPokok, setGajiPokok] = useState<number>(10000000);
  const [tunjangan, setTunjangan] = useState<number>(2000000);
  const [ptkpKey, setPtkpKey] = useState<string>('TK/0');
  const [isNpwp, setIsNpwp] = useState<boolean>(true);

  // Lembur & Absensi State
  const [rawAbsensi, setRawAbsensi] = useState<string>(
    "2026-03-01 08:00;17:00\n2026-03-02 08:00;19:30\n2026-03-03 08:15;18:00\n2026-03-04 07:55;17:00\n2026-03-05 08:00;21:00"
  );
  const [lemburResult, setLemburResult] = useState<{
    date: string;
    checkIn: string;
    checkOut: string;
    duration: number;
    overtimeHours: number;
    isValid: boolean;
  }[]>([]);

  // Base64 / JSON Tool State
  const [utilityInput, setUtilityInput] = useState<string>('{"nama": "Sutedjo", "divisi": "IT Support", "surat_jalan": "SJ-2026-004"}');
  const [utilityOutput, setUtilityOutput] = useState<string>('');
  const [utilityError, setUtilityError] = useState<string>('');

  // PPh 21 Calculation logic
  const calculatePph21 = () => {
    const annualGross = (gajiPokok + tunjangan) * 12;
    const biayaJabatan = Math.min(6000000, annualGross * 0.05);
    const netAnnual = annualGross - biayaJabatan;
    const ptkp = PTKP_VALUES[ptkpKey] || 54000000;
    const pkp = Math.max(0, netAnnual - ptkp);

    // Progressive tax brackets (UU HPP)
    let tax = 0;
    let remainingPkp = pkp;

    const brackets = [
      { limit: 60000000, rate: 0.05 },
      { limit: 190000000, rate: 0.15 },
      { limit: 250000000, rate: 0.25 },
      { limit: 4500000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    for (const bracket of brackets) {
      if (remainingPkp <= 0) break;
      const taxableInBracket = Math.min(remainingPkp, bracket.limit);
      tax += taxableInBracket * bracket.rate;
      remainingPkp -= taxableInBracket;
    }

    if (!isNpwp) {
      tax = tax * 1.20;
    }

    const monthlyTax = tax / 12;

    return {
      annualGross,
      biayaJabatan,
      netAnnual,
      ptkp,
      pkp,
      annualTax: tax,
      monthlyTax
    };
  };

  const pphResult = calculatePph21();

  // Parse Absensi & Lembur logic
  const handleParseAbsensi = () => {
    const lines = rawAbsensi.split('\n');
    const results = lines.map(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return null;

      const parts = cleanLine.split(';');
      if (parts.length !== 2) {
        return { date: 'Error', checkIn: '', checkOut: '', duration: 0, overtimeHours: 0, isValid: false };
      }

      const leftPart = parts[0].trim();
      const checkOutStr = parts[1].trim();

      const dateTimeParts = leftPart.split(' ');
      if (dateTimeParts.length !== 2) {
        return { date: 'Error', checkIn: '', checkOut: '', duration: 0, overtimeHours: 0, isValid: false };
      }

      const dateStr = dateTimeParts[0];
      const checkInStr = dateTimeParts[1];

      try {
        const [inH, inM] = checkInStr.split(':').map(Number);
        const [outH, outM] = checkOutStr.split(':').map(Number);

        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
          return { date: dateStr, checkIn: checkInStr, checkOut: checkOutStr, duration: 0, overtimeHours: 0, isValid: false };
        }

        const totalInMinutes = inH * 60 + inM;
        const totalOutMinutes = outH * 60 + outM;
        let diffMinutes = totalOutMinutes - totalInMinutes;

        if (diffMinutes < 0) {
          diffMinutes += 24 * 60;
        }

        const durationHours = diffMinutes / 60;
        const overtime = Math.max(0, durationHours - 9);

        return {
          date: dateStr,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          duration: parseFloat(durationHours.toFixed(2)),
          overtimeHours: parseFloat(overtime.toFixed(2)),
          isValid: true
        };
      } catch {
        return { date: 'Error', checkIn: '', checkOut: '', duration: 0, overtimeHours: 0, isValid: false };
      }
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    setLemburResult(results);
  };

  // Utilities functions
  const formatJson = () => {
    setUtilityError('');
    try {
      const parsed = JSON.parse(utilityInput);
      setUtilityOutput(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setUtilityError('Invalid JSON: ' + e.message);
    }
  };

  const minifyJson = () => {
    setUtilityError('');
    try {
      const parsed = JSON.parse(utilityInput);
      setUtilityOutput(JSON.stringify(parsed));
    } catch (e: any) {
      setUtilityError('Invalid JSON: ' + e.message);
    }
  };

  const encodeBase64 = () => {
    setUtilityError('');
    try {
      const encoded = btoa(unescape(encodeURIComponent(utilityInput)));
      setUtilityOutput(encoded);
    } catch (e: any) {
      setUtilityError('Failed to encode: ' + e.message);
    }
  };

  const decodeBase64 = () => {
    setUtilityError('');
    try {
      const decoded = decodeURIComponent(escape(atob(utilityInput)));
      setUtilityOutput(decoded);
    } catch (e: any) {
      setUtilityError('Failed to decode Base64: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-400">
              DevBox Internals
            </h1>
            <p className="text-xs text-slate-400">PT Sinergi Abadi - Backoffice & IT Utility Hub</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pph21')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pph21'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              Kalkulator PPh21
            </button>
            <button
              onClick={() => setActiveTab('lembur')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'lembur'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              Absensi & Lembur
            </button>
            <button
              onClick={() => setActiveTab('json_b64')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'json_b64'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              JSON / Base64 DevTool
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {activeTab === 'pph21' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Simulasi Pajak PPh Pasal 21 (Tahunan)</h2>
              <p className=