"use client";

import { useId, useState } from "react";

type Props = {
  name: string;
  multiple?: boolean;
  existingName?: string | null;
  onChange?: (fileName: string | null) => void;
};

export function FilePicker({ name, multiple, existingName, onChange }: Props) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(existingName || null);

  return (
    <div className="mt-1">
      <input
        id={id}
        type="file"
        name={name}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const next = files.length ? files.map((file) => file.name).join(", ") : null;
          setFileName(next);
          onChange?.(next);
        }}
      />
      <label
        htmlFor={id}
        className={
          fileName
            ? "inline-flex w-fit max-w-full cursor-pointer rounded-md border border-forest bg-forest-soft px-2.5 py-1 text-sm text-forest hover:bg-forest-soft"
            : "inline-flex w-fit cursor-pointer rounded-md border border-dashed border-gold bg-gold-soft px-2.5 py-1 text-sm font-medium text-[#7a5b1e] hover:border-forest"
        }
      >
        {fileName ?? "Chưa chọn tệp"}
      </label>
    </div>
  );
}
