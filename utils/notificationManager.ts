import type { Channel } from '../types';

// The service worker is now registered in index.tsx. This file only handles permission and showing notifications.

// Function to request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notification.');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  return permission;
};

// Function to show a notification when a streamer goes live
export const showLiveNotification = async (streamer: Channel, bodyText: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return; // Silently exit if notifications aren't supported or permission isn't granted
  }

  const streamerNotifications = JSON.parse(localStorage.getItem('streamerNotifications') || '{}');

  // Check if notifications are enabled for this specific streamer
  if (!streamerNotifications[streamer.username]) {
    return;
  }

  // Get the already registered service worker
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    console.error('No service worker registered to show notification.');
    return;
  }
  
  const notificationTitle = streamer.display_name;
  // FIX: The 'renotify' property is a valid option for service worker notifications
  // but is not in the standard NotificationOptions type definition.
  // Casting to 'any' bypasses this TypeScript type check.
  const notificationOptions: any = {
    body: bodyText,
    icon: streamer.profile_pic || 'https://i.postimg.cc/QNW4B8KQ/00WZrbng.png', // Fallback icon
    data: {
      url: streamer.live_url,
    },
    tag: streamer.username, // Use a tag to prevent multiple notifications for the same streamer
    renotify: true, // Allow re-notifying if the tag is the same
  };

  await registration.showNotification(notificationTitle, notificationOptions);
};
