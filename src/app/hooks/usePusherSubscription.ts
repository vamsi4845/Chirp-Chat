import { useEffect } from 'react';
import { pusherClient } from '@/app/libs/pusher';

type PusherEvents = {
  [key: string]: (data: any) => void;
};

const usePusherSubscription = (channel: string | undefined, events: PusherEvents) => {
  useEffect(() => {
    if (!channel) return;

    pusherClient.subscribe(channel);

    Object.entries(events).forEach(([event, handler]) => {
      pusherClient.bind(event, handler);
    });

    return () => {
      pusherClient.unsubscribe(channel);
      Object.entries(events).forEach(([event, handler]) => {
        pusherClient.unbind(event, handler);
      });
    };
  }, [channel, events]);
};

export default usePusherSubscription;
