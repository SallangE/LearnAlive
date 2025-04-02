package com.lms.attendance.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.attendance.model.Attendance;
import com.lms.attendance.repository.AttendanceMapper;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceMapper attendanceMapper;
    private final WebSocketService webSocketService;

    public AttendanceServiceImpl(AttendanceMapper attendanceMapper, WebSocketService webSocketService) {
        this.attendanceMapper = attendanceMapper;
        this.webSocketService = webSocketService;
    }
 
    // ✅ 특정 날짜 출석 데이터 조회
    @Override
    public List<Attendance> getAttendanceByClassAndDate(int classId, String date) {
        List<Attendance> attendanceList = attendanceMapper.findAttendanceByClassAndDate(classId, date);

        // ✅ createdAt, updatedAt null → "" 변환 처리
        for (Attendance att : attendanceList) {
            if (att.getCreatedAt() == null) att.setCreatedAt("");
            if (att.getUpdatedAt() == null) att.setUpdatedAt("");
        }
        return attendanceList;
    }


    // ✅ 출석 상태 변경
    @Override
    @Transactional
    public void updateAttendanceState(int attendanceId, String state, String studentId) {
        attendanceMapper.updateAttendanceState(attendanceId, state);
        checkAndSendFAlert(studentId); // ✅ 전체 이력 기준 경고 판단
    }

    // ✅ 출석 사유 변경
    @Override
    @Transactional
    public void updateAttendanceReason(int attendanceId, String reason) {
        attendanceMapper.updateAttendanceReason(attendanceId, reason);
    }

    // ✅ 출석 기록 추가 (중복 검사)
    @Override
    @Transactional
    public void addAttendance(Attendance attendance) {
        int existingCount = attendanceMapper.checkDuplicateAttendance(
                attendance.getStudentId(), attendance.getClassId(), attendance.getDate());

        if (existingCount == 0) { // 기존 기록이 없는 경우만 추가
            attendanceMapper.insertAttendance(
                    attendance.getStudentId(),
                    attendance.getClassId(),
                    attendance.getDate(),
                    attendance.getState());
            checkAndSendFAlert(attendance.getStudentId());
        }
    }

    // ✅ 출석 기록 삭제
    @Override
    @Transactional
    public void deleteAttendance(int attendanceId) {
        attendanceMapper.deleteAttendance(attendanceId);
    }
    
    //학생 출석 기록
 // 출석 기록 반환 메서드 수정
    @Override
    @Transactional
    public Map<String, Object> studentCheckIn(Attendance request) {
        Map<String, Object> response = new HashMap<>();

        // ✅ DB에서 출석 가능 시간 확인
        String availability = attendanceMapper.checkAttendanceAvailability(request.getClassId());

        // ✅ 출석 가능 시간이 아닐 경우
        if ("early".equals(availability)) {
            response.put("message", "❌ 아직 출석 가능한 시간이 아닙니다.");
            response.put("state", "none");
            return response;
        } 
        if ("late".equals(availability)) {
            response.put("message", "❌ 수업이 종료된 이후에는 출석할 수 없습니다.");
            response.put("state", "none");
            return response;
        }

        // ✅ 기존 출석 확인
        int count = attendanceMapper.checkExistingAttendance(request.getStudentId(), request.getClassId(), request.getDate());
        if (count > 0) {
            Attendance existingAttendance = attendanceMapper.getAttendanceByStudentAndDate(request.getStudentId(), request.getClassId(), request.getDate());
            response.put("message", "❗ 이미 출석이 기록되었습니다.");
            response.put("state", existingAttendance.getState());
            return response;
        }

        // ✅ 정상 출석 기록
        attendanceMapper.studentCheckIn(request);
        Attendance newAttendance = attendanceMapper.getAttendanceByStudentAndDate(request.getStudentId(), request.getClassId(), request.getDate());

        response.put("message", "✅ 출결 상태가 기록되었습니다.");
        response.put("state", newAttendance.getState());
        return response;
    }

    @Override
    public List<Attendance> getAttendanceByStudent(String studentId, String date) {
        return attendanceMapper.findAttendanceByStudent(studentId, date);
    }
    
    @Override
    @Transactional
    public List<Attendance> getMonthlyAttendance(String studentId, String month) {
        return attendanceMapper.findAttendanceByStudentForMonth(studentId, month);
    }
    
    @Override
    @Transactional
    public List<Attendance> getPastAttendance(String studentId, String endDate) {
        return attendanceMapper.findPastAttendanceByStudent(studentId, endDate);
    }
    
    @Override
    @Transactional
 // 출석 이력에 따른 F학점 경고 전송
    public void checkAndSendFAlert(String studentId) {
        int absentCount = attendanceMapper.countAbsentsByStudentId(studentId); 
        int lateCount = attendanceMapper.countLatesByStudentId(studentId);     
        int virtualAbsents = absentCount + (lateCount / 2);

        System.out.println("👀 알림 체크 대상 학번: " + studentId);
        System.out.println("📊 결석 횟수: " + absentCount);
        System.out.println("📊 지각 횟수: " + lateCount);
        System.out.println("📈 환산된 결석 횟수: " + virtualAbsents);

        if (virtualAbsents >= 2) {
            System.out.println("🚨 F학점 경고 알림 전송 시작");
            // WebSocketService를 통해 학생과 교수자에게 알림을 전송하고, DB에 저장
            webSocketService.sendFGradeWarning(
                studentId,
                "현재까지 결석 " + absentCount + "회, 지각 " + lateCount + "회입니다. 출석에 유의하세요!",
                1 // 예시로 클래스 ID가 1번이라고 가정
            );
        } else {
            System.out.println("✅ F학점 조건 미충족, 알림 전송 생략");
        }
    }

    //출석 통합 분석
    public List<Attendance> getMonthlyAttendanceForClass(int classId, String month) {
        return attendanceMapper.findAttendanceByClassForMonth(classId, month);
    }
    
}