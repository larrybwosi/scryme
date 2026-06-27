import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod/v3';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useDispatchOrderMutation } from '@/hooks/deliveries';
import { format, isToday, startOfDay } from 'date-fns';

import { Button } from '@repo/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Input } from '@repo/ui/components/ui/input';
import { Calendar } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { cn } from '@/lib/utils';

// Client-side schema mirroring the API schema
const formSchema = z.object({
  driverId: z.string().optional(),
  estimatedTime: z.date().optional(),
  deliveryFee: z.coerce.number().min(0).default(0),
});

interface DriverOption {
  id: string;
  member: {
    name: string;
  };
}

interface DispatchDialogProps {
  transactionId: string;
  drivers: DriverOption[]; // Pass fetched drivers here
  open: boolean; // Receive open state from parent
  onOpenChange: (open: boolean) => void; // Receive open state change handler from parent
}

export function DispatchDialog({ transactionId, drivers, open, onOpenChange }: DispatchDialogProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryFee: 0,
    },
  });

  // TanStack mutation for API call
  const dispatchMutation = useDispatchOrderMutation({
    transactionId,
    onSuccess: () => {
      onOpenChange(false); // Use parent's open state handler
      form.reset({
        deliveryFee: 0,
        driverId: 'unassigned', // Reset to unassigned
      });
    },
  });

  const isLoading = dispatchMutation.isPending;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    dispatchMutation.mutate(values);
  }

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const selectedDate = startOfDay(date);

    // Only disable dates before today (not today itself)
    return selectedDate < today;
  };

  // Helper function to set current time on a date
  const setCurrentTime = (date: Date) => {
    const now = new Date();
    date.setHours(now.getHours(), now.getMinutes());
    return date;
  };

  // Function to handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // If the selected date is today, set the current time
      const selectedDate = isToday(date) ? setCurrentTime(date) : date;
      form.setValue('estimatedTime', selectedDate);
    } else {
      form.setValue('estimatedTime', undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Dispatch Order</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Assign a driver and set delivery details. The customer will be notified.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Driver Selection */}
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Assign Driver</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      <SelectItem value="unassigned" className="focus:bg-accent focus:text-accent-foreground">
                        Leave Unassigned
                      </SelectItem>
                      {drivers.map(driver => (
                        <SelectItem
                          key={driver.id}
                          value={driver.id}
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          {driver.member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delivery Fee */}
            <FormField
              control={form.control}
              name="deliveryFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Delivery Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      className="bg-background border-input text-foreground"
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Additional fee charged for this delivery.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Time with Calendar */}
            <FormField
              control={form.control}
              name="estimatedTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-foreground">Estimated Arrival</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal bg-background border-input',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP HH:mm') : <span>Pick a date and time</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-popover text-popover-foreground border-border"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={handleDateSelect}
                        disabled={isDateDisabled}
                        autoFocus
                        initialFocus
                      />
                      <div className="p-3 border-t border-border">
                        <div className="mb-2 text-sm text-muted-foreground">
                          {field.value && isToday(field.value) && (
                            <p className="text-xs mb-1">Selected date is today. Time will be set to current time.</p>
                          )}
                        </div>
                        <Input
                          type="time"
                          value={field.value ? format(field.value, 'HH:mm') : ''}
                          onChange={e => {
                            if (field.value && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(field.value);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              field.onChange(newDate);
                            } else if (field.value) {
                              // If time is cleared, keep the date but set to current time for today, or default to 12:00
                              const newDate = new Date(field.value);
                              if (isToday(newDate)) {
                                const now = new Date();
                                newDate.setHours(now.getHours(), now.getMinutes());
                              } else {
                                newDate.setHours(12, 0); // Default to noon for future dates
                              }
                              field.onChange(newDate);
                            }
                          }}
                          className="bg-background border-input text-foreground"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const now = new Date();
                              field.onChange(now);
                            }}
                            className="text-xs w-full"
                          >
                            Set to current time
                          </Button>
                          {field.value && isToday(field.value) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const now = new Date();
                                now.setHours(now.getHours() + 1); // Add 1 hour as a suggested delivery time
                                field.onChange(now);
                              }}
                              className="text-xs w-full"
                            >
                              +1 Hour
                            </Button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-muted-foreground">
                    Select today or a future date for delivery. Today's date will use current time.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Dispatch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
