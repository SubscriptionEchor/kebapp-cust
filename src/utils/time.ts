import moment from 'moment';

export const formatTimeTo12Hour = (time: [number, number]): string => {
  if (!time || !Array.isArray(time) || time.length !== 2) return '';
  
  const [hours, minutes] = time;
  const momentTime = moment().hours(hours).minutes(minutes);
  return momentTime.format('h:mm A');
};

export const getDayName = (date: Date): string => {
  return moment(date).format('ddd').toUpperCase();
};

export const getNextOpeningTime = (openingTimes: any[], currentDate: Date = new Date()): string | null => {
  const currentDay = getDayName(currentDate);
  const currentTime = moment(currentDate);
  const currentMinutes = currentTime.hours() * 60 + currentTime.minutes();

  // Check current day first
  const todaySchedule = openingTimes.find(day => day.day === currentDay);
  if (todaySchedule?.isOpen && todaySchedule.times?.length > 0) {
    for (const time of todaySchedule.times) {
      const startMinutes = time.startTime[0] * 60 + time.startTime[1];
      if (currentMinutes < startMinutes) {
        return formatTimeTo12Hour(time.startTime);
      }
    }
  }

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDate = moment(currentDate).add(i, 'days');
    const nextDay = getDayName(nextDate.toDate());
    const nextDaySchedule = openingTimes.find(day => day.day === nextDay);

    if (nextDaySchedule?.isOpen && nextDaySchedule.times?.length > 0) {
      return formatTimeTo12Hour(nextDaySchedule.times[0].startTime);
    }
  }

  return null;
};

export const isCurrentlyOpen = (openingTimes: any[], currentDate: Date = new Date()): boolean => {
  const currentDay = getDayName(currentDate);
  const currentTime = moment(currentDate);
  const currentMinutes = currentTime.hours() * 60 + currentTime.minutes();

  const todaySchedule = openingTimes.find(day => day.day === currentDay);
  if (!todaySchedule?.isOpen) return false;

  return todaySchedule.times.some((time: any) => {
    const startMinutes = time.startTime[0] * 60 + time.startTime[1];
    const endMinutes = time.endTime[0] * 60 + time.endTime[1];
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  });
};