
import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from './ui/pagination';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '../hooks/use-mobile';

interface DatePaginationProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  navigateDate: (days: number) => void;
}

const DatePagination: React.FC<DatePaginationProps> = ({ currentDate, setCurrentDate, navigateDate }) => {
  const isMobile = useIsMobile();
  const today = new Date();
  
  // Generate dates for pagination - show 5 days on desktop, 3 on mobile
  const datesCount = isMobile ? 3 : 5;
  const offset = isMobile ? 1 : 2;
  
  const dates = Array.from({ length: datesCount }, (_, i) => {
    const date = addDays(currentDate, i - offset);
    return {
      date,
      formatted: format(date, 'EEE, MMM d'), // More readable format with day name
      isToday: isSameDay(date, today),
      isCurrent: isSameDay(date, currentDate),
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
      <Pagination className="w-full">
        <PaginationContent className="flex w-full justify-between bg-[#242836] rounded-lg p-2">
          <PaginationItem>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateDate(-1)} 
              className="cursor-pointer text-white hover:bg-[#343a4d]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          
          <div className="flex items-center justify-center flex-1 gap-1">
            {dates.map((date, i) => (
              <PaginationItem key={i} className="flex-1 max-w-40">
                <PaginationLink 
                  className={cn(
                    "cursor-pointer w-full justify-center text-center px-1 py-2 rounded-md transition-all",
                    date.isToday ? "bg-[#9b87f5] text-white" : 
                    date.isCurrent ? "bg-[#343a4d] text-white" : 
                    "text-white hover:bg-[#343a4d]"
                  )}
                  onClick={() => setCurrentDate(date.date)}
                >
                  <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {date.formatted}
                  </span>
                </PaginationLink>
              </PaginationItem>
            ))}
          </div>
          
          <PaginationItem>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateDate(1)} 
              className="cursor-pointer text-white hover:bg-[#343a4d]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-[#242836] border-[#343a4d] text-white hover:bg-[#343a4d] whitespace-nowrap">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(currentDate, 'MMMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#242836] border-[#343a4d]" align="end">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && setCurrentDate(date)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePagination;
