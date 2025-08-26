package com.lms.attendance.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.attendance.model.Course;
import com.lms.attendance.model.CourseRegistrationCount;
import com.lms.attendance.model.CreditInfo;
import com.lms.attendance.model.FinalRegistration;
import com.lms.attendance.model.PreRegistration;
import com.lms.attendance.service.CourseService;

@RestController
@RequestMapping("/api/course")
public class CourseController {

    @Autowired
    private CourseService courseService;

    // 예비 수강신청 가능한 강의 목록 조회
    @GetMapping("/pre/courses")
    public List<Course> getPreRegistrationCourses() {
        return courseService.getPreRegistrationCourses();
    }

    // 해당 학생의 예비 수강신청 내역 조회
    @GetMapping("/pre/mycourses")
    public List<Course> getMyPreRegisteredCourses(@RequestParam("studentId") String studentId,
                                                  @RequestParam("preset") int preset) {
        return courseService.getMyPreRegisteredCourses(studentId, preset);
    }

    // 예비 수강신청 추가 (장바구니 담기)
    @PostMapping("/pre")
    public ResponseEntity<?> addPreRegistration(@RequestBody PreRegistration request) {
        courseService.addPreRegistration(
            request.getStudentId(),
            request.getClassId(),
            request.getPreset() // ✅ preset 전달
        );
        return ResponseEntity.ok("Pre-registration added successfully");
    }

    // 예비 수강신청 삭제 (취소)
    @DeleteMapping("/pre")
    public ResponseEntity<?> removePreRegistration(@RequestParam("studentId") String studentId,
                                                   @RequestParam("classId") int classId) {
        courseService.removePreRegistration(studentId, classId);
        return ResponseEntity.ok("Pre-registration removed successfully");
    }
    
    // 학점 정보 가져오기
    @GetMapping("/credit-info/{studentId}")
    public ResponseEntity<CreditInfo> getCreditInfo(@PathVariable("studentId") String studentId) {
        CreditInfo creditInfo = courseService.getCreditInfo(studentId);
        if (creditInfo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(creditInfo);
    }
    

    // 예비 수강신청 인원 수 조회
    @GetMapping("/pre/counts")
    public ResponseEntity<List<CourseRegistrationCount>> getPreRegistrationCounts() {
        List<CourseRegistrationCount> counts = courseService.getPreRegistrationCounts();
        return ResponseEntity.ok(counts);
    }

    // 본 수강신청 추가
    @PostMapping("/final")
    public ResponseEntity<?> addFinalRegistration(@RequestBody FinalRegistration request) {
        courseService.addFinalRegistration(request.getStudentId(), request.getClassId());
        return ResponseEntity.ok("Final registration successful");
    }

    // 본 수강신청 내역 조회
    @GetMapping("/final/mycourses")
    public List<Course> getFinalRegisteredCourses(@RequestParam("studentId") String studentId) {
        return courseService.getFinalRegisteredCourses(studentId);
    }

    // 본 수강신청 인원 수 조회
    @GetMapping("/final/counts")
    public ResponseEntity<List<CourseRegistrationCount>> getFinalRegistrationCounts() {
        List<CourseRegistrationCount> counts = courseService.getFinalRegistrationCounts();
        return ResponseEntity.ok(counts);
    }

    // 본 수강신청 취소
    @DeleteMapping("/final")
    public ResponseEntity<?> removeFinalRegistration(@RequestParam("studentId") String studentId,
                                                     @RequestParam("classId") int classId) {
        courseService.removeFinalRegistration(studentId, classId);
        return ResponseEntity.ok("Final registration cancelled successfully");
    }

}