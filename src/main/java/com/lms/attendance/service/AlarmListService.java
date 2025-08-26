package com.lms.attendance.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.lms.attendance.model.AlarmList;
import com.lms.attendance.repository.AlarmListMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AlarmListService {
    private final AlarmListMapper alarmListMapper;

    public void saveAlarm(AlarmList alarm) {
        alarmListMapper.insertAlarm(alarm);
    }

    public List<AlarmList> getUserAlarms(String userId) {
        List<AlarmList> alarms = alarmListMapper.getAlarmsByUserId(userId);
        System.out.println("📤 [Service] 가져온 알림 개수: " + alarms.size());
        return alarms;
    }
    
    public void markAllAsRead(String userId) {
        alarmListMapper.markAllAsRead(userId);
    }
}