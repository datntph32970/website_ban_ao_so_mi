import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VariantImageDropzoneProps {
  colorId: string;
  images: (File | string)[];
  setImages: (files: (File | string)[]) => void;
  onPreview: (url: string) => void;
  variantImages?: Record<string, (File | string)[]>;
  updateVariantImages?: (colorId: string, images: (File | string)[]) => Promise<void>;
}

function SortableImage({ file, onPreview, onRemove, images, colorId }: { 
  file: File | string; 
  onPreview: (url: string) => void; 
  onRemove: () => void;
  images: (File | string)[];
  colorId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: `${colorId}_${file instanceof File ? file.name : file}` 
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const url = file instanceof File ? URL.createObjectURL(file) : file;
  return (
    <div ref={setNodeRef} style={style} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
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
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{ transform: 'translate(30%, -30%)' }}
      >×</span>
    </div>
  );
}

export default function VariantImageDropzone({ colorId, images, setImages, onPreview, variantImages, updateVariantImages }: VariantImageDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (updateVariantImages) {
      updateVariantImages(colorId, [...images, ...acceptedFiles]);
    } else {
      setImages([...(images || []), ...acceptedFiles]);
    }
    if (inputRef.current) inputRef.current.value = '';
  }, [images, setImages, colorId, updateVariantImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (updateVariantImages) {
        updateVariantImages(colorId, [...images, ...newFiles]);
      } else {
        setImages([...(images || []), ...newFiles]);
      }
      e.target.value = '';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(file => `${colorId}_${file instanceof File ? file.name : file}` === active.id);
      const newIndex = images.findIndex(file => `${colorId}_${file instanceof File ? file.name : file}` === over.id);
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
          items={images.map(file => `${colorId}_${file instanceof File ? file.name : file}`)}
          strategy={verticalListSortingStrategy}
        >
          {images && images.length > 0 && images.map((file: File | string) => (
            <SortableImage
              key={`${colorId}_${file instanceof File ? file.name : file}`}
              file={file}
              onPreview={onPreview}
              onRemove={() => setImages(images.filter(f => f !== file))}
              images={images}
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