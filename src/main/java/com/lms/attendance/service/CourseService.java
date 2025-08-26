package com.lms.attendance.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lms.attendance.model.Course;
import com.lms.attendance.model.CourseRegistrationCount;
import com.lms.attendance.model.CreditInfo;
import com.lms.attendance.repository.CourseMapper;

@Service
public class CourseService {

	 private final CourseMapper courseMapper;
	    private final WebSocketService webSocketService;

	    public CourseService(CourseMapper courseMapper, WebSocketService webSocketService) {
	        this.courseMapper = courseMapper;
	        this.webSocketService = webSocketService;
	    }

    public List<Course> getPreRegistrationCourses() {
        return courseMapper.findAvailableCourses();
    }

    public List<Course> getMyPreRegisteredCourses(String studentId, int preset) {
        return courseMapper.findMyPreRegisteredCourses(studentId, preset);
    }

    public void addPreRegistration(String studentId, int classId, int preset) {
        // 추가 검증 로직(중복 신청, 학점/정원 체크 등)을 필요 시 추가
        courseMapper.insertPreRegistration(studentId, classId, preset);
        webSocketService.broadcastUpdatedCounts();
    }

    public void removePreRegistration(String studentId, int classId) {
        courseMapper.deletePreRegistration(studentId, classId);
        webSocketService.broadcastUpdatedCounts();
    }
    
    public CreditInfo getCreditInfo(String studentId) {
        // 학생이 수강한 강의들의 학점을 과목 유형별로 합산
        CreditInfo creditInfo = courseMapper.sumCreditsByStudentId(studentId);
        if (creditInfo == null) {
            // 해당 학생의 수강 기록이 없으면 기본값 0으로 세팅
            creditInfo = new CreditInfo();
            creditInfo.setStudentId(studentId);
            creditInfo.setMajorCreditTaken(0);
            creditInfo.setGeneralCreditTaken(0);
        }
        // 졸업 요건: 전공 120, 교양 25 (하드코딩)
        creditInfo.setMajorCreditNeeded(120 - creditInfo.getMajorCreditTaken());
        creditInfo.setGeneralCreditNeeded(25 - creditInfo.getGeneralCreditTaken());

        // 최소/최대 학점은 프론트에서 하드코딩해서 사용할 수 있으므로 여기서는 계산하지 않아도 됩니다.
        return creditInfo;
    }
    
    public List<CourseRegistrationCount> getPreRegistrationCounts() {
        return courseMapper.getPreRegistrationCounts();
    }

    public void removeFinalRegistration(String studentId, int classId) {
        courseMapper.deleteFinalRegistration(studentId, classId);
        webSocketService.broadcastFinalCounts();
    }

    public List<Course> getFinalRegisteredCourses(String studentId) {
        return courseMapper.findMyFinalRegisteredCourses(studentId);
    }

    public List<CourseRegistrationCount> getFinalRegistrationCounts() {
        return courseMapper.getFinalRegistrationCounts();
    }

    public void addFinalRegistration(String studentId, int classId) {
        // 이미 확정되어 있는지 확인
        if (courseMapper.isAlreadyFinalRegistered(studentId, classId) > 0) {
            throw new IllegalStateException("이미 본 수강신청된 강의입니다.");
        }

        // 예비 수강신청 되어있으면 → UPDATE
        if (courseMapper.isPreRegistered(studentId, classId) > 0) {
            courseMapper.updateRegistrationToFinal(studentId, classId);
        } else {
            // 예비 수강신청 안했으면 → INSERT
            courseMapper.insertFinalRegistrationDirect(studentId, classId);
        }

        webSocketService.broadcastFinalCounts();
    }
}
