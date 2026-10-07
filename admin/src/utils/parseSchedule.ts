export type ScheduleTaskStatus = 'DONE_ON_TIME' | 'DONE_LATE' | 'SKIPPED' | 'PENDING';

export interface ParsedScheduleTask {
  id: string;
  dayNumber: number;
  taskTitle: string;
  dueDateStr: string;
  dueDateObj: Date;
  status: ScheduleTaskStatus;
  completedDate?: string;
  skipReason?: string;
  autoSkipped?: boolean;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses date strings like "15 Nov 2025" (the format this app writes schedule dates in) or ISO strings. */
function parseDateLoose(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === parts[1].substring(0, 3).toLowerCase());
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function calculateTaskDateObj(plantationDate: Date, dayNumber: number): Date {
  const d = new Date(plantationDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
}

function formatDateStr(dateObj: Date): string {
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const dateOnly = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Parses the free-text `assignedSchedule` blob (lines like
 * "[Day 3 · 17 Oct 2026]: Task (✔️ DONE: Done on 10 Aug 2026)" or "(⏭️ SKIPPED: reason)")
 * into structured rows, classifying completed tasks as on-time vs late against their due date.
 */
export function parseScheduleText(scheduleText: string | undefined, sowingDate?: string): ParsedScheduleTask[] {
  if (!scheduleText || !scheduleText.trim()) return [];

  const plantDateObj = parseDateLoose(sowingDate) ?? new Date();
  const lines = scheduleText.split('\n');
  const tasks: ParsedScheduleTask[] = [];

  lines.forEach((line, idx) => {
    if (!line.trim()) return;

    const match = line.match(/\[?Day\s*(\d+).*?\]?:\s*(.*)/i);
    let dayNumber = (idx + 1) * 3;
    let taskTitle = line.trim();

    if (match) {
      dayNumber = parseInt(match[1], 10) || dayNumber;
      taskTitle = match[2].trim();
    }

    const dueDateObj = calculateTaskDateObj(plantDateObj, dayNumber);
    const dueDateStr = formatDateStr(dueDateObj);

    let status: ScheduleTaskStatus = 'PENDING';
    let completedDate: string | undefined;
    let skipReason: string | undefined;
    let autoSkipped = false;

    if (taskTitle.includes('DONE')) {
      const doneMatch = taskTitle.match(/Done on (.*?)\)/i);
      completedDate = doneMatch?.[1];
      taskTitle = taskTitle.replace(/\s*\((✔️|✅)?\s*DONE.*?\)/i, '').replace(/(✔️|✅)?\s*DONE:\s*/i, '');

      const completedDateObj = parseDateLoose(completedDate);
      status = completedDateObj && dateOnly(completedDateObj) > dateOnly(dueDateObj) ? 'DONE_LATE' : 'DONE_ON_TIME';
    } else if (taskTitle.includes('SKIPPED')) {
      status = 'SKIPPED';
      if (taskTitle.includes('Auto-Skipped')) autoSkipped = true;
      const skipMatch = taskTitle.match(/SKIPPED:\s*(.*?)\)/i);
      skipReason = skipMatch?.[1];
      taskTitle = taskTitle.replace(/\s*\((⏭️)?\s*SKIPPED.*?\)/i, '').replace(/(⏭️)?\s*SKIPPED:\s*/i, '');
    }

    tasks.push({
      id: `task_${idx}_${dayNumber}`,
      dayNumber,
      taskTitle: taskTitle.trim(),
      dueDateStr,
      dueDateObj,
      status,
      completedDate,
      skipReason,
      autoSkipped,
    });
  });

  return tasks.sort((a, b) => a.dayNumber - b.dayNumber);
}
