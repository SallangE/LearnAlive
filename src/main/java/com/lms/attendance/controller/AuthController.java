package com.lms.attendance.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lms.attendance.model.LoginRequest;
import com.lms.attendance.model.Student;
import com.lms.attendance.service.AuthService;
import com.lms.attendance.service.StudentService;
import com.lms.attendance.util.JwtUtil;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final StudentService studentService;
    private final JwtUtil jwtUtil;
    
    public AuthController(AuthService authService, StudentService studentService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.studentService = studentService;
        this.jwtUtil = jwtUtil;
    }

 // ✅ 학습자(학생) 회원가입
    @PostMapping("/register/student")
    public ResponseEntity<?> registerStudent(@RequestBody Student student) {
    	System.out.println("회원가입 요청 받은 학생 정보: " + student);
        try {
            studentService.registerStudent(student);
            return ResponseEntity.ok(Map.of("success", true, "message", "학생 회원가입 성공!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "학생 회원가입 실패!"));
        }
    }

  //학습자 학번 중복확인
    @PostMapping("/checkStudentId")
    public ResponseEntity<?> checkStudentId(@RequestBody Map<String, String> request) {
        String studentId = request.get("studentId");
        if (studentId == null || studentId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "학번을 입력하세요."));
        }
        // StudentService의 findStudentById 메서드를 사용하여 중복 확인
        Student existingStudent = studentService.findStudentById(studentId);
        boolean available = (existingStudent == null);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("🔐 [로그인 요청] ID: " + request.getUserId());

        try {
            if ("admin".equalsIgnoreCase(request.getUserId())) {
                System.out.println("📛 [관리자 로그인 시도]");

                String adminPassword = authService.getAdminPasswordById(request.getUserId());
                if (adminPassword == null || !authService.isPasswordValid(request.getPassword(), adminPassword)) {
                    System.out.println("❌ [실패] 관리자 비밀번호 불일치 또는 null");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("success", false, "message", "잘못된 관리자 비밀번호입니다."));
                }

                String role = "admin";
                String roleInKorean = "관리자";

                String token = jwtUtil.generateToken(request.getUserId(), role);
                System.out.println("✅ [성공] 관리자 로그인 완료");

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "로그인 성공",
                        "role", role,
                        "username", roleInKorean,
                        "userId", request.getUserId(),
                        "token", token
                ));
            }

            System.out.println("👤 [일반 사용자 로그인 시도] ID: " + request.getUserId());

            String role = authService.authenticate(request.getUserId(), request.getPassword());
            if (role == null) {
                System.out.println("❌ [실패] 일반 사용자 인증 실패");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "잘못된 ID 또는 비밀번호입니다."));
            }

            String name = "admin".equalsIgnoreCase(role) ? null : authService.getUserNameByIdAndRole(request.getUserId(), role);

            String roleInKorean = switch (role.toLowerCase()) {
                case "admin" -> "관리자";
                case "professor" -> "교수자";
                case "student" -> "학생";
                default -> "알 수 없음";
            };

            String token = jwtUtil.generateToken(request.getUserId(), role);
            System.out.println("✅ [성공] 사용자 로그인 완료 - 이름: " + name + ", 역할: " + role);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "로그인 성공",
                    "role", role,
                    "username", name,
                    "userId", request.getUserId(),
                    "token", token
            ));
        } catch (Exception e) {
            System.out.println("❌ [예외 발생] 로그인 처리 중 에러: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "message", "서버 오류로 로그인에 실패했습니다."));
        }
    }

}