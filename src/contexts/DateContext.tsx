import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type DateContextValue = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
};

const DateContext = createContext<DateContextValue | null>(null);

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const value = useMemo<DateContextValue>(
    () => ({
      selectedDate,
      setSelectedDate,
      goToPreviousDay: () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
      },
      goToNextDay: () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
      },
    }),
    [selectedDate]
  );

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useSelectedDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useSelectedDate must be used within DateProvider');
  }
  return context;
}
