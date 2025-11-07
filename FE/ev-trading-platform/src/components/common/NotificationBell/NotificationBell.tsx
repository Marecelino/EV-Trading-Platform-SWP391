import React, { useState } from 'react';
import { Badge, IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../../contexts/NotificationContext';
import NotificationDropdown from '../../modules/NotificationDropdown/NotificationDropdown';
import './NotificationBell.scss';

const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        className="notification-bell"
        aria-label={`${unreadCount} thông báo chưa đọc`}
        color="inherit"
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          className={unreadCount > 0 ? 'notification-bell__badge--pulse' : ''}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <NotificationDropdown
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
      />
    </>
  );
};

export default NotificationBell;

