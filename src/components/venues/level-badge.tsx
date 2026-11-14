import { FlameIcon, MartiniIcon, MusicIcon, CircleHelpIcon } from "lucide-react";
import { LEVEL_LABELS, type Level } from "@/types/venue";
import { cn } from "@/lib/utils";

export const LEVEL_ICON = { 0: CircleHelpIcon, 1: MartiniIcon, 2: MusicIcon, 3: FlameIcon } as const;

export const LEVEL_TEXT_CLASS: Record<Level, string> = {
  0: "text-level-0",
  1: "text-level-1",
  2: "text-level-2",
  3: "text-level-3",
};

export const LEVEL_BG_CLASS: Record<Level, string> = {
  0: "bg-level-0/15",
  1: "bg-level-1/15",
  2: "bg-level-2/15",
  3: "bg-level-3/15",
};

/** Etiqueta del semáforo con ícono, color y texto (no depende solo del color). */
export function LevelBadge({ level, queue, className }: { level: Level; queue?: boolean; className?: string }) {
  const Icon = LEVEL_ICON[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", LEVEL_TEXT_CLASS[level], className)}>
      <Icon className="size-4" aria-hidden="true" />
      {LEVEL_LABELS[level]}
      {queue && level > 0 ? <span className="font-normal text-muted-foreground">· hay fila</span> : null}
    </span>
  );
}
