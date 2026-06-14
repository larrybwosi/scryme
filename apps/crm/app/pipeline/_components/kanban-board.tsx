"use client";

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStart,
  DragOver,
  DragEnd,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { Deal } from '../types';

interface KanbanBoardProps {
  deals: any[];
  onDealUpdate: (dealId: string, updates: any) => Promise<void>;
}

const STAGES = [
  { id: 'discovery', title: 'Discovery' },
  { id: 'qualification', title: 'Qualification' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'closed_won', title: 'Closed Won' },
  { id: 'closed_lost', title: 'Closed Lost' },
];

export function KanbanBoard({ deals, onDealUpdate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dealsByStage = useMemo(() => {
    const map: Record<string, any[]> = {};
    STAGES.forEach(stage => map[stage.id] = []);
    deals.forEach(deal => {
      const stage = deal.data.stage || 'discovery';
      if (map[stage]) {
        map[stage].push(deal);
      }
    });
    return map;
  }, [deals]);

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === activeId),
    [activeId, deals]
  );

  const handleDragStart = (event: DragStart) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEnd) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped over a column or a card in a different column
    const deal = deals.find(d => d.id === activeId);
    if (!deal) return;

    let newStage = overId;
    if (!STAGES.find(s => s.id === overId)) {
        // Dropped over a card, get its stage
        const overDeal = deals.find(d => d.id === overId);
        if (overDeal) {
            newStage = overDeal.data.stage;
        }
    }

    if (deal.data.stage !== newStage) {
        await onDealUpdate(activeId, { stage: newStage });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4 custom-scrollbar">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            id={stage.id}
            title={stage.title}
            count={dealsByStage[stage.id].length}
          >
            <SortableContext
              items={dealsByStage[stage.id].map(d => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {dealsByStage[stage.id].map((deal) => (
                  <KanbanCard key={deal.id} deal={deal} />
                ))}
              </div>
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeId && activeDeal ? (
          <KanbanCard deal={activeDeal} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
