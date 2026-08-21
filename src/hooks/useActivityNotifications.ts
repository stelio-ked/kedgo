import { useEffect, useState, useRef } from 'react';
import { Destination } from '../types';

export function useActivityNotifications(destinations: Destination[]) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  
  const notifiedActivities = useRef<Set<string>>(new Set());

  const requestPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const interval = setInterval(() => {
      const now = new Date();
      // Look 1 hour ahead
      const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);

      destinations.forEach(dest => {
        if (!dest.startDate) return;

        // Parse destination startDate
        const baseDate = new Date(dest.startDate + "T00:00:00");

        dest.days.forEach(day => {
          // Calculate day's actual date based on dest.startDate and day.dayNumber
          const dayDate = new Date(baseDate.getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000);

          day.activities.forEach(act => {
            if (!act.time) return;

            // Simple parse of "HH:MM"
            const match = act.time.match(/(\d{1,2}):(\d{2})/);
            if (match) {
              const actDate = new Date(dayDate);
              actDate.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);

              // If activity is within the next 60 minutes and hasn't been notified yet
              if (
                actDate > now &&
                actDate <= oneHourAhead &&
                !notifiedActivities.current.has(act.id)
              ) {
                new Notification('Lembrete de Atividade', {
                  body: `${act.location} está agendado para ${act.time}. Está a menos de 1 hora!`,
                  icon: '/vite.svg', // generic icon
                });
                notifiedActivities.current.add(act.id);
              }
            }
          });
        });
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [destinations, permission]);

  return { permission, requestPermission };
}
