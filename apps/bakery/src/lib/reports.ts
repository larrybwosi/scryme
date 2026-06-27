import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { isTauri } from "./sdk";

export const saveReport = async (
  filename: string,
  content: string | Uint8Array,
) => {
  if (!isTauri()) {
    // Web fallback: download file
    const blob = new Blob([content as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const filePath = await save({
      defaultPath: filename,
    });

    if (filePath) {
      const data =
        typeof content === "string"
          ? new TextEncoder().encode(content)
          : content;
      await writeFile(filePath, data);
      return true;
    }
  } catch (error) {
    console.error("Failed to save report:", error);
    throw error;
  }
  return false;
};
