package com.lms.attendance.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.lms.attendance.model.Professor;
import com.lms.attendance.service.ProfessorService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/professors")
@RequiredArgsConstructor
public class ProfessorController {

    private final ProfessorService professorService;
    private final BCryptPasswordEncoder passwordEncoder;

    // ✅ 모든 교수 조회 (관리자만 가능)
//    @GetMapping
//    public ResponseEntity<?> getAllProfessors() {
//        if (!isAdmin()) {
//            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자만 조회 가능합니다."));
//        }
//        List<Professor> professors = professorService.getAllProfessors();
//        return ResponseEntity.ok(professors);
//    }

    
    @GetMapping
    public ResponseEntity<?> getAllProfessors() {
        if (!isAdminOrProfessor()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "접근 권한이 없습니다."));
        }
        List<Professor> professors = professorService.getAllProfessors();
        return ResponseEntity.ok(professors);
    }

    private boolean isAdminOrProfessor() {
        String role = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("");
        return "ROLE_ADMIN".equalsIgnoreCase(role) || "ROLE_PROFESSOR".equalsIgnoreCase(role);
    }

    
    
    
    // ✅ 교수 등록 (관리자만 가능)
    @PostMapping("/add")
    public ResponseEntity<?> registerProfessor(@RequestBody Professor professor) {
        if (!isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자만 등록할 수 있습니다."));
        }
        if (professor.getProf_id() == null || professor.getProf_id().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "교수 ID는 필수 입력값입니다."));
        }
        professorService.saveProfessor(professor);
        return ResponseEntity.ok(Map.of("success", true, "message", "교수 등록 완료"));
    }

    // ✅ 교수 정보 수정 (관리자만 가능)
    @PutMapping("/{prof_id}")
    public ResponseEntity<?> updateProfessor(@PathVariable("prof_id") String prof_id,
                                             @RequestBody Professor updatedProfessor) {
        if (!isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자만 수정할 수 있습니다."));
        }

        if (updatedProfessor.getPassword() != null && !updatedProfessor.getPassword().isEmpty()) {
            updatedProfessor.setPassword(passwordEncoder.encode(updatedProfessor.getPassword()));
        }

        professorService.updateProfessor(updatedProfessor);
        return ResponseEntity.ok(Map.of("success", true, "message", "교수 정보 업데이트 성공"));
    }

    // ✅ 교수 삭제 (관리자만 가능)
    @DeleteMapping("/{prof_id}")
    public ResponseEntity<?> deleteProfessor(@PathVariable("prof_id") String prof_id) {
        if (!isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자만 삭제할 수 있습니다."));
        }
        professorService.deleteProfessor(prof_id);
        return ResponseEntity.ok(Map.of("success", true, "message", "교수 삭제 완료"));
    }

    // ✅ ID 찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findProfessorId(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");

        Professor professor = professorService.findByNameAndEmail(name, email);
        if (professor == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "해당 정보와 일치하는 ID가 없습니다."));
        }

        return ResponseEntity.ok(Map.of("success", true, "userId", professor.getProf_id()));
    }

    // ✅ 비밀번호 재설정
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetProfessorPassword(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String name = request.get("name");
        String phone = request.get("phone");
        String newPassword = request.get("newPassword");

        if (userId == null || name == null || phone == null || newPassword == null ||
            userId.isEmpty() || name.isEmpty() || phone.isEmpty() || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "모든 정보를 입력해주세요."));
        }

        Professor professor = professorService.findByIdAndNameAndPhone(userId, name, phone);
        if (professor == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "일치하는 정보를 찾을 수 없습니다."));
        }

        professor.setPassword(newPassword); // 비밀번호는 암호화 로직 포함되어 있음
        professorService.updateProfessor(professor);

        return ResponseEntity.ok(Map.of("success", true, "message", "비밀번호가 성공적으로 재설정되었습니다."));
    }

    // ✅ 현재 사용자 권한이 admin인지 확인
    private boolean isAdmin() {
        String role = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("");
        return "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    @PostConstruct
    public void check() {
        System.out.println("✅✅✅ ProfessorController Bean 생성 완료 ✅✅✅");
    }
}