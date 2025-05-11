"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// This is a workaround for react-beautiful-dnd not working with React 18
// See: https://github.com/atlassian/react-beautiful-dnd/issues/2672
export function DndWrapper({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}

export { DragDropContext, Droppable, Draggable }; 