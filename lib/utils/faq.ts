export type AnswerSegment =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "list";
      content: string[];
    };

export const buildAnswerSegments = (lines: string[]): AnswerSegment[] => {
  const segments: AnswerSegment[] = [];
  let currentList: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith("-")) {
      const cleaned = line.replace(/^-\s*/, "");
      if (!currentList) {
        currentList = [cleaned];
        segments.push({ type: "list", content: currentList });
      } else {
        currentList.push(cleaned);
      }
      continue;
    }

    currentList = null;
    segments.push({ type: "text", content: line });
  }

  return segments;
};
