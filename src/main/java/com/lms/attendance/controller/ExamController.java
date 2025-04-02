package com.lms.attendance.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.attendance.model.AlarmMessage;
import com.lms.attendance.model.Exam;
import com.lms.attendance.model.ExamResult;
import com.lms.attendance.model.ExamStudentAnswer;
import com.lms.attendance.model.StudentExamResult;
import com.lms.attendance.service.AlarmSender;
import com.lms.attendance.service.ExamService;
import com.lms.attendance.service.ExamSubmissionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;
    private final ExamSubmissionService examSubmissionService;
    private final AlarmSender alarmSender;

    // 새로운 시험 추가 (시험과 질문 포함)
    @PostMapping
    public ResponseEntity<String> createExam(@RequestBody Exam exam) {
        System.out.println("시험 데이터: " + exam); // 전송 데이터 확인
        examService.createExam(exam);  // 시험과 관련된 질문들까지 저장
        AlarmMessage message = new AlarmMessage(
                "EXAM",
                exam.getTitle(),
                LocalDateTime.now().toString(),
                exam.getClassId()
            );
            alarmSender.sendToUsersInClass(exam.getClassId(), message);

        return ResponseEntity.ok("시험이 성공적으로 생성되었습니다.");
    }

    // 특정 클래스의 시험 목록 가져오기
    @GetMapping
    public ResponseEntity<List<Exam>> getExams(
            @RequestParam("classId") int classId,
            @RequestParam("studentId") String studentId) {
        System.out.println("🔍 요청 받은 classId: " + classId + ", studentId: " + studentId);
        List<Exam> exams = examService.getExamsByClassIdAndStudentId(classId, studentId);
        System.out.println("🔍 가져온 시험 목록: " + exams);
        return ResponseEntity.ok(exams);
    }
    
    // 시험 게시판 생성 (Exam_Board)
    @PostMapping("/board")
    public ResponseEntity<String> createQuizBoard(@RequestParam("classId") int classId) {
        examService.createQuizBoard(classId);
        return ResponseEntity.ok("퀴즈 게시판이 생성되었습니다.");
    }

    // 특정 시험 상세 보기 (시험과 질문 포함)
    @GetMapping("/{examId}")
    public ResponseEntity<Exam> getExam(@PathVariable("examId") int examId) {
        System.out.println("🔍 요청 받은 examId: " + examId);
        Exam exam = examService.getExamById(examId);  // 시험과 관련된 질문을 함께 가져옴
        System.out.println("🔍 가져온 시험 데이터: " + exam);
        return ResponseEntity.ok(exam);
    }

    // 시험 삭제 (시험과 관련된 질문도 삭제)
    @DeleteMapping("/{examId}")
    public ResponseEntity<Void> deleteExam(@PathVariable("examId") int examId) {
        examService.deleteExam(examId);  // 시험과 관련된 질문도 함께 삭제
        return ResponseEntity.ok().build();
    }

    // 시험 수정 (시험과 질문 포함)
    @PutMapping("/{examId}")
    public ResponseEntity<Exam> updateExam(@PathVariable("examId") int examId, @RequestBody Exam exam) {
        System.out.println("수정 요청 데이터: " + exam);  // 로그 찍어서 데이터 확인
        exam.setExamId(examId); // examId를 exam 객체에 설정
        examService.updateExam(exam);  // 시험과 질문 수정
        return ResponseEntity.ok(exam); // 수정된 시험 객체 반환
    }
    

 // 학생이 시험을 제출
    @PostMapping("/submit")
    public ResponseEntity<String> submitExam(@RequestBody ExamStudentAnswer examStudentAnswer) {
        System.out.println("시험 제출 데이터: " + examStudentAnswer);
        examSubmissionService.submitExam(examStudentAnswer);
        return ResponseEntity.ok("시험이 성공적으로 제출되었습니다.");
    }
    
 // ✅ 특정 학생의 시험 결과 조회 (examId, studentId 모두 RequestParam으로 받기)
    @GetMapping("/examResult")
    public ResponseEntity<ExamResult> getExamResult(
        @RequestParam("examId") int examId, 
        @RequestParam("studentId") String studentId) {
        
        ExamResult result = examSubmissionService.getExamResult(examId, studentId); 
        System.out.println("==== >>>>");
        System.out.println(result.getAnswers());
        return ResponseEntity.ok(result);
    }

    // ✅ 특정 시험에 대한 모든 학생의 시험 결과 조회
    @GetMapping("/examResultsByExamId")
    public ResponseEntity<List<StudentExamResult>> getExamResultsByExamId(
        @RequestParam("examId") int examId) {
        
        List<StudentExamResult> results = examService.getExamResultsByExamId(examId);
        return ResponseEntity.ok(results);
    }

 // ✅ classId로 전체 시험 목록 조회 (studentId 없이)
    @GetMapping("/all")
    public ResponseEntity<List<Exam>> getAllExams(@RequestParam("classId") int classId) {
        List<Exam> exams = examService.getAllExamsByClassId(classId);
        return ResponseEntity.ok(exams); // ✅ 배열 형태로 바로 반환
    }

}