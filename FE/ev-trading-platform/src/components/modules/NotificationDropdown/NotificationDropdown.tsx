import React from 'react';
import { Popover, Button, Typography, Box, CircularProgress } from '@mui/material';
import { useNotifications } from '../../../contexts/NotificationContext';
import NotificationItem from '../NotificationItem/NotificationItem';
import './NotificationDropdown.scss';

interface NotificationDropdownProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ open, anchorEl, onClose }) => {
  const { notifications, loading, hasMore, unreadCount, loadNotifications, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleLoadMore = async () => {
    const nextPage = Math.floor(notifications.length / 10) + 1;
    await loadNotifications(nextPage);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      className="notification-dropdown"
      PaperProps={{
        className: 'notification-dropdown__paper',
      }}
    >
      <div className="notification-dropdown__container">
        {/* Header */}
        <div className="notification-dropdown__header">
          <Typography variant="h6" component="h2">
            Thông báo
            {unreadCount > 0 && (
              <span className="notification-dropdown__unread-count">
                ({unreadCount})
              </span>
            )}
          </Typography>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              className="notification-dropdown__mark-all-btn"
            >
              Đánh dấu tất cả là đã đọc
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="notification-dropdown__list">
          {loading && notifications.length === 0 ? (
            <Box className="notification-dropdown__loading">
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Đang tải thông báo...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box className="notification-dropdown__empty">
              <Typography variant="body2" color="text.secondary">
                Không có thông báo nào
              </Typography>
            </Box>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClose={onClose}
                />
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <Box className="notification-dropdown__load-more">
                  <Button
                    fullWidth
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="text"
                  >
                    {loading ? 'Đang tải...' : 'Tải thêm'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </div>
      </div>
    </Popover>
  );
};

export default NotificationDropdown;

