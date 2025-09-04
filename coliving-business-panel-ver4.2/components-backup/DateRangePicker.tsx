import { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, X } from 'lucide-react';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  placeholder = "Select date range",
  className = ""
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onChange(range);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: undefined, to: undefined });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatRange = () => {
    if (!value.from) return placeholder;
    
    if (!value.to) {
      return formatDate(value.from);
    }
    
    if (value.from.toDateString() === value.to.toDateString()) {
      return formatDate(value.from);
    }
    
    return `${formatShortDate(value.from)} - ${formatDate(value.to)}`;
  };

  const hasSelection = value.from || value.to;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          <span className="truncate">{formatRange()}</span>
          {hasSelection && (
            <X 
              className="ml-2 h-3 w-3 hover:bg-gray-200 rounded" 
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value.from}
          selected={{
            from: value.from,
            to: value.to
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={(date) => date > new Date()}
        />
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({ from: undefined, to: undefined });
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={!value.from}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}