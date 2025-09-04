import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export interface MonthYear {
  month: number; // 0-11 (January = 0)
  year: number;
}

interface MonthPickerProps {
  value: MonthYear | undefined;
  onChange: (monthYear: MonthYear) => void;
  placeholder?: string;
  className?: string;
}

export function MonthPicker({ 
  value, 
  onChange, 
  placeholder = "Select month",
  className = ""
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentDate = new Date();
  const [viewYear, setViewYear] = useState(value?.year || currentDate.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    onChange({ month: monthIndex, year: viewYear });
    setIsOpen(false);
  };

  const formatMonthYear = (monthYear: MonthYear) => {
    return `${months[monthYear.month]} ${monthYear.year}`;
  };

  const canGoToPreviousYear = () => viewYear > currentDate.getFullYear() - 5;
  const canGoToNextYear = () => viewYear <= currentDate.getFullYear();

  const isMonthDisabled = (monthIndex: number) => {
    if (viewYear > currentDate.getFullYear()) return true;
    if (viewYear === currentDate.getFullYear() && monthIndex > currentDate.getMonth()) return true;
    return false;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          <span className="truncate">
            {value ? formatMonthYear(value) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewYear(viewYear - 1)}
              disabled={!canGoToPreviousYear()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-lg">{viewYear}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewYear(viewYear + 1)}
              disabled={!canGoToNextYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isSelected = value?.month === index && value?.year === viewYear;
              const isDisabled = isMonthDisabled(index);
              
              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="h-10 text-xs"
                  onClick={() => handleMonthSelect(index)}
                  disabled={isDisabled}
                >
                  {month.substring(0, 3)}
                </Button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}