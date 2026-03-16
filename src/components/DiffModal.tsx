import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface DiffModalProps {
  raw: string;
  processed: string;
  onClose: () => void;
}

type DiffToken = { text: string; type: "equal" | "removed" | "added" };

/**
 * Simple word-level diff using longest common subsequence.
 */
function wordDiff(a: string, b: string): DiffToken[] {
  const wordsA = a.split(/(\s+)/);
  const wordsB = b.split(/(\s+)/);

  // LCS table
  const m = wordsA.length;
  const n = wordsB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const tokens: DiffToken[] = [];
  let i = m,
    j = n;

  const result: DiffToken[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
      result.push({ text: wordsA[i - 1], type: "equal" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ text: wordsB[j - 1], type: "added" });
      j--;
    } else {
      result.push({ text: wordsA[i - 1], type: "removed" });
      i--;
    }
  }

  result.reverse();

  // Merge consecutive tokens of the same type
  for (const token of result) {
    if (tokens.length > 0 && tokens[tokens.length - 1].type === token.type) {
      tokens[tokens.length - 1].text += token.text;
    } else {
      tokens.push({ ...token });
    }
  }

  return tokens;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  raw,
  processed,
  onClose,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const tokens = wordDiff(raw, processed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background border border-mid-gray/20 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-mid-gray/20">
          <h2 className="text-sm font-semibold">Post-Processing Diff</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-mid-gray/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diff content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {tokens.map((token, i) => {
              if (token.type === "removed") {
                return (
                  <span
                    key={i}
                    className="bg-red-500/20 text-red-400 line-through"
                  >
                    {token.text}
                  </span>
                );
              }
              if (token.type === "added") {
                return (
                  <span key={i} className="bg-green-500/20 text-green-400">
                    {token.text}
                  </span>
                );
              }
              return <span key={i}>{token.text}</span>;
            })}
          </div>
        </div>

        {/* Footer legend */}
        <div className="px-4 py-2 border-t border-mid-gray/20 flex gap-4 text-xs text-mid-gray">
          <span>
            <span className="inline-block w-3 h-3 rounded bg-red-500/20 mr-1 align-middle" />
            Removed
          </span>
          <span>
            <span className="inline-block w-3 h-3 rounded bg-green-500/20 mr-1 align-middle" />
            Added
          </span>
        </div>
      </div>
    </div>
  );
};
