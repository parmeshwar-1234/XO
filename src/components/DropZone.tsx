import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  label = 'Drop your image here',
  sublabel = 'or click to browse',
}) => {
  const [dragging, setDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragging(true);
    else if (e.type === 'dragleave') setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFilesSelected(multiple ? files : [files[0]]);
    },
    [onFilesSelected, multiple]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFilesSelected(files);
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <label
      className={`upload-zone flex flex-col items-center justify-center gap-3 sm:gap-4 p-6 sm:p-12 text-center ${dragging ? 'dragging' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        {dragging ? (
          <ImageIcon className="w-8 h-8 text-primary animate-pulse" />
        ) : (
          <Upload className="w-8 h-8 text-primary" />
        )}
      </div>
      <div>
        <p className="text-base sm:text-lg font-medium text-foreground">{label}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{sublabel}</p>
      </div>
    </label>
  );
};

export default DropZone;
