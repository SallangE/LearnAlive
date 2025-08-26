package com.lms.attendance.model;

import lombok.Data;

@Data
public class AlarmList {
    private int alarmId;
    private String userId;
    private int classId;
    private String type;
    private String title;
    private String createdAt;
    private boolean isRead;  // DB의 is_read 컬럼과 매핑됨

    // setIsRead 메서드를 명시적으로 사용
    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }
}
