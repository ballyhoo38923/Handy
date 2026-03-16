import React from "react";
import { useTranslation } from "react-i18next";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { useSettings } from "../../hooks/useSettings";

interface ShowPostProcessDiffToggleProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

export const ShowPostProcessDiffToggle: React.FC<ShowPostProcessDiffToggleProps> =
  React.memo(({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();

    const enabled = getSetting("show_post_process_diff") || false;

    return (
      <ToggleSwitch
        checked={enabled}
        onChange={(enabled) =>
          updateSetting("show_post_process_diff", enabled)
        }
        isUpdating={isUpdating("show_post_process_diff")}
        label={t("settings.postProcessing.diffToggle.label", "Show diff after post-processing")}
        description={t(
          "settings.postProcessing.diffToggle.description",
          "Show a side-by-side comparison of raw vs processed text after each transcription"
        )}
        descriptionMode={descriptionMode}
        grouped={grouped}
      />
    );
  });
