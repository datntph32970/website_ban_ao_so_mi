import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VariantImageDropzoneProps {
  colorId: string;
  images: File[];
  setImages: (files: File[]) => void;
  onPreview: (url: string) => void;
  defaultProductImage?: { colorId: string, fileName: string } | null;
  setDefaultProductImage?: (fileName: string | null) => void;
  variantImages?: Record<string, File[]>;
}

function SortableImage({ file, onPreview, onRemove, defaultProductImage, setDefaultProductImage, colorId }: { 
  file: File; 
  onPreview: (url: string) => void; 
  onRemove: () => void;
  defaultProductImage?: { colorId: string, fileName: string } | null;
  setDefaultProductImage?: (fileName: string | null) => void;
  colorId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.name });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const url = URL.createObjectURL(file);
  const isDefault = defaultProductImage && defaultProductImage.colorId === colorId && defaultProductImage.fileName === file.name;
  return (
    <div ref={setNodeRef} style={style} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-2 cursor-move" {...attributes} {...listeners} />
      <img
        src={url}
        alt="Ảnh màu"
        className="object-cover w-full h-full cursor-pointer"
        onClick={() => onPreview(url)}
      />
      <span
        className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer shadow border-2 border-white p-0.5"
        title="Xóa ảnh"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ transform: 'translate(30%, -30%)' }}
      >×</span>
      {setDefaultProductImage && (
        <span
          className={`absolute bottom-1 left-1 z-10 cursor-pointer ${isDefault ? 'text-yellow-400' : 'text-slate-300'}`}
          title="Chọn làm ảnh mặc định sản phẩm"
          onClick={e => { e.stopPropagation(); setDefaultProductImage(file.name); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isDefault ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </span>
      )}
    </div>
  );
}

export default function VariantImageDropzone({ colorId, images, setImages, onPreview, defaultProductImage, setDefaultProductImage, variantImages }: VariantImageDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    setImages([...(images || []), ...acceptedFiles]);
    if (inputRef.current) inputRef.current.value = '';
  }, [images, setImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...(images || []), ...Array.from(e.target.files)]);
      e.target.value = '';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(file => file.name === active.id);
      const newIndex = images.findIndex(file => file.name === over.id);
      setImages(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map(file => file.name)}
          strategy={verticalListSortingStrategy}
        >
          {images && images.length > 0 && images.map((file: File) => (
            <SortableImage
              key={file.name}
              file={file}
              onPreview={onPreview}
              onRemove={() => setImages(images.filter(f => f !== file))}
              defaultProductImage={defaultProductImage}
              setDefaultProductImage={setDefaultProductImage}
              colorId={colorId}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <div
        {...getRootProps()}
        className={cn(
          "w-14 h-14 rounded-lg flex items-center justify-center border-2 border-dashed cursor-pointer transition bg-slate-100 border-slate-200 hover:border-blue-400",
          isDragActive ? "border-blue-500 bg-blue-50" : ""
        )}
        title="Kéo thả ảnh hoặc bấm để chọn ảnh"
      >
        <ImageIcon className="w-6 h-6 text-slate-400" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
          title="Chọn ảnh"
          {...getInputProps()}
        />
      </div>
    </div>
  );
} 