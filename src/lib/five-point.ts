/**
 * 「5点」チェックの定義と、詳細欄へ差し込むテキストの組み立て。
 *
 * - 5点そろっていれば「5点OK」
 * - 1つでも欠けていれば「⚠️3点OK」のように ⚠️ 付きで点数を出し、
 *   欠けている項目（と自由記入があればその内容）を並べる
 */

export const FIVE_POINT_ITEMS = [
  { key: "fivePointAbKuro", noteKey: "fivePointAbKuroNote", label: "ABクロ" },
  { key: "fivePointMeisai", noteKey: "fivePointMeisaiNote", label: "明細" },
  { key: "fivePointTableChair", noteKey: "fivePointTableChairNote", label: "テーブル・椅子" },
  { key: "fivePointExplainTime", noteKey: "fivePointExplainTimeNote", label: "説明時間" },
  { key: "fivePointSokketsu", noteKey: "fivePointSokketsuNote", label: "即決" }
] as const;

export const FIVE_POINT_TOTAL = FIVE_POINT_ITEMS.length;

export type FivePointKey = (typeof FIVE_POINT_ITEMS)[number]["key"];
export type FivePointNoteKey = (typeof FIVE_POINT_ITEMS)[number]["noteKey"];

export type FivePointState = Partial<Record<FivePointKey, boolean>> &
  Partial<Record<FivePointNoteKey, string | null>>;

/** チェックが入っている項目数 */
export function countFivePoint(state: FivePointState): number {
  return FIVE_POINT_ITEMS.filter((item) => state[item.key]).length;
}

/**
 * 詳細欄に差し込むテキストを組み立てる。
 * 1件もチェックが無く自由記入も無い＝未入力とみなし、null を返す（詳細を汚さない）。
 */
export function buildFivePointText(state: FivePointState): string | null {
  const checked = countFivePoint(state);
  const notes = FIVE_POINT_ITEMS.map((item) => (state[item.noteKey] ?? "").trim());
  const hasAnyNote = notes.some(Boolean);

  if (checked === 0 && !hasAnyNote) return null;

  // 満点のときだけ ⚠️ を付けない
  const heading = checked === FIVE_POINT_TOTAL ? "5点OK" : `⚠️${checked}点OK`;
  const lines = [heading];

  FIVE_POINT_ITEMS.forEach((item, index) => {
    const note = notes[index];
    const isNg = !state[item.key];

    // NG の項目は必ず出す。OK でも自由記入があれば残す
    if (!isNg && !note) return;

    // NG は「・」、OK なのに記入がある場合は「✓」で区別する
    const mark = isNg ? "・" : "✓";
    lines.push(note ? `${mark}${item.label}：${note}` : `${mark}${item.label}`);
  });

  return lines.join("\n");
}

/**
 * 詳細本文の末尾に5点テキストを追記した結果を返す。
 * 以前に追記した5点ブロックがあれば、それを取り除いてから付け直す
 * （チェックを変えるたびに積み重ならないようにするため）。
 */
export function applyFivePointToDetail(
  detail: string,
  nextText: string | null,
  previousText: string | null
): string {
  let base = detail;

  if (previousText) {
    const index = base.lastIndexOf(previousText);
    if (index !== -1) {
      base = base.slice(0, index) + base.slice(index + previousText.length);
    }
  }

  base = base.replace(/\s+$/, "");

  if (!nextText) return base;
  return base ? `${base}\n\n${nextText}` : nextText;
}
