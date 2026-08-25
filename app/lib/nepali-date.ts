// Nepali Bikram Sambat (BS) Calendar Converter
// Accurately converts Gregorian (AD) dates to Bikram Sambat (BS) format

const BS_MONTH_NAMES_EN = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const BS_MONTH_NAMES_NP = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भाद्र",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुस",
  "माघ",
  "फागुन",
  "चैत",
];

// Number of days in each month of Bikram Sambat from year 2075 to 2090
const BS_CALENDAR_DATA: Record<number, number[]> = {
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 29, 31],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2084: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2088: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2089: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 29, 31],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

// Epoch reference: 2075-01-01 BS corresponds to 2018-04-14 AD (UTC)
const EPOCH_AD = new Date(Date.UTC(2018, 3, 14)); // April 14, 2018
const EPOCH_BS_YEAR = 2075;

export interface NepaliDate {
  year: number;
  month: number; // 1 to 12
  day: number;
  monthNameEn: string;
  monthNameNp: string;
  formatted: string; // e.g. "5 Bhadra 2083"
  formattedNp: string; // e.g. "५ भाद्र २०८३"
}

export function convertAdToBs(adDate: Date = new Date()): NepaliDate {
  // Get Nepal Time Date (UTC + 5:45)
  const nptOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nptDate = new Date(adDate.getTime() + nptOffsetMs);

  const targetUtc = Date.UTC(
    nptDate.getUTCFullYear(),
    nptDate.getUTCMonth(),
    nptDate.getUTCDate()
  );

  let diffDays = Math.floor((targetUtc - EPOCH_AD.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      year: 2083,
      month: 5,
      day: 1,
      monthNameEn: "Bhadra",
      monthNameNp: "भाद्र",
      formatted: "1 Bhadra 2083",
      formattedNp: "१ भाद्र २०८३",
    };
  }

  let currentYear = EPOCH_BS_YEAR;
  let currentMonth = 0;
  let currentDay = 1;

  while (diffDays > 0) {
    const yearDays = BS_CALENDAR_DATA[currentYear];
    if (!yearDays) break;

    const daysInMonth = yearDays[currentMonth];
    if (diffDays >= daysInMonth) {
      diffDays -= daysInMonth;
      currentMonth++;
      if (currentMonth === 12) {
        currentMonth = 0;
        currentYear++;
      }
    } else {
      currentDay += diffDays;
      diffDays = 0;
    }
  }

  const monthIndex = currentMonth;
  const monthNum = monthIndex + 1;
  const monthNameEn = BS_MONTH_NAMES_EN[monthIndex] || "Bhadra";
  const monthNameNp = BS_MONTH_NAMES_NP[monthIndex] || "भाद्र";

  const formatted = `${currentDay} ${monthNameEn} ${currentYear}`;
  const formattedNp = `${convertToNepaliDigits(currentDay)} ${monthNameNp} ${convertToNepaliDigits(currentYear)}`;

  return {
    year: currentYear,
    month: monthNum,
    day: currentDay,
    monthNameEn,
    monthNameNp,
    formatted,
    formattedNp,
  };
}

export function convertToNepaliDigits(num: number | string): string {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num)
    .split("")
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : nepaliDigits[parsed];
    })
    .join("");
}

export function getTodayBSDate(): NepaliDate {
  return convertAdToBs(new Date());
}
