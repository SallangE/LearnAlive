package com.lms.attendance.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.lms.attendance.model.AlarmList;
import com.lms.attendance.model.CourseRegistrationCount;
import com.lms.attendance.model.WarningMessage;
import com.lms.attendance.repository.AlarmListMapper;
import com.lms.attendance.repository.CourseMapper;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CourseMapper courseMapper;
    
    @Autowired
    private AlarmListMapper alarmListMapper; 

    // 신청 인원 전체를 다시 조회해서 브로드캐스트
    public void broadcastUpdatedCounts() {
        List<CourseRegistrationCount> counts = courseMapper.getPreRegistrationCounts();
        messagingTemplate.convertAndSend("/topic/registrationCounts", counts);
    }
    
    // ✅ 본 수강신청 인원 브로드캐스트
    public void broadcastFinalCounts() {
        List<CourseRegistrationCount> counts = courseMapper.getFinalRegistrationCounts();
        messagingTemplate.convertAndSend("/topic/finalCounts", counts);
    }
    
 // F학점 알림 전송 및 DB 저장
    public void sendFGradeWarning(String studentId, String content, int classId) {
        // 1. 학생용 알림 메시지 생성
        WarningMessage message = new WarningMessage("⚠️ F학점 경고", content);

        // 2. WebSocket 알림 전송 (학생에게)
        System.out.println("🚨 [WebSocket] 학생 알림 전송 시도 - userId: " + studentId + ", title: " + message.getTitle());

        messagingTemplate.convertAndSendToUser(
            studentId,                // 🔥 프론트에서 SockJS 연결 시 login 헤더로 보내는 값
            "/topic/alerts",          // → /user/topic/alerts 로 전달됨
            message
        );

        System.out.println("✅ [WebSocket] 학생 알림 전송 완료");

        // 3. DB에 알림 저장 (학생용)
        AlarmList studentAlarm = new AlarmList();
        studentAlarm.setUserId(studentId); // 알림 수신자 (학생)
        studentAlarm.setClassId(classId);
        studentAlarm.setType("WARNING");
        studentAlarm.setTitle(message.getTitle());
        studentAlarm.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()).toString());
        studentAlarm.setIsRead(false);

        alarmListMapper.insertAlarm(studentAlarm);

        // 4. 교수자 조회 (profId 기준)
        String profId = courseMapper.findProfIdByStudentId(studentId); // 🔁 메서드명도 정확히 profId로 반환해야 함
        if (profId != null && !profId.isBlank()) {
            // 5. 교수자용 메시지 생성
            WarningMessage profMsg = new WarningMessage(
                "📢 출석 경고 알림",
                "학생 " + studentId + "의 출결 상태가 기준치를 초과했습니다."
            );

            System.out.println("🚨 [WebSocket] 교수자 알림 전송 시도 - userId: " + profId + ", title: " + profMsg.getTitle());

            messagingTemplate.convertAndSendToUser(
                profId,                // 🔥 프론트에서 login 헤더로 연결한 profId와 동일해야 수신 가능
                "/topic/alerts",
                profMsg
            );

            System.out.println("✅ [WebSocket] 교수자 알림 전송 완료");

            // 6. DB에 알림 저장 (교수자용)
            AlarmList profAlarm = new AlarmList();
            profAlarm.setUserId(profId); // 알림 수신자 (교수)
            profAlarm.setClassId(classId);
            profAlarm.setType("WARNING");
            profAlarm.setTitle("학생 " + studentId + " 출석 경고");
            profAlarm.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()).toString());
            profAlarm.setIsRead(false);

            alarmListMapper.insertAlarm(profAlarm);
        } else {
            System.out.println("⚠️ 교수자 ID(profId)를 찾을 수 없어 교수자 알림 전송 생략");
        }
    }


}
