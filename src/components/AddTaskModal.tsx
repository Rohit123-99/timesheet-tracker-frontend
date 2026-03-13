import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { Task } from '../types';
import englishWords from 'an-array-of-english-words';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
  categories: string[];
  initialDate?: Date;
}

const MAX_NOTE_SUGGESTIONS = 8;

export function AddTaskModal({
  open,
  onOpenChange,
  onAddTask,
  categories,
  initialDate,
}: AddTaskModalProps) {
  const [taskName, setTaskName] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(initialDate ?? new Date());
  const [category, setCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showNoteSuggestions, setShowNoteSuggestions] = useState(false);
  const [noteSuggestions, setNoteSuggestions] = useState<string[]>([]);
  const [activeNoteWord, setActiveNoteWord] = useState<{ start: number; end: number } | null>(null);
  const noteContainerRef = useRef<HTMLDivElement | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(category.toLowerCase())
  );
  const dictionaryIndex = useMemo(() => {
    const index = new Map<string, string[]>();
    const words = englishWords as string[];

    for (const rawWord of words) {
      const word = rawWord.toLowerCase();
      if (!/^[a-z]{2,}$/.test(word)) continue;
      const key = word.slice(0, 2);
      const bucket = index.get(key);
      if (bucket) {
        bucket.push(word);
      } else {
        index.set(key, [word]);
      }
    }

    return index;
  }, []);

  useEffect(() => {
    if (open) {
      setDate(initialDate ?? new Date());
    }
  }, [open, initialDate]);

  useEffect(() => {
    if (!showNoteSuggestions) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (noteContainerRef.current && !noteContainerRef.current.contains(event.target as Node)) {
        setShowNoteSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNoteSuggestions]);

  const updateNoteSuggestions = (value: string, cursorPosition: number) => {
    const left = value.slice(0, cursorPosition);
    const right = value.slice(cursorPosition);
    const leftMatch = left.match(/[A-Za-z]+$/);

    if (!leftMatch) {
      setShowNoteSuggestions(false);
      setNoteSuggestions([]);
      setActiveNoteWord(null);
      return;
    }

    const currentWord = leftMatch[0];
    if (currentWord.length < 2) {
      setShowNoteSuggestions(false);
      setNoteSuggestions([]);
      setActiveNoteWord(null);
      return;
    }

    const start = cursorPosition - currentWord.length;
    const rightMatch = right.match(/^[A-Za-z]*/);
    const end = cursorPosition + (rightMatch ? rightMatch[0].length : 0);
    const prefix = currentWord.toLowerCase();

    const bucket = dictionaryIndex.get(prefix.slice(0, 2)) ?? [];
    const prefixMatches = bucket
      .filter((word) => word.startsWith(prefix) && word !== prefix)
      .slice(0, MAX_NOTE_SUGGESTIONS);

    setActiveNoteWord({ start, end });
    setNoteSuggestions(prefixMatches);
    setShowNoteSuggestions(prefixMatches.length > 0);
  };

  const applyNoteSuggestion = (suggestion: string) => {
    if (!activeNoteWord) return;
    const before = notes.slice(0, activeNoteWord.start);
    const after = notes.slice(activeNoteWord.end);
    const updated = `${before}${suggestion}${after}`;
    setNotes(updated);
    setShowNoteSuggestions(false);
    setNoteSuggestions([]);

    requestAnimationFrame(() => {
      const cursor = activeNoteWord.start + suggestion.length;
      noteInputRef.current?.focus();
      noteInputRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const task = {
      name: taskName,
      estimatedHours: parseFloat(estimatedHours) || 0,
      actualHours: parseFloat(actualHours) || 0,
      notes,
      date: date.toISOString().split('T')[0],
      category,
    };

    onAddTask(task);
    
    // Reset form
    setTaskName('');
    setEstimatedHours('');
    setActualHours('');
    setNotes('');
    setDate(initialDate ?? new Date());
    setCategory('');
    onOpenChange(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g., API Development"
              required
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g., 2"
                required
                className="mt-1.5"
                onFocus={(e) => {
                  if (e.target.placeholder) {
                    e.target.dataset.placeholder = e.target.placeholder;
                    e.target.placeholder = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.dataset.placeholder && !e.target.value) {
                    e.target.placeholder = e.target.dataset.placeholder;
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="actualHours">Actual Hours Worked</Label>
              <Input
                id="actualHours"
                type="number"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                placeholder="e.g., 1.5"
                className="mt-1.5"
                onFocus={(e) => {
                  if (e.target.placeholder) {
                    e.target.dataset.placeholder = e.target.placeholder;
                    e.target.placeholder = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.dataset.placeholder && !e.target.value) {
                    e.target.placeholder = e.target.dataset.placeholder;
                  }
                }}
              />
            </div>
          </div>

          <div>
            <Label>Date</Label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1.5 justify-start bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>
                    {isToday(date) ? 'Today' : formatDate(date)}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      setShowDatePicker(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setShowCategorySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
              placeholder="e.g., Development"
              className="mt-1.5"
            />
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setShowCategorySuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={noteContainerRef}>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                const value = e.target.value;
                noteInputRef.current = e.target;
                setNotes(value);
                updateNoteSuggestions(value, e.target.selectionStart ?? value.length);
              }}
              onKeyUp={(e) => {
                const target = e.target as HTMLTextAreaElement;
                updateNoteSuggestions(target.value, target.selectionStart ?? target.value.length);
              }}
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                noteInputRef.current = target;
                updateNoteSuggestions(target.value, target.selectionStart ?? target.value.length);
              }}
              onFocus={(e) => {
                noteInputRef.current = e.target;
              }}
              onBlur={() => setTimeout(() => setShowNoteSuggestions(false), 120)}
              placeholder="Add any additional notes..."
              className="mt-1.5 resize-none"
              rows={3}
            />
            {showNoteSuggestions && (
              <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-44 overflow-auto">
                {noteSuggestions.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyNoteSuggestion(word)}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                  >
                    {word}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
