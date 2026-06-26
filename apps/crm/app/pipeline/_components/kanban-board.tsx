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
  type DragStartEvent as DragStart,
  type DragEndEvent as DragEnd,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn, STAGE_CONFIGS } from './kanban-column';
import { KanbanCard } from './kanban-card';

interface KanbanBoardProps {
  deals: any[];
  onDealUpdate: (dealId: string, updates: any) => Promise<void>;
  onAddDeal?: (stage: string) => void;
}

export function KanbanBoard({ deals, onDealUpdate, onAddDeal }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dealsByStage = useMemo(() => {
    const map: Record<string, any[]> = {};
    STAGE_CONFIGS.forEach((s) => (map[s.id] = []));
    deals.forEach((deal) => {
      const stage = deal.data.stage || 'discovery';
      if (map[stage]) map[stage].push(deal);
    });
    return map;
  }, [deals]);

  const stageValues = useMemo(() => {
    const map: Record<string, number> = {};
    STAGE_CONFIGS.forEach((s) => (map[s.id] = 0));
    deals.forEach((deal) => {
      const stage = deal.data.stage || 'discovery';
      if (map[stage] !== undefined) {
        map[stage] += Number(deal.data.amount) || 0;
      }
    });
    return map;
  }, [deals]);

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === activeId),
    [activeId, deals]
  );

  const activeStageConfig = useMemo(() => {
    if (!activeDeal) return STAGE_CONFIGS[0];
    return STAGE_CONFIGS.find((s) => s.id === (activeDeal.data.stage || 'discovery')) || STAGE_CONFIGS[0];
  }, [activeDeal]);

  const handleDragStart = (event: DragStart) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEnd) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const deal = deals.find((d) => d.id === activeId);
    if (!deal) return;

    let newStage = overId;
    // If dropped over a card (not a column), look up that card's stage
    if (!STAGE_CONFIGS.find((s) => s.id === overId)) {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) newStage = overDeal.data.stage;
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
      {/* Horizontally scrollable board with snap on mobile */}
      <div className="flex gap-3 h-full pb-4 overflow-x-auto custom-scrollbar snap-x snap-mandatory md:snap-none">
        {STAGE_CONFIGS.map((stageConfig) => (
          <div
            key={stageConfig.id}
            className="snap-start flex-shrink-0"
          >
            <KanbanColumn
              id={stageConfig.id}
              title={stageConfig.title}
              count={dealsByStage[stageConfig.id].length}
              totalValue={stageValues[stageConfig.id]}
              stageConfig={stageConfig}
              onAddDeal={onAddDeal ? () => onAddDeal(stageConfig.id) : undefined}
            >
              <SortableContext
                items={dealsByStage[stageConfig.id].map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {dealsByStage[stageConfig.id].map((deal) => (
                    <KanbanCard
                      key={deal.id}
                      deal={deal}
                      stageConfig={stageConfig}
                    />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId && activeDeal ? (
          <KanbanCard deal={activeDeal} isOverlay stageConfig={activeStageConfig} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
