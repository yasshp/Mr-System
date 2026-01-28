import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import KanbanCard from './KanbanCard';
import { motion } from 'framer-motion';

export default function KanbanBoard({ pending, completed, onStatusUpdate }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    // If dropped in different column
    if (active.data.current.sortable.containerId !== over.id) {
      const taskId = active.id;
      const newStatus = over.id === 'completed' ? 'Done' : 'Pending';
      onStatusUpdate(taskId, newStatus);
    }
    // Within same column reordering can be implemented later if needed
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 bg-amber-50 dark:bg-amber-950/30">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Upcoming Tasks ({pending.length})
            </h2>
          </div>
          <SortableContext id="pending" items={pending.map(t => t.activity_id)} strategy={verticalListSortingStrategy}>
            <div className="p-4 space-y-4 min-h-[400px]">
              {pending.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No pending tasks for today
                </div>
              ) : (
                pending.map(task => (
                  <KanbanCard 
                    key={task.activity_id} 
                    task={task} 
                    column="pending"
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>

        {/* Completed Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 bg-green-50 dark:bg-green-950/30">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Completed ({completed.length})
            </h2>
          </div>
          <SortableContext id="completed" items={completed.map(t => t.activity_id)} strategy={verticalListSortingStrategy}>
            <div className="p-4 space-y-4 min-h-[400px]">
              {completed.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No completed tasks yet
                </div>
              ) : (
                completed.map(task => (
                  <KanbanCard 
                    key={task.activity_id} 
                    task={task} 
                    column="completed"
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}