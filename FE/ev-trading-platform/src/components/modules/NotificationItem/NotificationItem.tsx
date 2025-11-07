import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { Notification, NotificationType } from '../../../types/api';
import { useNotifications } from '../../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './NotificationItem.scss';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WIN_AUCTION:
        return <TrophyIcon className="notification-item__icon notification-item__icon--win" />;
      case NotificationType.LISTING_APPROVED:
        return <CheckCircleIcon className="notification-item__icon notification-item__icon--success" />;
      case NotificationType.LISTING_REJECTED:
        return <CancelIcon className="notification-item__icon notification-item__icon--error" />;
      case NotificationType.TRANSACTION_COMPLETED:
        return <ShoppingCartIcon className="notification-item__icon notification-item__icon--primary" />;
      case NotificationType.REVIEW_RECEIVED:
        return <StarIcon className="notification-item__icon notification-item__icon--warning" />;
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return <InfoIcon className="notification-item__icon notification-item__icon--info" />;
      case NotificationType.FAVORITE_AUCTION_BID:
      case NotificationType.FAVORITE_AUCTION_SOLD:
      case NotificationType.FAVORITE_LISTING_SOLD:
        return <NotificationsIcon className="notification-item__icon notification-item__icon--info" />;
      default:
        return <NotificationsIcon className="notification-item__icon" />;
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return '';
    }
  };

  // Handle notification click
  const handleClick = async () => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification._id);
    }

    // Navigate to action_url if it exists
    if (notification.action_url) {
      // Check if it's an external URL or internal path
      if (notification.action_url.startsWith('http')) {
        window.location.href = notification.action_url;
      } else {
        navigate(notification.action_url);
      }
    }

    // Close dropdown
    onClose();
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the notification click
    await deleteNotification(notification._id);
  };

  return (
    <div
      className={`notification-item ${
        !notification.is_read ? 'notification-item--unread' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Unread indicator dot */}
      {!notification.is_read && (
        <CircleIcon className="notification-item__unread-dot" />
      )}

      {/* Icon */}
      <div className="notification-item__icon-wrapper">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="notification-item__content">
        <Typography
          variant="body2"
          className={`notification-item__message ${
            !notification.is_read ? 'notification-item__message--unread' : ''
          }`}
        >
          {notification.message}
        </Typography>
        <Typography variant="caption" className="notification-item__time">
          {getRelativeTime(notification.createdAt)}
        </Typography>
      </div>

      {/* Delete button */}
      <IconButton
        size="small"
        className="notification-item__delete-btn"
        onClick={handleDelete}
        aria-label="Xóa thông báo"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

export default NotificationItem;

