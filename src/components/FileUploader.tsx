import React from 'react';

interface FileUploaderProps {
  icon: React.ReactNode;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  directory?: boolean;
}

export function FileUploader({ icon, label, onChange, directory }: FileUploaderProps) {
  return (
    <label className="block w-full cursor-pointer">
      <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <input
        type="file"
        className="hidden"
        onChange={onChange}
        multiple
        {...(directory ? { webkitdirectory: "true", directory: "" } : {})}
      />
    </label>
  );
}