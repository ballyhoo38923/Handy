import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  getKeyName,
  formatKeyCombination,
  normalizeKey,
} from "../../lib/utils/keyboard";
import { useOsType } from "../../hooks/useOsType";
import { commands } from "@/bindings";
import { toast } from "sonner";

interface PromptHotkeyInputProps {
  promptId: string;
  currentBinding: string | null;
  onBindingChanged: (binding: string | null) => void;
}

export const PromptHotkeyInput: React.FC<PromptHotkeyInputProps> = ({
  promptId,
  currentBinding,
  onBindingChanged,
}) => {
  const { t } = useTranslation();
  const osType = useOsType();
  const [recording, setRecording] = useState(false);
  const [keyPressed, setKeyPressed] = useState<string[]>([]);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recording) return;

    let cleanup = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (cleanup) return;
      if (e.repeat) return;
      if (e.key === "Escape") {
        setRecording(false);
        setKeyPressed([]);
        setRecordedKeys([]);
        return;
      }
      e.preventDefault();

      const rawKey = getKeyName(e, osType);
      const key = normalizeKey(rawKey);

      if (!keyPressed.includes(key)) {
        setKeyPressed((prev) => [...prev, key]);
        if (!recordedKeys.includes(key)) {
          setRecordedKeys((prev) => [...prev, key]);
        }
      }
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      if (cleanup) return;
      e.preventDefault();

      const rawKey = getKeyName(e, osType);
      const key = normalizeKey(rawKey);

      setKeyPressed((prev) => prev.filter((k) => k !== key));

      const updatedKeyPressed = keyPressed.filter((k) => k !== key);
      if (updatedKeyPressed.length === 0 && recordedKeys.length > 0) {
        const modifiers = [
          "ctrl",
          "control",
          "shift",
          "alt",
          "option",
          "meta",
          "command",
          "cmd",
          "super",
          "win",
          "windows",
        ];
        const sortedKeys = recordedKeys.sort((a, b) => {
          const aIsModifier = modifiers.includes(a.toLowerCase());
          const bIsModifier = modifiers.includes(b.toLowerCase());
          if (aIsModifier && !bIsModifier) return -1;
          if (!aIsModifier && bIsModifier) return 1;
          return 0;
        });
        const newBinding = sortedKeys.join("+");

        try {
          await commands.setPromptBinding(promptId, newBinding);
          onBindingChanged(newBinding);
        } catch (error) {
          console.error("Failed to set prompt binding:", error);
          toast.error(String(error));
        }

        setRecording(false);
        setKeyPressed([]);
        setRecordedKeys([]);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        cleanup ||
        !containerRef.current ||
        containerRef.current.contains(e.target as Node)
      )
        return;
      setRecording(false);
      setKeyPressed([]);
      setRecordedKeys([]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleClickOutside);

    return () => {
      cleanup = true;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [recording, keyPressed, recordedKeys, promptId, osType, onBindingChanged]);

  const handleClear = async () => {
    try {
      await commands.setPromptBinding(promptId, null);
      onBindingChanged(null);
    } catch (error) {
      console.error("Failed to clear prompt binding:", error);
      toast.error(String(error));
    }
  };

  const formatCurrentKeys = (): string => {
    if (recordedKeys.length === 0) return t("settings.general.shortcut.pressKeys", "Press keys...");
    return formatKeyCombination(recordedKeys.join("+"), osType);
  };

  return (
    <div className="flex items-center gap-2" ref={containerRef}>
      {recording ? (
        <div className="px-2 py-1 text-sm font-semibold border border-logo-primary bg-logo-primary/30 rounded-md">
          {formatCurrentKeys()}
        </div>
      ) : (
        <div
          className="px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 hover:bg-logo-primary/10 rounded-md cursor-pointer hover:border-logo-primary"
          onClick={() => setRecording(true)}
        >
          {currentBinding
            ? formatKeyCombination(currentBinding, osType)
            : t("settings.postProcessing.prompts.hotkeyNotSet", "Not set")}
        </div>
      )}
      {currentBinding && !recording && (
        <button
          onClick={handleClear}
          className="p-1 rounded hover:bg-mid-gray/10 transition-colors text-mid-gray hover:text-red-400"
          title={t("settings.postProcessing.prompts.hotkeyClear", "Clear hotkey")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
