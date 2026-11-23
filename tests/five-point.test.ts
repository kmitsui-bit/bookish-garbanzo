import { describe, expect, it } from "vitest";
import { applyFivePointToDetail, buildFivePointText, countFivePoint } from "@/lib/five-point";

const allChecked = {
  fivePointAbKuro: true,
  fivePointMeisai: true,
  fivePointTableChair: true,
  fivePointExplainTime: true,
  fivePointSokketsu: true
};

describe("buildFivePointText", () => {
  it("5点そろっていれば「5点OK」だけを出す", () => {
    expect(buildFivePointText(allChecked)).toBe("5点OK");
  });

  it("欠けていれば ⚠️ と点数、NG項目を並べる", () => {
    const text = buildFivePointText({
      ...allChecked,
      fivePointMeisai: false,
      fivePointTableChair: false
    });

    expect(text).toBe("⚠️3点OK\n・明細\n・テーブル・椅子");
  });

  it("NG項目に自由記入があれば併記する", () => {
    const text = buildFivePointText({
      ...allChecked,
      fivePointMeisai: false,
      fivePointMeisaiNote: "領収書のみ",
      fivePointTableChair: false,
      fivePointTableChairNote: "椅子が2脚しかない"
    });

    expect(text).toBe("⚠️3点OK\n・明細：領収書のみ\n・テーブル・椅子：椅子が2脚しかない");
  });

  it("4点以下は必ず ⚠️ が付き、5点のときは付かない", () => {
    expect(buildFivePointText({ ...allChecked, fivePointSokketsu: false })).toContain("⚠️4点OK");
    expect(buildFivePointText(allChecked)?.startsWith("⚠️")).toBe(false);
  });

  it("0点でも ⚠️0点OK と全項目を出す", () => {
    const text = buildFivePointText({ fivePointAbKuroNote: "未確認" });

    expect(text).toBe(
      "⚠️0点OK\n・両クロ：未確認\n・明細\n・テーブル・椅子\n・説明時間\n・即決"
    );
  });

  it("OK なのに記入がある項目は ✓ で残す", () => {
    const text = buildFivePointText({ ...allChecked, fivePointSokketsuNote: "来週決める予定" });

    expect(text).toBe("5点OK\n✓即決：来週決める予定");
  });

  it("未入力（チェックも記入も無し）なら null", () => {
    expect(buildFivePointText({})).toBeNull();
  });

  it("countFivePoint はチェック数を返す", () => {
    expect(countFivePoint(allChecked)).toBe(5);
    expect(countFivePoint({ ...allChecked, fivePointMeisai: false })).toBe(4);
    expect(countFivePoint({})).toBe(0);
  });
});

describe("applyFivePointToDetail", () => {
  it("手入力の文章を残したまま末尾に追記する", () => {
    const result = applyFivePointToDetail("非常に温厚な夫婦だった。", "5点OK", null);

    expect(result).toBe("非常に温厚な夫婦だった。\n\n5点OK");
  });

  it("チェックを変えても積み重ならず置き換わる", () => {
    const first = applyFivePointToDetail("メモ", "⚠️4点OK\n・即決", null);
    const second = applyFivePointToDetail(first, "5点OK", "⚠️4点OK\n・即決");

    expect(second).toBe("メモ\n\n5点OK");
  });

  it("詳細が空なら5点テキストだけになる", () => {
    expect(applyFivePointToDetail("", "5点OK", null)).toBe("5点OK");
  });

  it("全解除したら追記分だけが消え、手入力は残る", () => {
    const withText = applyFivePointToDetail("メモ", "5点OK", null);

    expect(applyFivePointToDetail(withText, null, "5点OK")).toBe("メモ");
  });

  it("手入力が5点ブロックの後ろに足されていても壊さない", () => {
    const detail = "メモ\n\n⚠️4点OK\n・即決";
    const edited = `${detail}\n\nあとから書いた追記`;

    const result = applyFivePointToDetail(edited, "5点OK", "⚠️4点OK\n・即決");

    expect(result).toContain("メモ");
    expect(result).toContain("あとから書いた追記");
    expect(result.endsWith("5点OK")).toBe(true);
  });
});
