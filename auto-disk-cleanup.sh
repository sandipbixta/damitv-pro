#!/bin/bash
# Auto Disk Cleanup Script for DamiTV
# Runs automatically when disk usage exceeds 180GB

THRESHOLD_GB=180  # Start cleaning when disk reaches 180GB used
LOG_FILE="/var/log/disk-cleanup.log"

# Get current disk usage in GB (root partition)
USAGE_GB=$(df / | tail -1 | awk '{print int($3/1024/1024)}')

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

if [ "$USAGE_GB" -ge "$THRESHOLD_GB" ]; then
    log_message "Disk usage at ${USAGE_GB}GB - Starting automatic cleanup (threshold: ${THRESHOLD_GB}GB)"

    # Level 1: Clean nginx cache (biggest space saver)
    if [ -d /var/lib/nginx/proxy ]; then
        BEFORE=$(du -sh /var/lib/nginx/proxy 2>/dev/null | cut -f1)
        rm -rf /var/lib/nginx/proxy/*
        log_message "Cleared nginx proxy cache (was $BEFORE)"
    fi

    # Level 2: Clean systemd journal logs (keep only 50MB)
    journalctl --vacuum-size=50M > /dev/null 2>&1
    log_message "Trimmed journal logs to 50MB"

    # Level 3: Clean apt cache
    apt-get clean > /dev/null 2>&1
    log_message "Cleared apt cache"

    # Level 4: Clean old log files
    find /var/log -type f -name "*.gz" -delete 2>/dev/null
    find /var/log -type f -name "*.old" -delete 2>/dev/null
    find /var/log -type f -name "*.[0-9]" -delete 2>/dev/null
    log_message "Removed old rotated logs"

    # Level 5: Clean ALL tmp files (main space hog)
    rm -rf /tmp/* 2>/dev/null
    rm -rf /var/tmp/* 2>/dev/null
    log_message "Cleared all temp files"

    # Level 6: Clean crash reports
    rm -rf /var/crash/* 2>/dev/null
    log_message "Cleared crash reports"

    # Get new usage
    NEW_USAGE_GB=$(df / | tail -1 | awk '{print int($3/1024/1024)}')
    FREED=$((USAGE_GB - NEW_USAGE_GB))
    log_message "Cleanup complete. Disk now at ${NEW_USAGE_GB}GB (freed ${FREED}GB)"

    # If still critical (>190GB), take emergency action
    if [ "$NEW_USAGE_GB" -ge 190 ]; then
        log_message "CRITICAL: Disk still at ${NEW_USAGE_GB}GB - Emergency cleanup"
        # Clear ALL nginx cache including temp
        rm -rf /var/cache/nginx/* 2>/dev/null
        # Truncate large log files instead of deleting
        find /var/log -type f -size +100M -exec truncate -s 0 {} \;
        log_message "Emergency cleanup completed"
    fi

    # Restart nginx to apply cache cleanup
    systemctl reload nginx 2>/dev/null
fi
# No logging when under threshold - silent operation
